import { createClient } from '@supabase/supabase-js';

const EXTERNAL_URL = 'https://ushuokkihztldkcwspck.supabase.co';
const EXTERNAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaHVva2tpaHp0bGRrY3dzcGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Nzc5NTcsImV4cCI6MjA4NjE1Mzk1N30.0c-plZCr4veIdtOCDG9RvZGOy7ZtoebOvdQIxLNG4rU';

export const externalSupabase = createClient(EXTERNAL_URL, EXTERNAL_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'external-supabase-auth',
  },
});
