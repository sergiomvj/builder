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

  // Singleton pattern for browser client to avoid multiple instances warning
  if (isBrowser) {
    if (!(window as any).__supabaseClient) {
      (window as any).__supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (window as any).__supabaseClient;
  }

  // Server-side logic
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const shouldUseServiceKey = !!(serviceKey && serviceKey.startsWith('eyJ'));

  if (shouldUseServiceKey) {
    // Use Service Key with explicit no-persistence for server
    return createClient(supabaseUrl, serviceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }

  // Fallback to Anon Key (e.g. if Service Key missing on server)
  return createClient(supabaseUrl, supabaseAnonKey);
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

