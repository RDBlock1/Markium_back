// app/api/market/user/profit-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions for Polymarket API
interface PolymarketPnLDataPoint {
  t: number; // timestamp in seconds
  p: number; // cumulative profit/loss value
}

type PolymarketPnLResponse = PolymarketPnLDataPoint[];

interface ErrorResponse {
  error: string;
}

// Valid fidelity and interval types based on Polymarket API
type FidelityType = '1d' | '18h' | '12h' | '3h' | '1h';
type IntervalType = 'max' | 'all' | '1m' | '1w' | '1d' | '12h' | '6h';

type StatKey = '1d' | '1w' | '1m' | 'all';

interface WindowStat {
  value: number;
  formatted: string;
  fromTimestamp: number;
  toTimestamp: number;
  fromPnL: number;
  toPnL: number;
}

interface ProfitStatsResponse {
  address: string;
  windows: Record<StatKey, WindowStat>;
  latestPoint: PolymarketPnLDataPoint | null;
  totalDataPoints: number;
  dataSourcesUsed: string[];
  series: {
    '1d': PolymarketPnLResponse;
    '1w': PolymarketPnLResponse;
    '1m': PolymarketPnLResponse;
    'all': PolymarketPnLResponse;
  };
}

/**
 * Fetch PnL data from Polymarket API with specified interval and fidelity
 */
