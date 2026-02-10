import { createClient } from "@supabase/supabase-js";

const EXTERNAL_URL = "https://rfqiscwtqdjjbwaplsbi.supabase.co";
const EXTERNAL_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcWlzY3d0cWRqamJ3YXBsc2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTc1NjIsImV4cCI6MjA4NjMzMzU2Mn0.vgElajLqG2FmRmaqBmdWvfXzCCYttT6nBVPyRRE0IZA";

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "external-supabase-auth",
  },
});
