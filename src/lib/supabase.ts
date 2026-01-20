import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Check if we are in the browser
  const isBrowser = typeof window !== 'undefined';

  // Prefer Service Role Key for backend operations to bypass RLS (Server-side only)
  // Note: If supabaseServiceKey is invalid (e.g. placeholder text), it will cause 'Invalid API key' error.
  // We should only use it if it looks like a real JWT (starts with eyJ)
  const shouldUseServiceKey = !isBrowser && supabaseServiceKey && supabaseServiceKey.startsWith('eyJ');
  const keyToUse = shouldUseServiceKey ? supabaseServiceKey : supabaseAnonKey;
  
  if (process.env.NODE_ENV === 'development' && !isBrowser) {
    if (!shouldUseServiceKey) {
       console.warn('WARN: Using Anon Key on Server. Service Role Key missing or invalid. RLS may block writes.');
    } else {
       console.log('INFO: Using Service Role Key for Supabase connection.');
    }
  }

  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`Invalid URL format: '${supabaseUrl}'`);
  }

  // Singleton pattern for browser client to avoid multiple instances warning
  if (isBrowser) {
    if (!(window as any).__supabaseClient) {
      (window as any).__supabaseClient = createClient(supabaseUrl, keyToUse);
    }
    return (window as any).__supabaseClient;
  }

  return createClient(supabaseUrl, keyToUse);
}

// Export a default client for backward compatibility
export const supabase = getSupabase();
