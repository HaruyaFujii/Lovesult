// This file must be imported as early as possible
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;

  // Immediately override fetch
  (window as any).__originalFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // If it's an API call and we have a base URL, prepend it
    if (url.startsWith('/api/') && apiBaseUrl) {
      let baseUrl = apiBaseUrl;
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        baseUrl = `https://${baseUrl}`;
      }
      baseUrl = baseUrl.replace(/\/$/, '');

      const fullUrl = `${baseUrl}${url}`;

      // Dynamic import to avoid circular dependencies
      const { getAuthHeader } = await import('@/lib/auth/token');
      const authHeaders = await getAuthHeader();

      const headers = {
        ...((init?.headers as Record<string, string>) || {}),
        ...authHeaders,
      };

      return originalFetch(fullUrl, {
        ...init,
        headers,
      });
    }

    return originalFetch(input, init);
  };
}
