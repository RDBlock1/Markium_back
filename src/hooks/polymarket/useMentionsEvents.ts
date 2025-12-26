// src/hooks/polymarket/useMentionsEvents.ts
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface MentionsEvent {
  id: string;
  title: string;
  icon: string;
  image: string;
  startTime?: string;
  startDate: string;
  volume: number;
  slug: string;
  streamStatus: 'LIVE' | 'UPCOMING' | 'ENDED';
  statusPills: Array<{
    type: string;
    status?: string;
    startTime?: string;
    volume?: string;
  }>;
  markets: Array<{
    groupItemTitle: string;
    slug: string;
    outcomes: string;
    outcomePrices: string;
    umaResolutionStatus?: string;
  }>;
}

async function fetchMentionsEvents(offset: number = 0) {
  const response = await api.get('/events/mentions', {
    params: {
      offset,
      limit: 20
    }
  });


  // ⭐ Response is now clean: { success: true, data: [...events] }
  return response.data.data; // Return the events array directly
}

export function useInfiniteMentionsEvents() {
  return useInfiniteQuery({
    queryKey: ['events', 'mentions', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchMentionsEvents(pageParam),
    getNextPageParam: (lastPage, allPages) => {
      // ⭐ lastPage is now directly the events array
      const events = Array.isArray(lastPage) ? lastPage : [];
      
      // If we got 20 events, there might be more
      const hasMore = events.length >= 20;
      
      return hasMore ? allPages.length * 20 : undefined;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 3,
  });
}

export type { MentionsEvent };