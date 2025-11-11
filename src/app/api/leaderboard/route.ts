/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Types
interface PolymarketLeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
  profileImage: string;
}

interface TransformedEntry {
  id: string;
  rank: number;
  username: string;
  profileImage: string;
  walletAddress: string;
  volume?: number;
  profit?: number;
  change: number;
}

type LeaderboardType = 'volume' | 'profit' | 'both';
type Period = 'day' | 'week' | 'month' | 'all';

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Cache configuration
const LEADERBOARD_CACHE_DURATION = 60 * 1000; // 1 minute
const leaderboardCache = new Map<string, { data: any; timestamp: number }>();

// Map frontend period names to API timePeriod values
const periodMap: Record<Period, string> = {
  'day': 'day',
  'week': 'week',
  'month': 'month',
  'all': 'all'
};

// Fetch leaderboard data from Polymarket Data API
async function fetchLeaderboardData(
  type: LeaderboardType,
  period: Period,
  category: string = 'overall',
  limit: number = 20
): Promise<PolymarketLeaderboardEntry[]> {
  try {
    const timePeriod = periodMap[period];
    const orderBy = type === 'volume' ? 'VOL' : 'PNL';

    const apiUrl = `https://data-api.polymarket.com/v1/leaderboard?timePeriod=${timePeriod}&orderBy=${orderBy}&limit=${limit}&offset=0&category=${category}`;

    console.log(`Fetching ${type} leaderboard for ${period}:`, apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Next.js cache for 1 minute
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PolymarketLeaderboardEntry[] = await response.json();

    
    return data;
  } catch (error) {
    console.error(`Error fetching ${type} leaderboard:`, error);
    throw error;
  }
}

// Fetch both leaderboards efficiently
async function fetchBothLeaderboards(
  period: Period,
  category: string = 'overall',
  limit: number = 20
): Promise<{
  volume: PolymarketLeaderboardEntry[];
  profit: PolymarketLeaderboardEntry[];
}> {
  console.log('Fetching both leaderboards for', period);


  try {
    // Fetch both in parallel
    const [volumeData, profitData] = await Promise.all([
      fetchLeaderboardData('volume', period, category, limit),
      fetchLeaderboardData('profit', period, category, limit)
    ]);
    
    const result = {
      volume: volumeData,
      profit: profitData
    };
    

    return result;
  } catch (error) {
    console.error('Error fetching both leaderboards:', error);
    throw error;
  }
}

// Transform Polymarket API response to frontend format
function transformVolumeEntry(entry: PolymarketLeaderboardEntry, index: number): TransformedEntry {
  return {
    id: `volume-${entry.proxyWallet}`,
    rank: parseInt(entry.rank, 10) || index + 1,
    username: entry.userName || 'Anonymous',
    profileImage: entry.profileImage || '',
    walletAddress: entry.proxyWallet,
    volume: entry.vol || 0,
    change: 0, // Calculate from historical data if needed
  };
}

function transformProfitEntry(entry: PolymarketLeaderboardEntry, index: number): TransformedEntry {
  return {
    id: `profit-${entry.proxyWallet}`,
    rank: parseInt(entry.rank, 10) || index + 1,
    username: entry.userName || 'Anonymous',
    profileImage: entry.profileImage || '',
    walletAddress: entry.proxyWallet,
    profit: entry.pnl || 0,
    change: 0, // Calculate from historical data if needed
  };
}

// API Route Handler
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as LeaderboardType | null;
    const period = searchParams.get('period') as Period | null;
    const limitParam = searchParams.get('limit');
    const category = searchParams.get('category') || 'overall';
    
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const validPeriod: Period = period && ['day', 'week', 'month', 'all'].includes(period) 
      ? period 
      : 'week';
    
    // Validate type parameter
    if (!type || !['volume', 'profit', 'both'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter. Use: volume, profit, or both' },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }
    
    // Validate period parameter
    if (period && !['day', 'week', 'month', 'all'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period parameter. Use: day, week, month, or all' },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }
    
    // Fetch data based on type
    let rawData: {
      volume?: PolymarketLeaderboardEntry[];
      profit?: PolymarketLeaderboardEntry[];
    };
    
    if (type === 'both') {
      rawData = await fetchBothLeaderboards(validPeriod, category, limit);
    } else {
      const leaderboard = await fetchLeaderboardData(type, validPeriod, category, limit);
      rawData = { [type]: leaderboard };
    }

    console.log('Leaderboard data fetched successfully ✅');
    
    // Transform data to match frontend expectations
    const transformedData = {
      volume: rawData.volume?.map(transformVolumeEntry) || [],
      profit: rawData.profit?.map(transformProfitEntry) || [],
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
      { 
        error: 'Failed to fetch leaderboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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