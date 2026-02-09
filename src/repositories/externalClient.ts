import { createClient } from '@supabase/supabase-js';

const EXTERNAL_URL = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const EXTERNAL_KEY = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;

if (!EXTERNAL_URL || !EXTERNAL_KEY) {
  console.warn('External Supabase credentials not configured. Falling back to default client.');
}

export const externalSupabase = createClient(
  EXTERNAL_URL || '',
  EXTERNAL_KEY || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
