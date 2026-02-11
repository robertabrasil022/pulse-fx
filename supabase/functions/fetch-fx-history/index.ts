import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

    // Fetch sequentially to avoid rate limiting
    const results: { currency: string; data: any[] }[] = [];

    for (const currency of currencies) {
      const pair = currency.replace("/", "-");
      const tokenParam = awesomeApiKey ? `?token=${awesomeApiKey}` : "";
      const url = `https://economia.awesomeapi.com.br/json/daily/${pair}/${numDays}${tokenParam}`;

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
              date: new Date(parseInt(item.timestamp) * 1000).toISOString().split("T")[0],
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
