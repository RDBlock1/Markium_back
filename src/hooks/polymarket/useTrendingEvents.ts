// hooks/useTrendingEvents.ts
'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TrendingEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  active: boolean;
  closed: boolean;
  featured: boolean;
  featuredOrder: number | null;
  totalVolume: number;
  totalVolume24hr: number;
  totalLiquidity: number;
  volume1wk: number;
  volume1mo: number;
  category: string | null;
  tier: string;
  markets: Market[];
  tags: Tag[];
  _polymarketVolume24hr?: number;
}

interface Market {
  id: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  volume24hr: number;
  liquidity: number;
  groupItemTitle: string | null;
}

interface Tag {
  id: string;
  label: string;
  slug: string;
}

interface TrendingEventsResponse {
  success: boolean;
  data: {
    events: TrendingEvent[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  meta: {
    queryTime: string;
    timestamp: string;
  };
}

interface TrendingEventsParams {
  limit?: number;
  offset?: number;
  tagSlug?: string;
  featured?: boolean;
}

/**
 * ⭐ Fetch trending events (standard pagination)
 */
async function fetchTrendingEvents(
  params: TrendingEventsParams
): Promise<TrendingEventsResponse> {
  const response = await api.get<TrendingEventsResponse>('/events/trending', {
    params: {
      limit: params.limit || 50,
      offset: params.offset || 0,
      tag_slug: params.tagSlug,
      featured: params.featured
    }
  });
  
  return response.data;
}

/**
 * ⭐ Hook: Get trending events with pagination
 * 
 * @example
 * const { data, isLoading } = useTrendingEvents({ limit: 50, tagSlug: 'crypto' });
 */
export function useTrendingEvents(params: TrendingEventsParams = {}) {
  return useQuery({
    queryKey: ['events', 'trending', params],
    queryFn: () => fetchTrendingEvents(params),
    staleTime: 30 * 1000,      // Fresh for 30 seconds
    gcTime: 5 * 60 * 1000,     // Cache for 5 minutes
    refetchInterval: 60 * 1000, // Auto-refetch every 60 seconds
    retry: 3,
  });
}

/**
 * ⭐ Hook: Get featured events only
 * 
 * @example
 * const { data, isLoading } = useFeaturedEvents({ limit: 20 });
 */
export function useFeaturedEvents(params: { limit?: number } = {}) {
  return useQuery({
    queryKey: ['events', 'featured', params.limit],
    queryFn: async () => {
      const response = await api.get<TrendingEventsResponse>('/events/trending', {
        params: { limit: params.limit || 20 }
      });
      return response.data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 3,
  });
}

/**
 * ⭐ Hook: Infinite scroll for trending events
 * 
 * @example
 * const { data, fetchNextPage, hasNextPage } = useInfiniteTrendingEvents({ 
 *   tagSlug: 'crypto', 
 *   limit: 50 
 * });
 */
export function useInfiniteTrendingEvents(
  params: Omit<TrendingEventsParams, 'offset'>
) {
  return useInfiniteQuery({
    queryKey: ['events', 'trending', 'infinite', params],
    queryFn: ({ pageParam = 0 }) =>
      fetchTrendingEvents({ ...params, offset: pageParam }),
    getNextPageParam: (lastPage) => {
      // ⭐ Safe access to pagination data
      const pagination = lastPage?.data?.pagination;
      
      
      if (!pagination) {
        console.error('Invalid response structure. Expected lastPage.data.pagination:', lastPage);
        return undefined;
      }
      
      // Return next offset if there's more data
      return pagination.hasMore
        ? pagination.offset + pagination.limit
        : undefined;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
  });
}

// ⭐ Export types for use in components
export type { TrendingEvent, Market, Tag, TrendingEventsResponse };