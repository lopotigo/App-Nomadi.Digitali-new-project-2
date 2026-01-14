import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    sb?: SupabaseClient | null;
  }
}

/**
 * Legge le env Vite:
 * - VITE_SUPABASE_URL
 * - VITE_SUPABASE_ANON_KEY
 */

console.debug('VITE env (debug):', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
});

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let sb: SupabaseClient | null = null;

if (typeof window !== 'undefined') {
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
      window.sb = sb;
      console.info('Supabase client initialized', SUPABASE_URL);
    } else {
      window.sb = null;
      console.warn(
        'Supabase config missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env'
      );
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client', err);
    window.sb = null;
    sb = null;
  }
}

export default sb;
export const supabase = sb;

export function getSupabaseClient(): SupabaseClient {
  if (!sb) {
    throw new Error(
      'Supabase client not initialized. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set and supabaseClient module is imported early (e.g. in main.tsx).'
    );
  }
  return sb;
}