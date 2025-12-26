/* eslint-disable @typescript-eslint/no-explicit-any */
// src/hooks/useEventSearch.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  ticker: string;
  image: string | null;
  totalVolume24hr: number;
  tier: string;
  markets: any[];
  tags: any[];
}

/**
 * ⭐ Hook for event search with debouncing
 */
export function useEventSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return useQuery({
    queryKey: ['events', 'search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { events: [], pagination: { total: 0 } };
      }

      const response = await api.get('/events/search', {
        params: {
          q: debouncedQuery,
          limit: 20
        }
      });

      return response.data.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * ⭐ Hook for autocomplete suggestions
 */
export function useSearchSuggestions(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200); // Faster for autocomplete

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['events', 'suggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      const response = await api.get('/events/search/suggestions', {
        params: { q: debouncedQuery }
      });

      return response.data.data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000,
  });
}