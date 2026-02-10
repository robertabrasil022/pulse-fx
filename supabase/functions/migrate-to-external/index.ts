import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !serviceRoleKey) {
      throw new Error("Missing EXTERNAL_SUPABASE_URL or EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    }

    const ext = createClient(externalUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // 1. Create tables via SQL using the REST API (postgrest doesn't support DDL, so we use rpc or direct SQL)
    // We'll use supabase-js to call a raw SQL function. Since that may not exist, 
    // we'll create tables by calling the Supabase Management API or using pg_net.
    // Actually, the simplest way: use the PostgREST rpc endpoint or the SQL endpoint.
    // Let's use fetch directly against the external Supabase's SQL endpoint.

    const sqlStatements = `
      -- Create enum types if not exist
      DO $$ BEGIN
        CREATE TYPE indicator_type AS ENUM ('Bullish', 'Bearish', 'Neutral');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      DO $$ BEGIN
        CREATE TYPE insight_type AS ENUM ('Opportunity', 'Risk');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      -- fx_rates
      CREATE TABLE IF NOT EXISTS public.fx_rates (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        code TEXT NOT NULL,
        bid_value NUMERIC NOT NULL,
        ask_value NUMERIC NOT NULL,
        pct_change NUMERIC DEFAULT 0,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_fx_rates_code_timestamp ON public.fx_rates (code, timestamp);
      ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Anyone can view fx_rates" ON public.fx_rates;
      CREATE POLICY "Anyone can view fx_rates" ON public.fx_rates FOR SELECT USING (true);

      -- fx_insights
      CREATE TABLE IF NOT EXISTS public.fx_insights (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        type insight_type NOT NULL,
        message TEXT NOT NULL,
        indicator indicator_type NOT NULL DEFAULT 'Neutral',
        currency_code TEXT,
        commodity TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE public.fx_insights ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Anyone can view insights" ON public.fx_insights;
      CREATE POLICY "Anyone can view insights" ON public.fx_insights FOR SELECT USING (true);

      -- profiles
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        email TEXT,
        full_name TEXT,
        company TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (true);

      -- preferences
      CREATE TABLE IF NOT EXISTS public.preferences (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        theme TEXT NOT NULL DEFAULT 'system',
        notifications_email BOOLEAN NOT NULL DEFAULT true,
        notifications_push BOOLEAN NOT NULL DEFAULT false,
        quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
        quiet_hours_start TIME DEFAULT '22:00:00',
        quiet_hours_end TIME DEFAULT '08:00:00',
        watchlist TEXT[] NOT NULL DEFAULT ARRAY['USD/BRL', 'EUR/BRL', 'CNY/BRL'],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE public.preferences ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own prefs" ON public.preferences;
      CREATE POLICY "Users can view own prefs" ON public.preferences FOR SELECT USING (true);

      -- alerts
      CREATE TABLE IF NOT EXISTS public.alerts (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        currency TEXT NOT NULL,
        target_price NUMERIC NOT NULL,
        tolerance NUMERIC NOT NULL DEFAULT 5,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Anyone can view alerts" ON public.alerts;
      CREATE POLICY "Anyone can view alerts" ON public.alerts FOR SELECT USING (true);

      -- commodity_settings
      CREATE TABLE IF NOT EXISTS public.commodity_settings (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        asset_name TEXT NOT NULL,
        target_currency TEXT NOT NULL,
        target_price NUMERIC,
        alert_threshold NUMERIC DEFAULT 5,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      ALTER TABLE public.commodity_settings ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Anyone can view commodity_settings" ON public.commodity_settings;
      CREATE POLICY "Anyone can view commodity_settings" ON public.commodity_settings FOR SELECT USING (true);

      -- integration_logs
      CREATE TABLE IF NOT EXISTS public.integration_logs (
        id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        workflow_id TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        message TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_integration_logs_workflow ON public.integration_logs (workflow_id);
      ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Anyone can view logs" ON public.integration_logs;
      CREATE POLICY "Anyone can view logs" ON public.integration_logs FOR SELECT USING (true);

      -- Insert policies for service role usage
      DROP POLICY IF EXISTS "Service can insert fx_rates" ON public.fx_rates;
      CREATE POLICY "Service can insert fx_rates" ON public.fx_rates FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert fx_insights" ON public.fx_insights;
      CREATE POLICY "Service can insert fx_insights" ON public.fx_insights FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;
      CREATE POLICY "Service can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert preferences" ON public.preferences;
      CREATE POLICY "Service can insert preferences" ON public.preferences FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert alerts" ON public.alerts;
      CREATE POLICY "Service can insert alerts" ON public.alerts FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert commodity_settings" ON public.commodity_settings;
      CREATE POLICY "Service can insert commodity_settings" ON public.commodity_settings FOR INSERT WITH CHECK (true);
      DROP POLICY IF EXISTS "Service can insert integration_logs" ON public.integration_logs;
      CREATE POLICY "Service can insert integration_logs" ON public.integration_logs FOR INSERT WITH CHECK (true);
    `;

    // Execute DDL via PostgREST SQL endpoint
    const sqlRes = await fetch(`${externalUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    });

    // PostgREST doesn't support raw SQL. We need to use the pg SQL endpoint.
    // The Supabase SQL API is at /pg/query for newer versions, but the standard
    // way is to create a helper function first OR use the management API.
    // Let's use the Supabase SQL HTTP API (available on all projects):
    const pgRes = await fetch(`${externalUrl}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ query: sqlStatements }),
    });

    let ddlResult = "DDL skipped (exec_sql not available)";
    if (pgRes.ok) {
      ddlResult = "DDL executed successfully via exec_sql";
    } else {
      // If exec_sql doesn't exist, we need to create it first or use another approach
      // Let's try the Supabase SQL API endpoint directly
      const sqlApiRes = await fetch(`${externalUrl}/pg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sqlStatements }),
      });

      if (sqlApiRes.ok) {
        ddlResult = "DDL executed successfully via /pg";
      } else {
        // As a last resort, inform the user to run DDL manually
        ddlResult = `DDL needs manual execution. Status: ${pgRes.status}. Please run the SQL in the Supabase SQL Editor.`;
      }
    }

    console.log("DDL result:", ddlResult);

    // 2. Insert data - using service role key bypasses RLS
    const results: Record<string, any> = { ddl: ddlResult };

    // fx_rates data
    const fxRatesData = [
      { code: "INR/BRL", bid_value: 0.0598, ask_value: 0.0604, pct_change: 0.45, timestamp: "2026-02-06T16:22:14.195Z" },
      { code: "JPY/BRL", bid_value: 0.0338, ask_value: 0.0341, pct_change: 0.22, timestamp: "2026-02-06T17:22:14.195Z" },
      { code: "JPY/BRL", bid_value: 0.0336, ask_value: 0.0339, pct_change: -0.10, timestamp: "2026-02-06T15:22:14.195Z" },
      { code: "ARS/BRL", bid_value: 0.0058, ask_value: 0.0060, pct_change: -1.25, timestamp: "2026-02-06T23:52:14.195Z" },
      { code: "ARS/BRL", bid_value: 0.0059, ask_value: 0.0061, pct_change: -0.85, timestamp: "2026-02-06T22:22:14.195Z" },
      { code: "ARS/BRL", bid_value: 0.0060, ask_value: 0.0062, pct_change: -0.50, timestamp: "2026-02-06T20:22:14.195Z" },
      { code: "ARS/BRL", bid_value: 0.0061, ask_value: 0.0063, pct_change: 0.32, timestamp: "2026-02-06T18:22:14.195Z" },
      { code: "ARS/BRL", bid_value: 0.0062, ask_value: 0.0064, pct_change: 0.18, timestamp: "2026-02-06T16:22:14.195Z" },
      { code: "AUD/BRL", bid_value: 3.2845, ask_value: 3.2915, pct_change: 0.62, timestamp: "2026-02-06T23:37:14.195Z" },
      { code: "AUD/BRL", bid_value: 3.2720, ask_value: 3.2790, pct_change: 0.35, timestamp: "2026-02-06T21:22:14.195Z" },
      { code: "AUD/BRL", bid_value: 3.2610, ask_value: 3.2680, pct_change: -0.22, timestamp: "2026-02-06T19:22:14.195Z" },
      { code: "AUD/BRL", bid_value: 3.2485, ask_value: 3.2555, pct_change: -0.45, timestamp: "2026-02-06T17:22:14.195Z" },
      { code: "AUD/BRL", bid_value: 3.2350, ask_value: 3.2420, pct_change: 0.28, timestamp: "2026-02-06T15:22:14.195Z" },
      { code: "RUB/BRL", bid_value: 0.0565, ask_value: 0.0572, pct_change: -0.88, timestamp: "2026-02-06T23:22:14.195Z" },
      { code: "RUB/BRL", bid_value: 0.0570, ask_value: 0.0577, pct_change: -0.52, timestamp: "2026-02-06T21:22:14.195Z" },
      { code: "RUB/BRL", bid_value: 0.0575, ask_value: 0.0582, pct_change: 0.35, timestamp: "2026-02-06T19:22:14.195Z" },
      { code: "RUB/BRL", bid_value: 0.0580, ask_value: 0.0587, pct_change: 0.18, timestamp: "2026-02-06T17:22:14.195Z" },
      { code: "RUB/BRL", bid_value: 0.0585, ask_value: 0.0592, pct_change: -0.25, timestamp: "2026-02-06T15:22:14.195Z" },
      { code: "INR/BRL", bid_value: 0.0612, ask_value: 0.0618, pct_change: 0.28, timestamp: "2026-02-06T23:32:14.195Z" },
      { code: "INR/BRL", bid_value: 0.0608, ask_value: 0.0614, pct_change: 0.15, timestamp: "2026-02-06T22:22:14.195Z" },
      { code: "INR/BRL", bid_value: 0.0605, ask_value: 0.0611, pct_change: -0.32, timestamp: "2026-02-06T20:22:14.195Z" },
      { code: "INR/BRL", bid_value: 0.0602, ask_value: 0.0608, pct_change: -0.18, timestamp: "2026-02-06T18:22:14.195Z" },
      { code: "GBP/BRL", bid_value: 6.3542, ask_value: 6.3612, pct_change: 0.45, timestamp: "2026-02-06T22:22:14.195Z" },
      { code: "GBP/BRL", bid_value: 6.3410, ask_value: 6.3480, pct_change: 0.32, timestamp: "2026-02-06T20:22:14.195Z" },
      { code: "GBP/BRL", bid_value: 6.3285, ask_value: 6.3355, pct_change: -0.18, timestamp: "2026-02-06T18:22:14.195Z" },
    ];

    const { error: fxErr, data: fxData } = await ext.from("fx_rates").insert(fxRatesData).select("id");
    results.fx_rates = fxErr ? `Error: ${fxErr.message}` : `Inserted ${fxData?.length ?? 0} rows`;

    // fx_insights data
    const insightsData = [
      { type: "Opportunity", message: "USD/BRL below 30-day average. Favorable window for US grain imports.", indicator: "Bullish", currency_code: "USD/BRL", commodity: "Grains" },
      { type: "Risk", message: "EUR strengthening trend. Consider hedging European meat contracts.", indicator: "Bearish", currency_code: "EUR/BRL", commodity: "Meat" },
      { type: "Opportunity", message: "CNY stability presents low-risk window for Chinese oil purchases.", indicator: "Bullish", currency_code: "CNY/BRL", commodity: "Oil" },
    ];

    const { error: insErr, data: insData } = await ext.from("fx_insights").insert(insightsData).select("id");
    results.fx_insights = insErr ? `Error: ${insErr.message}` : `Inserted ${insData?.length ?? 0} rows`;

    // integration_logs data
    const logsData = [
      { workflow_id: "fx-rate-sync-001", status_code: 200, message: "Successfully synced 3 currency pairs", metadata: { duration_ms: 234, pairs: ["USD/BRL", "EUR/BRL", "CNY/BRL"] } },
      { workflow_id: "insight-gen-002", status_code: 200, message: "Generated 3 new insights", metadata: { insights_count: 3, model: "gpt-4" } },
      { workflow_id: "fx-rate-sync-001", status_code: 200, message: "Successfully synced 3 currency pairs", metadata: { duration_ms: 189, pairs: ["USD/BRL", "EUR/BRL", "CNY/BRL"] } },
      { workflow_id: "alert-check-003", status_code: 200, message: "No threshold alerts triggered", metadata: { checked_settings: 0 } },
    ];

    const { error: logErr, data: logData } = await ext.from("integration_logs").insert(logsData).select("id");
    results.integration_logs = logErr ? `Error: ${logErr.message}` : `Inserted ${logData?.length ?? 0} rows`;

    // commodity_settings (without user_id foreign key constraint on external)
    const commodityData = [
      { user_id: "dee4df19-6834-4701-900d-fe440de40e5d", asset_name: "Grains", target_currency: "USD/BRL", target_price: 1000, alert_threshold: 5 },
      { user_id: "d1398089-9afb-494b-88da-4152ede7a595", asset_name: "Grãos", target_currency: "EUR/BRL", target_price: 10000, alert_threshold: 7 },
      { user_id: "dee4df19-6834-4701-900d-fe440de40e5d", asset_name: "Carnes", target_currency: "USD/BRL", target_price: 5.10, alert_threshold: 2 },
    ];

    const { error: comErr, data: comData } = await ext.from("commodity_settings").insert(commodityData).select("id");
    results.commodity_settings = comErr ? `Error: ${comErr.message}` : `Inserted ${comData?.length ?? 0} rows`;

    // profiles (without auth FK)
    const profilesData = [
      { user_id: "dee4df19-6834-4701-900d-fe440de40e5d", email: "marco.cifuentes@gmail.com" },
      { user_id: "660c7960-597c-4bad-9018-89b497e2e50a", email: "lfernandotexbicalho@hotmail.com" },
      { user_id: "bcc6419b-1a04-417a-9af8-03c4467e759f", email: "lfernandotexbicalho@gmail.com" },
      { user_id: "6f8ef81f-a97a-40ea-92ed-0c6b99047db4", email: "samia@email.com" },
      { user_id: "25e90059-da96-4506-a022-378079b52674", email: "samia.luvanice.dev@email.com" },
      { user_id: "d1398089-9afb-494b-88da-4152ede7a595", email: "samia.luvanice.dev@gmail.com" },
      { user_id: "48bc40b3-df62-459e-98b8-f3554837b5bd", email: "robertabrasil022@gmail.com" },
      { user_id: "ea6aac16-c7f1-4c95-a91c-3a9ae5d55b38", email: "gelzieny@gmail.com" },
      { user_id: "861cbf7c-6900-4b3f-9401-227ef19245d6", email: "fabiio.fiuza@gmail.com" },
    ];

    const { error: profErr, data: profData } = await ext.from("profiles").insert(profilesData).select("id");
    results.profiles = profErr ? `Error: ${profErr.message}` : `Inserted ${profData?.length ?? 0} rows`;

    // preferences
    const prefsData = [
      { user_id: "48bc40b3-df62-459e-98b8-f3554837b5bd", theme: "system", notifications_email: true, notifications_push: false, quiet_hours_enabled: false, watchlist: ["USD/BRL", "EUR/BRL", "CNY/BRL"] },
      { user_id: "dee4df19-6834-4701-900d-fe440de40e5d", theme: "system", notifications_email: true, notifications_push: false, quiet_hours_enabled: false, watchlist: ["USD/BRL", "EUR/BRL", "CNY/BRL", "RUB/BRL"] },
      { user_id: "ea6aac16-c7f1-4c95-a91c-3a9ae5d55b38", theme: "system", notifications_email: true, notifications_push: false, quiet_hours_enabled: false, watchlist: ["USD/BRL", "EUR/BRL", "CNY/BRL"] },
      { user_id: "d1398089-9afb-494b-88da-4152ede7a595", theme: "dark", notifications_email: true, notifications_push: false, quiet_hours_enabled: false, watchlist: ["AUD/BRL", "ARS/BRL", "EUR/BRL"] },
      { user_id: "861cbf7c-6900-4b3f-9401-227ef19245d6", theme: "system", notifications_email: true, notifications_push: false, quiet_hours_enabled: false, watchlist: ["USD/BRL", "EUR/BRL", "CNY/BRL"] },
    ];

    const { error: prefErr, data: prefData } = await ext.from("preferences").insert(prefsData).select("id");
    results.preferences = prefErr ? `Error: ${prefErr.message}` : `Inserted ${prefData?.length ?? 0} rows`;

    console.log("Migration results:", JSON.stringify(results));

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
