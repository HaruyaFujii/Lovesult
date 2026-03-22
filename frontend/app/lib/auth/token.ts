import { createClient } from '../supabase/client';

/**
 * 認証トークンを取得する関数
 * AuthProviderコンテキスト外でも使用可能
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();

    // リトライロジック
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          if (error.message?.includes('Lock') && attempts < maxAttempts - 1) {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 200 * attempts));
            continue;
          }
          console.error('Token retrieval error:', error);
          return null;
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
          await new Promise((resolve) => setTimeout(resolve, 200 * attempts));
          continue;
        }
        throw innerError;
      }
    }

    return null;
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
