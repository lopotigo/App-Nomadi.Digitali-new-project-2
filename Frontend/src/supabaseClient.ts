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
 *
 * Eventualmente imposta anche VITE_SUPABASE_BUCKET in .env (non usato qui direttamente).
 */

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
        // eventualmente altre opzioni...
      });
      window.sb = sb;
      // debug rapido
      // eslint-disable-next-line no-console
      console.info('Supabase client initialized', SUPABASE_URL);
    } else {
      window.sb = null;
      // eslint-disable-next-line no-console
      console.warn(
        'Supabase config missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env'
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize Supabase client', err);
    window.sb = null;
    sb = null;
  }
}

// Export default (può essere null if not configured)
export default sb;
export const supabase = sb;

/**
 * Helper per ottenere il client in modo tipato.
 * Lancia se non c'è il client (utile in parti serverless o per fail-fast).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!sb) {
    throw new Error(
      'Supabase client not initialized. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set and supabaseClient module is imported early (e.g. in main.tsx).'
    );
  }
  return sb;
}