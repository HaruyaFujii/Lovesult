import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  // Server-side Supabase clientはcookie管理なしでシンプルに作成
  // 認証はJWT経由で行うため、ここではAnon Keyのみ使用
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