async function fetchPolymarketData(
  userAddress: string,
  interval: IntervalType,
  fidelity: FidelityType
): Promise<PolymarketPnLResponse> {
  const apiUrl = new URL('https://user-pnl-api.polymarket.com/user-pnl');
  apiUrl.searchParams.append('user_address', userAddress);
  apiUrl.searchParams.append('interval', interval);
  apiUrl.searchParams.append('fidelity', fidelity);

  console.log(`Fetching data: interval=${interval}, fidelity=${fidelity}`);

  const response = await fetch(apiUrl.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    console.error(`API error for ${interval}/${fidelity}: ${response.status}`);
    return [];
  }

  const data: PolymarketPnLResponse = await response.json();

  if (!Array.isArray(data)) {
    console.error(`Invalid response format for ${interval}/${fidelity}`);
    return [];
  }

  const isValidData = data.every(
    (point): point is PolymarketPnLDataPoint =>
      point &&
      typeof point.t === 'number' &&
      Number.isFinite(point.t) &&
      typeof point.p === 'number' &&
      Number.isFinite(point.p)
  );

  if (!isValidData) {
    console.error(`Invalid data structure for ${interval}/${fidelity}`);
    return [];
  }

  console.log(`Fetched ${data.length} points for ${interval}/${fidelity}`);
  return data;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get('user_address');

    // Validate user address
    if (!userAddress) {
      const errorResponse: ErrorResponse = { error: 'User address is required' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(userAddress)) {
      const errorResponse: ErrorResponse = { error: 'Invalid Ethereum address format' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const dataSourcesUsed: string[] = [];

    // Fetch data for each specific window
    const [data1d, data1w, data1m, dataAll] = await Promise.all([
      fetchPolymarketData(userAddress, '1d', '1h'),
      fetchPolymarketData(userAddress, '1w', '3h'),
      fetchPolymarketData(userAddress, '1m', '1h'),
      fetchPolymarketData(userAddress, 'all', '1d'),
    ]);

    // Track which data sources returned data
    if (data1d.length > 0) dataSourcesUsed.push('1d/1h');
    if (data1w.length > 0) dataSourcesUsed.push('1w/3h');
    if (data1m.length > 0) dataSourcesUsed.push('1m/1h');
    if (dataAll.length > 0) dataSourcesUsed.push('all/1d');

    // Use dataAll for the full series and current PnL
    if (dataAll.length === 0) {
      const empty: ProfitStatsResponse = {
        address: userAddress,
        windows: {
          '1d': zeroStat(),
          '1w': zeroStat(),
          '1m': zeroStat(),
          'all': zeroStat(),
        },
        latestPoint: null,
        totalDataPoints: 0,
        dataSourcesUsed,
        series: {
          '1d': [],
          '1w': [],
          '1m': [],
          'all': [],
        },
      };
      return NextResponse.json<ProfitStatsResponse>(empty, withCacheHeaders());
    }

    // Get latest and first points from ALL data
    const latestAll = dataAll[dataAll.length - 1];
    const firstAll = dataAll[0];

    console.log('\n=== ALL TIME DATA ===');
    console.log(`Latest: t=${latestAll.t}, p=${latestAll.p}, date=${new Date(latestAll.t * 1000).toISOString()}`);
    console.log(`First: t=${firstAll.t}, p=${firstAll.p}, date=${new Date(firstAll.t * 1000).toISOString()}`);

    // Helper to calculate window stats from a dataset
    const calcWindow = (
      data: PolymarketPnLResponse,
      windowKey: StatKey
    ): WindowStat => {
      if (data.length === 0) {
        return zeroStat();
      }

      let oldest = data[0];
      const latest = data[data.length - 1];
      
      // SPECIAL CASE for 1M: Polymarket uses the point closest to exactly 30 days ago
      if (windowKey === '1m' && data.length > 1) {
        const DAY = 86400; // seconds in a day
        const targetTimestamp = latest.t - (30 * DAY);
        
        // Find the point with timestamp closest to 30 days ago
        let closestIndex = 0;
        let smallestTimeDiff = Math.abs(data[0].t - targetTimestamp);
        
        for (let i = 1; i < data.length; i++) {
          const timeDiff = Math.abs(data[i].t - targetTimestamp);
          if (timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            closestIndex = i;
          }
        }
        
        oldest = data[closestIndex];
        console.log(`\n=== 1M REFERENCE POINT ===`);
        console.log(`Target timestamp (30d ago): ${targetTimestamp} (${new Date(targetTimestamp * 1000).toISOString()})`);
        console.log(`Using index ${closestIndex}, time diff: ${smallestTimeDiff}s`);
        console.log(`Point: t=${oldest.t}, p=${oldest.p}, date=${new Date(oldest.t * 1000).toISOString()}`);
      }
      
      let value: number;
      
      if (windowKey === 'all') {
        // For ALL: show the current PnL (latest point value)
        value = round2(latest.p);
      } else {
        // For all time-based windows: simple difference
        value = round2(latest.p - oldest.p);
      }

      console.log(`\n=== ${windowKey.toUpperCase()} WINDOW ===`);
      console.log(`Oldest: t=${oldest.t}, p=${oldest.p}, date=${new Date(oldest.t * 1000).toISOString()}`);
      console.log(`Latest: t=${latest.t}, p=${latest.p}, date=${new Date(latest.t * 1000).toISOString()}`);
      console.log(`Value: ${value} (${windowKey === 'all' ? 'absolute' : 'change'})`);

      return {
        value,
        formatted: formatUSD(value),
        fromTimestamp: oldest.t,
        toTimestamp: latest.t,
        fromPnL: round2(oldest.p),
        toPnL: round2(latest.p),
      };
    };

    // Calculate each window using its specific dataset
    const windows: Record<StatKey, WindowStat> = {
      '1d': calcWindow(data1d, '1d'),
      '1w': calcWindow(data1w, '1w'),
      '1m': calcWindow(data1m, '1m'),
      'all': calcWindow(dataAll, 'all'),
    };

    console.log('\n=== COMPARISON ===');
    console.log('1D yours:', windows['1d'].formatted);
    console.log('1W yours:', windows['1w'].formatted);
    console.log('1M yours:', windows['1m'].formatted);
    console.log('ALL yours:', windows['all'].formatted);

    const payload: ProfitStatsResponse = {
      address: userAddress,
      windows,
      latestPoint: latestAll,
      totalDataPoints: dataAll.length,
      dataSourcesUsed,
      series: {
        '1d': data1d,
        '1w': data1w,
        '1m': data1m,
        'all': dataAll,
      },
    };
    
    console.log("payload", payload);

    return NextResponse.json<ProfitStatsResponse>(payload, withCacheHeaders());
  } catch (error) {
    console.error('Error fetching from Polymarket API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse: ErrorResponse = {
      error: `Failed to fetch data from Polymarket: ${errorMessage}`,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/* ----------------------- Helpers ----------------------- */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

function zeroStat(): WindowStat {
  return {
    value: 0,
    formatted: '$0.00',
    fromTimestamp: 0,
    toTimestamp: 0,
    fromPnL: 0,
    toPnL: 0,
  };
}

function withCacheHeaders() {
  return {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
    },
  };
}