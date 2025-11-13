'use server';
import {prisma } from '@/db/prisma';

// Types for Polymarket API response
interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomePrices: string[];
  volume: string;
  liquidity: string;
  endDate: string;
  startDate: string;
  image?: string;
  slug: string;
  tags: string[];
  volume24hr: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  resolvedOutcome?: string;
  createdAt: string;
  updatedAt: string;
}

interface WatchlistWithMarketData {
  id: string;
  userId: string;
  marketId: string;
  triggerType: string;
  triggerValue: number | null;
  frequency: string;
  isActive: boolean;
  isEmailNotification: boolean;
  isTelegramNotification: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  marketData?: PolymarketMarket | null;
}

// Server action to fetch market data for watchlist items
export async function fetchMarketsByCondition(conditionId: string[]): Promise<PolymarketMarket[]> {
  try {
    console.log('Fetching market data for condition IDs:', conditionId);
    const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
    const markets: PolymarketMarket[] = [];
    for (const id of conditionId) {
      const response = await fetch(
        `${POLYMARKET_API_BASE}/markets?id=${id}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        console.error(`Failed to fetch markets for conditionId ${id}`);
        continue;
      }

      const data = await response.json();
      console.log('Fetched market data for conditionId', id, data);
      if (Array.isArray(data)) {
        markets.push(...data);
      } else if (data) {
        markets.push(data);
      }
    }
    return markets;
  } catch (error) {
    console.error('Error in fetchMarketsByCondition:', error);
    return [];
  }
}


// Alternative: Server action that combines watchlist data with market data
export async function getWatchlistsWithMarketData(email: string): Promise<WatchlistWithMarketData[]> {
  try {
    // First, fetch the user's watchlists (assuming you have prisma available)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        watchLists: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user || !user.watchLists.length) {
      return [];
    }

    // Extract market IDs
    const marketIds = user.watchLists.map(watchlist => watchlist.marketId);
    
    // Fetch market data from Polymarket
    const marketsData = await fetchMarketsByCondition(marketIds);

    // Create a map for quick lookup
    const marketDataMap = new Map(
      marketsData.map(market => [market.id, market])
    );

    // Combine watchlist data with market data
    const watchlistsWithMarketData: WatchlistWithMarketData[] = user.watchLists.map(watchlist => ({
      ...watchlist,
      createdAt: watchlist.createdAt instanceof Date ? watchlist.createdAt.toISOString() : watchlist.createdAt,
      updatedAt: watchlist.updatedAt instanceof Date ? watchlist.updatedAt.toISOString() : watchlist.updatedAt,
      lastNotifiedAt: watchlist.lastNotifiedAt instanceof Date
        ? watchlist.lastNotifiedAt.toISOString()
        : watchlist.lastNotifiedAt,
      marketData: marketDataMap.get(watchlist.marketId) || null
    }));

    return watchlistsWithMarketData;
    
  } catch (error) {
    console.error('Error in getWatchlistsWithMarketData:', error);
    throw new Error('Failed to fetch watchlists with market data');
  }
}
