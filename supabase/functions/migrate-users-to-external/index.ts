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
    const internalUrl = Deno.env.get("SUPABASE_URL");
    const internalServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!externalUrl || !serviceRoleKey || !internalUrl || !internalServiceKey) {
      throw new Error("Missing required environment variables");
    }

    // Internal client to read profiles
    const internal = createClient(internalUrl, internalServiceKey, {
      auth: { persistSession: false },
    });

    // External client with service role to create auth users
    const external = createClient(externalUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Get all profiles from internal DB
    const { data: profiles, error: profError } = await internal
      .from("profiles")
      .select("user_id, email, full_name, company");

    if (profError) throw new Error(`Failed to read profiles: ${profError.message}`);

    const results: Array<{ email: string; status: string }> = [];
    const defaultPassword = "PulseFX@2026!";

    for (const profile of profiles || []) {
      if (!profile.email) {
        results.push({ email: "(no email)", status: "skipped" });
        continue;
      }

      const { data, error } = await external.auth.admin.createUser({
        email: profile.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name || "",
          company: profile.company || "",
          original_user_id: profile.user_id,
        },
      });

      if (error) {
        results.push({ email: profile.email, status: `Error: ${error.message}` });
      } else {
        // Update the profile in external DB to use the new user_id
        const newUserId = data.user.id;
        await external.from("profiles").update({ user_id: newUserId }).eq("user_id", profile.user_id);
        await external.from("preferences").update({ user_id: newUserId }).eq("user_id", profile.user_id);
        await external.from("alerts").update({ user_id: newUserId }).eq("user_id", profile.user_id);
        await external.from("commodity_settings").update({ user_id: newUserId }).eq("user_id", profile.user_id);

        results.push({ email: profile.email, status: `Created (new id: ${newUserId})` });
      }
    }

    console.log("User migration results:", JSON.stringify(results));

    return new Response(JSON.stringify({ defaultPassword, results }, null, 2), {
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
