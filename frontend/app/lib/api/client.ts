/**
 * API client configuration that wraps fetch with base URL and auth
 */

import { getAuthHeader } from '../auth/token';
import { createClient } from '../supabase/client';

// Get API base URL from environment variable
const getApiBaseUrl = () => {
  // Next.jsの環境変数はビルド時に置換される
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

  if (typeof window !== 'undefined') {
    console.log('[API Client] Using API URL:', apiUrl || 'EMPTY (will use relative URLs)');
  }

  return apiUrl;
};

/**
 * Custom fetch wrapper that adds base URL and authentication
 */
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  // Build full URL
  const apiBaseUrl = getApiBaseUrl();
  const fullUrl = apiBaseUrl ? `${apiBaseUrl}${url}` : url;

  // Get auth headers
  const authHeaders = await getAuthHeader();

  // Merge headers
  const headers = {
    ...(options?.headers || {}),
    ...authHeaders,
  };

  // Make request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Handle 401 errors
  if (response.status === 401 && !url.includes('/users/me')) {
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch (error) {
        console.error('Failed to sign out on 401:', error);
      }
    }
  }

  return response;
}

// Override global fetch for API calls
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  // Intercept fetch calls to API routes
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // If it's an API call (starts with /api/), use our custom fetch
    if (url.startsWith('/api/')) {
      console.log('[API Client] Intercepting API call to:', url);
      return apiFetch(url, init);
    }

    // Otherwise use original fetch
    return originalFetch(input, init);
  };

  // Initialize and log configuration
  console.log('[API Client] Initialized with base URL:', getApiBaseUrl() || 'NONE (using relative URLs)');
}
