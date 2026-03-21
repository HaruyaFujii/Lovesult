import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// シングルトンインスタンスを作成
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
        global: {
          headers: {
            'X-Client-Info': 'lovetalk-frontend',
          },
        },
      }
    );
  }
  return supabaseInstance;
};
