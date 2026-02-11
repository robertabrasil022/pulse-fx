import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateToMinute(iso: string) {
  const d = new Date(iso);
  d.setSeconds(0, 0);
  return d.toISOString();
}

function buildMinuteBuckets(rows: Array<{ timestamp: string; bid_value: number; ask_value: number; pct_change: number }>) {
  const buckets = new Map<string, { timestamp: string; bid_value: number; ask_value: number; pct_change: number }>();

  rows.forEach((row) => {
    const minuteKey = truncateToMinute(row.timestamp);
    buckets.set(minuteKey, row);
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

type FxRateRow = {
  code: string;
  bid_value: number;
  ask_value: number;
  pct_change: number;
  timestamp: string;
};

function buildResultsFromRows(currencies: string[], rows: FxRateRow[]) {
  const grouped = new Map<string, Array<{ timestamp: string; bid_value: number; ask_value: number; pct_change: number }>>();

  rows.forEach((row) => {
    const list = grouped.get(row.code) ?? [];
    list.push(row);
    grouped.set(row.code, list);
  });

  return currencies.map((currency) => {
    const bucketed = buildMinuteBuckets(grouped.get(currency) ?? []);
    const dataPoints = bucketed.map((row) => ({
      date: row.timestamp,
      bid: Number(row.bid_value),
      ask: Number(row.ask_value),
      high: Number(row.bid_value),
      low: Number(row.bid_value),
      pctChange: Number(row.pct_change),
      variance: 0,
    }));

    return { currency, data: dataPoints };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currencies, days } = await req.json();

    if (!currencies || !Array.isArray(currencies) || currencies.length === 0) {
      throw new Error("currencies array is required");
    }

    const numDays = Math.min(parseInt(days) || 1, 180);
    const awesomeApiKey = Deno.env.get("AWESOME_API_KEY");

    if (numDays === 1) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
      const serviceRoleKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

      if (externalUrl && serviceRoleKey) {
        const externalSupabase = createClient(externalUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });

        const { data, error } = await externalSupabase
          .from("fx_rates")
          .select("code,bid_value,ask_value,pct_change,timestamp")
          .in("code", currencies)
          .gte("timestamp", since)
          .order("timestamp", { ascending: true });

        if (!error && data && data.length > 0) {
          const results = buildResultsFromRows(currencies, data as FxRateRow[]);
          return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const localUrl = Deno.env.get("SUPABASE_URL");
      const localKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

      if (localUrl && localKey) {
        const localSupabase = createClient(localUrl, localKey, {
          auth: { persistSession: false },
        });

        const { data, error } = await localSupabase
          .from("fx_rates")
          .select("code,bid_value,ask_value,pct_change,timestamp")
          .in("code", currencies)
          .gte("timestamp", since)
          .order("timestamp", { ascending: true });

        if (!error && data && data.length > 0) {
          const results = buildResultsFromRows(currencies, data as FxRateRow[]);
          return new Response(JSON.stringify({ results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Fetch sequentially to avoid rate limiting
    const results: { currency: string; data: any[] }[] = [];
    const intradayPoints = 288;

    for (const currency of currencies) {
      const pair = currency.replace("/", "-");
      const tokenParam = awesomeApiKey ? `?token=${awesomeApiKey}` : "";
      const url = numDays === 1
        ? `https://economia.awesomeapi.com.br/json/list/${pair}/${intradayPoints}${tokenParam}`
        : `https://economia.awesomeapi.com.br/json/daily/${pair}/${numDays}${tokenParam}`;

      console.log(`Fetching: ${url}`);

      try {
        const res = await fetch(url);

        if (!res.ok) {
          console.error(`API error for ${pair}: ${res.status}`);
          results.push({ currency, data: [] });
          // Wait before next request if rate limited
          if (res.status === 429) await delay(1000);
          continue;
        }

        const rawData = await res.json();

        const data = Array.isArray(rawData)
          ? rawData.map((item: any) => ({
              date: new Date(parseInt(item.timestamp) * 1000).toISOString(),
              bid: parseFloat(item.bid),
              ask: parseFloat(item.ask),
              high: parseFloat(item.high),
              low: parseFloat(item.low),
              pctChange: parseFloat(item.pctChange),
              variance: parseFloat(item.varBid),
            }))
          : [];

        results.push({ currency, data });
      } catch (err) {
        console.error(`Error fetching ${pair}:`, err);
        results.push({ currency, data: [] });
      }

      // Small delay between requests to avoid rate limiting
      await delay(300);
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-fx-history error:", error);
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
