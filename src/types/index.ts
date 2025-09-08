// types/polymarket.ts

import { MarketSlug } from "./market";

export interface PolymarketEvent {
  id: string;
  ticker: string;
  slug: string;
  title: string;
  description: string;
  resolutionSource: string;
  startDate: string;        // ISO date string
  creationDate: string;     // ISO date string
  endDate: string;          // ISO date string
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number | string;
  volume: number | string;
  openInterest?: number;
  createdAt?: string;
  updatedAt?: string;
  competitive?: number;
  volume24hr?: number;
  volume1wk?: number;
  volume1mo?: number;
  volume1yr?: number;
  enableOrderBook?: boolean;
  liquidityClob?: number | string;
  negRisk?: boolean;
  commentCount?: number;
  markets: MarketSlug[];        // important: multiple markets
  tags?: Tag[];
  cyom?: boolean;
  showAllOutcomes?: boolean;
  showMarketImages?: boolean;
  enableNegRisk?: boolean;
  automaticallyActive?: boolean;
  gmpChartMode?: string;
  negRiskAugmented?: boolean;
  pendingDeployment?: boolean;
  deploying?: boolean;
  // allow extra fields if needed
  [k: string]: unknown;
}



export interface ClobReward {
  id: string;
  conditionId?: string;
  assetAddress?: string;
  rewardsAmount?: number;
  rewardsDailyRate?: number;
  startDate?: string;
  endDate?: string;
  [k: string]: unknown;
}

export interface Tag {
  id: string;
  label: string;
  slug: string;
  forceShow?: boolean;
  publishedAt?: string;
  updatedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  forceHide?: boolean;
  [k: string]: unknown;
}
