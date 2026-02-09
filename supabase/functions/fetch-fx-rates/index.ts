import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CURRENCY_PAIRS = [
  "USD-BRL",
  "EUR-BRL",
  "CNY-BRL",
  "GBP-BRL",
  "JPY-BRL",
  "ARS-BRL",
  "AUD-BRL",
  "RUB-BRL",
  "INR-BRL",
];

// Commodities available on AwesomeAPI
const COMMODITY_CODES = ["XAU", "XAG", "BTC"];

function formatCode(awesomeCode: string): string {
  // USDBRL -> USD/BRL, XAUUSD -> XAU/USD etc.
  if (awesomeCode.length === 6) {
    return `${awesomeCode.slice(0, 3)}/${awesomeCode.slice(3)}`;
  }
  return awesomeCode;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !serviceRoleKey) {
      throw new Error(
        "Missing EXTERNAL_SUPABASE_URL or EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    const externalSupabase = createClient(externalUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Helper: fetch with retry on 429
    async function fetchWithRetry(url: string, retries = 3): Promise<any> {
      for (let i = 0; i < retries; i++) {
        const res = await fetch(url);
        if (res.ok) return res.json();
        if (res.status === 429 && i < retries - 1) {
          console.warn(`Rate limited, waiting ${(i + 1) * 2}s...`);
          await new Promise((r) => setTimeout(r, (i + 1) * 2000));
          continue;
        }
        if (!res.ok) throw new Error(`API error: ${res.status} for ${url}`);
      }
    }

    // 1. Fetch currency rates (split into smaller batches to avoid 429)
    const batch1 = CURRENCY_PAIRS.slice(0, 5);
    const batch2 = CURRENCY_PAIRS.slice(5);

    const currencyData1 = await fetchWithRetry(
      `https://economia.awesomeapi.com.br/json/last/${batch1.join(",")}`
    );

    // Small delay between batches
    await new Promise((r) => setTimeout(r, 1500));

    const currencyData2 = await fetchWithRetry(
      `https://economia.awesomeapi.com.br/json/last/${batch2.join(",")}`
    );

    await new Promise((r) => setTimeout(r, 1500));

    // 2. Fetch commodity rates
    let commodityData: Record<string, any> = {};
    try {
      commodityData = await fetchWithRetry(
        `https://economia.awesomeapi.com.br/json/last/${COMMODITY_CODES.join(",")}`
      );
    } catch (e) {
      console.warn("Commodity fetch failed, continuing with currencies only:", e);
    }

    const allData = { ...currencyData1, ...currencyData2, ...commodityData };

    // 3. Parse and prepare rows
    const rows = Object.entries(allData).map(([key, value]: [string, any]) => {
      const code = formatCode(key);
      const bid = parseFloat(value.bid) || 0;
      const ask = parseFloat(value.ask) || 0;
      const pctChange = parseFloat(value.pctChange) || 0;
      // AwesomeAPI timestamp is Unix seconds
      const ts = value.timestamp
        ? new Date(parseInt(value.timestamp) * 1000).toISOString()
        : new Date().toISOString();

      return {
        code,
        bid_value: bid,
        ask_value: ask,
        pct_change: pctChange,
        timestamp: ts,
      };
    });

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ inserted: 0, message: "No data from API" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert into external fx_rates table
    const { data, error } = await externalSupabase
      .from("fx_rates")
      .insert(rows)
      .select();

    if (error) {
      console.error("Insert error:", error);
      throw new Error(`Insert failed: ${error.message}`);
    }

    console.log(`Successfully inserted ${data?.length ?? 0} rows`);

    return new Response(
      JSON.stringify({
        inserted: data?.length ?? 0,
        codes: rows.map((r) => r.code),
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-fx-rates error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
