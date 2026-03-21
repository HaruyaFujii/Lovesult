import { createClient } from '../supabase/client';

/**
 * 認証トークンを取得する関数
 * AuthProviderコンテキスト外でも使用可能
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Token retrieval error:', error);
      return null;
    }

    const token = session?.access_token || null;
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * 認証ヘッダーを生成する関数
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
