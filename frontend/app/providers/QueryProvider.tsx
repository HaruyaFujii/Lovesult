'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const ReactQueryDevtools = dynamic(
  () =>
    import('@tanstack/react-query-devtools').then((mod) => ({ default: mod.ReactQueryDevtools })),
  { ssr: false }
);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Remove default staleTime to allow individual queries to control caching
            // staleTime: 60 * 1000, // Removed to prevent caching issues
            refetchOnWindowFocus: false,
            retry: 1, // Reduce retries for faster error feedback
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
