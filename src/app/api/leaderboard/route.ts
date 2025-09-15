// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Types
interface LeaderboardEntry {
  proxyWallet: string;
  pseudonym: string;
  amount: number;
  name: string;
  bio: string;
  profileImage: string;
  profileImageOptimized: string;
}

interface QueryState {
  data: LeaderboardEntry[];
  dataUpdateCount: number;
  dataUpdatedAt: number;
  error: null | any;
  errorUpdateCount: number;
  errorUpdatedAt: number;
  fetchFailureCount: number;
  fetchFailureReason: null | any;
  fetchMeta: null | any;
  isInvalidated: boolean;
  status: string;
  fetchStatus: string;
}

interface Query {
  dehydratedAt: number;
  state: QueryState;
  queryKey: string[];
  queryHash: string;
}

interface DehydratedState {
  queries: Query[];
}

interface PageProps {
  dehydratedState: DehydratedState;
}

interface PolymarketResponse {
  pageProps: PageProps;
}

type LeaderboardType = 'volume' | 'profit';
type Period = '1d' | '7d' | '30d' | 'all';

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // You can restrict this to specific domains
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Cache configuration
let buildIdCache: { id: string; timestamp: number } | null = null;
const BUILD_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LEADERBOARD_CACHE_DURATION = 60 * 1000; // 1 minute

// In-memory cache for leaderboard data
const leaderboardCache = new Map<string, { data: any; timestamp: number }>();

// Helper function to get build ID with caching
async function getBuildId(): Promise<string> {
  // Check if we have a cached build ID that's still valid
  if (buildIdCache && Date.now() - buildIdCache.timestamp < BUILD_ID_CACHE_DURATION) {
    return buildIdCache.id;
  }

  try {
    const response = await fetch('https://polymarket.com/leaderboard', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 } // Next.js 15 cache for 5 minutes
    });
    
    const html = await response.text();
    const match = html.match(/"buildId":"([^"]+)"/);
    
    if (match && match[1]) {
      buildIdCache = { id: match[1], timestamp: Date.now() };
      return match[1];
    }
    throw new Error('Build ID not found in response');
  } catch (error) {
    console.error('Error fetching build ID:', error);
    throw error;
  }
}

// Fetch leaderboard data with caching
async function fetchLeaderboardData(
  type: LeaderboardType,
  period: Period
): Promise<LeaderboardEntry[]> {
  const cacheKey = `${type}-${period}`;
  
  // Check cache
  const cached = leaderboardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_DURATION) {
    console.log(`Returning cached data for ${cacheKey}`);
    return cached.data;
  }

  try {
    const buildId = await getBuildId();
    const apiUrl = `https://polymarket.com/_next/data/${buildId}/leaderboard.json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://polymarket.com/leaderboard',
      },
      next: { revalidate: 60 } // Next.js 15 cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PolymarketResponse = await response.json();
    const queries = data?.pageProps?.dehydratedState?.queries || [];
    
    for (const query of queries) {
      if (
        query.queryKey && 
        query.queryKey[0] === '/leaderboard' && 
        query.queryKey[1] === type &&
        query.queryKey[2] === period &&
        query.state?.data
      ) {
        // Cache the result
        leaderboardCache.set(cacheKey, {
          data: query.state.data,
          timestamp: Date.now()
        });
        return query.state.data;
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching ${type} leaderboard:`, error);
    throw error;
  }
}

// Fetch both leaderboards efficiently
async function fetchBothLeaderboards(period: Period): Promise<{
  volume: LeaderboardEntry[];
  profit: LeaderboardEntry[];
}> {
  const cacheKey = `both-${period}`;
  
  // Check cache
  const cached = leaderboardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_DURATION) {
    console.log(`Returning cached data for ${cacheKey}`);
    return cached.data;
  }

  try {
    const buildId = await getBuildId();
    const apiUrl = `https://polymarket.com/_next/data/${buildId}/leaderboard.json`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://polymarket.com/leaderboard',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PolymarketResponse = await response.json();
    const queries = data?.pageProps?.dehydratedState?.queries || [];
    
    const result = {
      volume: [] as LeaderboardEntry[],
      profit: [] as LeaderboardEntry[]
    };
    
    for (const query of queries) {
      if (query.queryKey && query.queryKey[0] === '/leaderboard' && query.state?.data) {
        const type = query.queryKey[1] as LeaderboardType;
        const queryPeriod = query.queryKey[2];
        
        if (queryPeriod === period && (type === 'volume' || type === 'profit')) {
          result[type] = query.state.data;
        }
      }
    }
    
    // Cache the result
    leaderboardCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching both leaderboards:', error);
    throw error;
  }
}

// API Route Handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as LeaderboardType | 'both' | null;
    const period = searchParams.get('period') as Period | null;
    
    // Map frontend period names to API period names
    const periodMap: Record<string, Period> = {
      'day': '1d',
      'week': '7d',
      'month': '30d',
      'all': 'all'
    };
    
    const mappedPeriod = period ? (periodMap[period] || period as Period) : '1d';
    
    // Validate parameters
    if (!type || !['volume', 'profit', 'both'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Use: volume, profit, or both' },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }
    
    if (!['1d', '7d', '30d', 'all'].includes(mappedPeriod)) {
      return NextResponse.json(
        { error: 'Invalid period parameter. Use: 1d, 7d, 30d, or all' },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }
    
    // Fetch data based on type
    let data;
    if (type === 'both') {
      data = await fetchBothLeaderboards(mappedPeriod);
    } else {
      const leaderboard = await fetchLeaderboardData(type, mappedPeriod);
      data = { [type]: leaderboard };
    }
    
    // Transform data to match frontend expectations
    const transformedData = {
      volume: data.volume?.map((entry, index) => ({
        id: `volume-${entry.proxyWallet}`,
        rank: index + 1,
        username: entry.name || entry.pseudonym || 'Anonymous',
        avatar: entry.profileImage || entry.profileImageOptimized || '',
        walletAddress: entry.proxyWallet,
        volume: entry.amount,
        change: 0, // Calculate from historical data if available
      })) || [],
      profit: data.profit?.map((entry, index) => ({
        id: `profit-${entry.proxyWallet}`,
        rank: index + 1,
        username: entry.name || entry.pseudonym || 'Anonymous',
        avatar: entry.profileImage || entry.profileImageOptimized || '',
        walletAddress: entry.proxyWallet,
        profit: entry.amount,
        change: 0, // Calculate from historical data if available
      })) || [],
    };
    
    return NextResponse.json(transformedData, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

// OPTIONS method for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}