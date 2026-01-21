import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const isBrowser = typeof window !== 'undefined';
    if (!isBrowser) {
      console.warn('⚠️ Supabase environment variables missing. Client will be null.');
      return null as any;
    }
    throw new Error('Missing Supabase environment variables');
  }

  // Check if we are in the browser
  const isBrowser = typeof window !== 'undefined';

  // Prefer Service Role Key for backend operations to bypass RLS (Server-side only)
  // Note: If supabaseServiceKey is invalid (e.g. placeholder text), it will cause 'Invalid API key' error.
  // We should only use it if it looks like a real JWT (starts with eyJ)
  let shouldUseServiceKey = !isBrowser && supabaseServiceKey && supabaseServiceKey.startsWith('eyJ');

  // Validation: Check if the key belongs to this project URL
  if (shouldUseServiceKey && !isBrowser) {
    try {
      const payload = JSON.parse(Buffer.from(supabaseServiceKey!.split('.')[1], 'base64').toString());
      const projectRef = supabaseUrl.split('//')[1].split('.')[0];
      if (payload.ref !== projectRef) {
        console.error(`❌ SUPABASE KEY MISMATCH: The provided service_role key belongs to project '${payload.ref}', but your URL is for '${projectRef}'.`);
        console.warn('⚠️ Falling back to Anon Key. Writes may fail due to RLS.');
        shouldUseServiceKey = false;
      }
    } catch (e) {
      console.error('❌ Failed to decode Supabase Service Role Key');
      shouldUseServiceKey = false;
    }
  }

  const keyToUse = shouldUseServiceKey ? supabaseServiceKey! : supabaseAnonKey;

  if (process.env.NODE_ENV === 'development' && !isBrowser) {
    if (!shouldUseServiceKey) {
      console.warn('WARN: Using Anon Key on Server. Service Role Key missing, invalid, or mismatched. RLS may block writes.');
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

// Export a proxy that initializes the client on first access
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) {
      console.warn(`⚠️ Supabase client used but not initialized (accessing ${String(prop)}).`);
      // Return a dummy function to avoid immediate crash if it's a method call
      return () => ({ from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) }) });
    }
    return (client as any)[prop];
  }
});

