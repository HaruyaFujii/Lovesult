import { createClient } from '../supabase/client';

// セッションキャッシュ
let sessionCache: { session: any; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30秒

/**
 * 認証トークンを取得する関数
 * AuthProviderコンテキスト外でも使用可能
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // キャッシュが有効な場合は使用
    if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
      return sessionCache.session?.access_token || null;
    }

    const supabase = createClient();

    // リトライロジック
    let attempts = 0;
    const maxAttempts = 2; // 最大試行回数を減らす

    while (attempts < maxAttempts) {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          if (error.message?.includes('Lock') && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 100 * attempts)); // 待機時間を短縮
            continue;
          }
          // エラーログを削除（ノイズを減らす）
          return null;
        }

        // キャッシュを更新
        if (session) {
          sessionCache = { session, timestamp: Date.now() };
        }

        const token = session?.access_token || null;
        return token;
      } catch (innerError) {
        if (
          innerError &&
          typeof innerError === 'object' &&
          'message' in innerError &&
          (innerError.message as string)?.includes('Lock') &&
          attempts < maxAttempts - 1
        ) {
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
          continue;
        }
        throw innerError;
      }
    }

    return null;
  } catch (error) {
    // エラーログを削除（ノイズを減らす）
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
