import { getAuthHeader } from '../auth/token';

export type ErrorType<T = unknown> = T;

const customInstance = async <T>(
  url: string,
  options?: RequestInit & {
    params?: Record<string, string | number>;
    data?: unknown;
    skipAuthRedirect?: boolean;
  }
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    signal,
    body,
    params,
    data: requestData,
    skipAuthRedirect = false,
  } = options || {};

  const queryString = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          },
          {} as Record<string, string>
        )
      ).toString()
    : '';

  // 認証ヘッダーを取得
  const authHeaders = await getAuthHeader();

  const requestHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
    ...authHeaders,
  };

  // FormDataの場合はContent-Typeを設定せずブラウザに任せる
  const isFormData = body instanceof FormData || requestData instanceof FormData;
  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // bodyが設定されている場合はそれを使用、FormDataの場合はそのまま、それ以外はJSON.stringifyで使用
  let requestBody;
  if (body) {
    requestBody = body;
  } else if (requestData instanceof FormData) {
    requestBody = requestData;
  } else if (requestData) {
    requestBody = JSON.stringify(requestData);
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: requestBody,
    signal,
  };

  // Next.jsのrewriteを使用するため、URLはそのまま使用
  const response = await fetch(`${url}${queryString}`, fetchOptions);

  if (!response.ok) {
    let error: { detail?: string; [key: string]: unknown } = {};
    try {
      error = await response.json();
    } catch {
      error = { detail: response.statusText };
    }

    // 401 Unauthorized の場合、認証が無効なのでセッションをクリア
    // ただし、skipAuthRedirectがtrueの場合、またはusers/meへのリクエストの場合はスキップ
    if (response.status === 401 && !skipAuthRedirect && !url.includes('/users/me')) {
      // ログインページにいる場合はサインアウトしない
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        try {
          const { createClient } = await import('../supabase/client');
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.href = '/login';
        } catch (signOutError) {
          console.error('Failed to sign out on 401:', signOutError);
        }
      }
    }

    throw {
      status: response.status,
      data: error,
      message: error.detail || response.statusText,
    };
  }

  // 204 No Content の場合は空を返す
  if (response.status === 204) {
    return { data: {}, status: 204, headers: response.headers } as T;
  }

  const data = await response.json();

  // Orvalが生成する型に合わせて、data, status, headersを含むオブジェクトを返す
  return {
    data,
    status: response.status,
    headers: response.headers,
  } as T;
};

export { customInstance };
export default customInstance;
