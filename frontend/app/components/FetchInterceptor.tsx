'use client';

import { useEffect } from 'react';

export function FetchInterceptor() {
  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      // If it's an API call and we have a base URL, prepend it
      if (url.startsWith('/api/') && apiBaseUrl) {
        let baseUrl = apiBaseUrl;

        // Ensure proper protocol
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          baseUrl = `https://${baseUrl}`;
        }

        // Remove trailing slash
        baseUrl = baseUrl.replace(/\/$/, '');

        const fullUrl = `${baseUrl}${url}`;

        // Import auth header dynamically
        const { getAuthHeader } = await import('@/lib/auth/token');
        const authHeaders = await getAuthHeader();

        const headers = {
          ...((init?.headers as Record<string, string>) || {}),
          ...authHeaders,
        };

        const response = await originalFetch(fullUrl, {
          ...init,
          headers,
        });

        // Handle 401
        if (response.status === 401 && !url.includes('/users/me')) {
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            try {
              const { createClient } = await import('@/lib/supabase/client');
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/login';
            } catch {
              // Silently fail
            }
          }
        }

        return response;
      }

      // Otherwise use original fetch
      return originalFetch(input, init);
    };
  }, []);

  return null;
}
