/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

const createSupabaseClient = () => {
  // Client-side Supabase client using anon key (safe for browser)
  // Server-side operations should use Netlify Functions with service role key
  const client = createClient(config.VITE_SUPABASE_URL, config.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: true },
    db: { schema: 'public' },
  });
  return client;
};

// Single client instance for browser use
export const supabase = createSupabaseClient();