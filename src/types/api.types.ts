// src/types/api.types.ts

export interface Market {
  id: string;
  question: string;
  slug: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: number;
  volume24hr: number;
  liquidity: number;
  conditionId: string;
  groupItemTitle: string | null;
}

export interface Event {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  totalVolume24hr: number;
  totalVolume: number;
  totalLiquidity: number;
  volume1wk: number;
  volume1mo: number;
  startDate: string | null;
  endDate: string | null;
  image: string | null;
  icon: string | null;
  tier: 'HOT' | 'ACTIVE' | 'NORMAL' | 'INACTIVE';
  featured: boolean;
  category: string | null;
  markets: Market[];
  tags: Tag[];
}

export interface Tag {
  id: string;
  label: string;
  slug: string;
}

export interface EventsByTagResponse {
  success: boolean;
  data: {
    events: Event[];
    tag: Tag;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  meta: {
    timestamp: string;
  };
}

export interface EventsByTagParams {
  tagSlug: string;
  minVolume24hr?: number;
  minLiquidity?: number;
  active?: boolean;
  tier?: 'HOT' | 'ACTIVE' | 'NORMAL' | 'INACTIVE';
  limit?: number;
  offset?: number;
}