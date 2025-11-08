/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react"

export interface Market {
  description: ReactNode
  category: any
  id: string
  name: string
  ticker: string
  logo: string
  price: number
  marketCap: number
  volume: number
  change24h: number
  sparklineData: number[]
  status: "active" | "coming_soon"
}

export interface NavItem {
  label: string
  href: string
  active?: boolean
  hasDropdown?: boolean
}


export type SortField = "name" | "price" | "marketCap" | "volume" | "change24h"
export type SortDirection = "asc" | "desc"
export interface Market {
  id: string
  question: string
  slug: string
  image?: string
  outcomes: string[]
  outcomePrices: string
  volume24hr: number
  liquidity: number
  endDate: string
  active: boolean
  spread?: number
  lastTradePrice?: number
  oneDayPriceChange?: number
}

export interface MarketStats {
  totalVolume: number
  activeMarkets: number
  totalLiquidity: number
}

export type Category = "All" | "Politics" | "Sports" | "Crypto" | "Business" | "Science" | "Pop Culture" | "Weather"
export type SortOption = "Volume" | "Liquidity" | "Newest" | "Ending Soon"
export type ViewMode = "Grid" | "List"
export interface Trade {
  id: string
  type: "buy" | "sell"
  outcome: "Yes" | "No"
  price: number
  amount: number
  timestamp: string
  user: string
}

export interface OrderBookEntry {
  price: number
  size: number
  total: number
}

export interface Holder {
  rank: number
  address: string
  position: "Yes" | "No"
  shares: number
  value: number
  pnl: number
}

export interface Comment {
  id: string
  user: string
  avatar: string
  content: string
  timestamp: string
  likes: number
  replies?: Comment[]
}

export interface MarketSlug {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  category: string;
  resolutionSource: string;
  endDate: string; // ISO string
  liquidity: string; // comes as string in API
  startDate: string;
  image: string;
  icon: string;
  description: string;
  outcomes: string; // stringified array: '["Yes","No"]'
  outcomePrices: string; // stringified array: '["0.0015","0.9985"]'
  volume: string;
  active: boolean;
  closed: boolean;
  marketMakerAddress: string;
  createdAt: string;
  updatedAt: string;
  new: boolean;
  featured: boolean;
  submitted_by: string;
  archived: boolean;
  resolvedBy: string;
  restricted: boolean;
  groupItemTitle: string;
  groupItemThreshold: string;
  questionID: string;
  enableOrderBook: boolean;
  orderPriceMinTickSize: number;
  orderMinSize: number;
  volumeNum: number;
  liquidityNum: number;
  endDateIso: string;
  startDateIso: string;
  hasReviewedDates: boolean;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  clobTokenIds: string; // stringified array
  umaBond: string;
  umaReward: string;
  volume24hrClob: number;
  volume1wkClob: number;
  volume1moClob: number;
  volume1yrClob: number;
  volumeClob: number;
  liquidityClob: number;
  acceptingOrders: boolean;
  negRisk: boolean;
  negRiskMarketID: string;
  negRiskRequestID: string;
  events: any[]; // unknown shape, replace with real type if known
  ready: boolean;
  funded: boolean;
  acceptingOrdersTimestamp: string;
  cyom: boolean;
  competitive: number;
  pagerDutyNotificationEnabled: boolean;
  approved: boolean;
  rewardsMinSize: number;
  rewardsMaxSpread: number;
  spread: number;
  lastTradePrice: number;
  bestBid: number;
  bestAsk: number;
  automaticallyActive: boolean;
  clearBookOnStart: boolean;
  seriesColor: string;
  showGmpSeries: boolean;
  showGmpOutcome: boolean;
  manualActivation: boolean;
  negRiskOther: boolean;
  umaResolutionStatuses: string; // stringified array
  pendingDeployment: boolean;
  deploying: boolean;
  rfqEnabled: boolean;
  holdingRewardsEnabled: boolean;
}


export interface PriceReturns {
  investment_amount: number;
  current_price: number;
  potential_payout: number;
  profit: number;
  profit_percentage: string;
}


export interface PositionData {
  market: string;
  outcome: 'Yes' | 'No';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  investedAmount: number;
  pnl: number;
  percentPnl: number;
  potentialWin: number;
  platform: string;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  created_at: string;
  bytes: number;
  [key: string]: any;
}