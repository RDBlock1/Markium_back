// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // ⭐ SSR-friendly defaults
        staleTime: 60 * 1000,        // Data fresh for 60 seconds
        gcTime: 5 * 60 * 1000,       // Keep in cache for 5 minutes
        retry: 3,                     // Retry failed requests 3 times
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,  // Don't refetch on tab focus (can enable if needed)
        refetchOnReconnect: true,     // Refetch when reconnecting
      },
      mutations: {
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}