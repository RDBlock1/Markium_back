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
  series: PolymarketPnLResponse;
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

/**
 * Merge multiple data series, keeping the most detailed (latest) point for each timestamp
 */
function mergeSeries(...series: PolymarketPnLResponse[]): PolymarketPnLResponse {
  const pointMap = new Map<number, PolymarketPnLDataPoint>();

  // Add all points to map, later series override earlier ones at same timestamp
  for (const s of series) {
    for (const point of s) {
      pointMap.set(point.t, point);
    }
  }

  // Convert back to array and sort by timestamp
  return Array.from(pointMap.values()).sort((a, b) => a.t - b.t);
}

/**
 * Find the closest data point at or before the target timestamp
 */
function findPointAtOrBefore(
  series: PolymarketPnLResponse,
  targetTs: number
): PolymarketPnLDataPoint | null {
  let candidate: PolymarketPnLDataPoint | null = null;

  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].t <= targetTs) {
      candidate = series[i];
      break;
    }
  }

  return candidate;
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

    /**
     * Strategy: Fetch multiple combinations to ensure we have data for all windows
     * 
     * - For 1d: fetch interval=1d with fidelity=1h (hourly granularity for 24 hours)
     * - For 1w: fetch interval=1w with fidelity=3h (3-hour granularity for 7 days)
     * - For 1m: fetch interval=1m with fidelity=1d (daily granularity for 30 days)
     * - For all: fetch interval=all with fidelity=1d (daily granularity for all time)
     * 
     * We merge all datasets to get the most complete picture
     */

    const dataSourcesUsed: string[] = [];

    // Fetch data for different time windows
    const [data1d, data1w, data1m, dataAll] = await Promise.all([
      fetchPolymarketData(userAddress, '1d', '1h'),
      fetchPolymarketData(userAddress, '1w', '3h'),
      fetchPolymarketData(userAddress, '1m', '1d'),
      fetchPolymarketData(userAddress, 'all', '1d'),
    ]);

    // Track which data sources returned data
    if (data1d.length > 0) dataSourcesUsed.push('1d/1h');
    if (data1w.length > 0) dataSourcesUsed.push('1w/3h');
    if (data1m.length > 0) dataSourcesUsed.push('1m/1d');
    if (dataAll.length > 0) dataSourcesUsed.push('all/1d');

    // Merge all data series
    const mergedSeries = mergeSeries(data1d, data1w, data1m, dataAll);

    if (mergedSeries.length === 0) {
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
        series: [],
      };
      return NextResponse.json<ProfitStatsResponse>(empty, withCacheHeaders());
    }

    const latest = mergedSeries[mergedSeries.length - 1];
    const first = mergedSeries[0];

    console.log(`Latest point: t=${latest.t}, p=${latest.p}, date=${new Date(latest.t * 1000).toISOString()}`);
    console.log(`First point: t=${first.t}, p=${first.p}, date=${new Date(first.t * 1000).toISOString()}`);
    console.log(`Total data points: ${mergedSeries.length}`);

    // Calculate target timestamps (in seconds)
    const DAY = 86400;
    const now = latest.t;

    const targets = {
      '1d': now - 1 * DAY,
      '1w': now - 7 * DAY,
      '1m': now - 30 * DAY,
    };

    console.log('\nTarget timestamps:');
    console.log(`  1D target: ${targets['1d']} (${new Date(targets['1d'] * 1000).toISOString()})`);
    console.log(`  1W target: ${targets['1w']} (${new Date(targets['1w'] * 1000).toISOString()})`);
    console.log(`  1M target: ${targets['1m']} (${new Date(targets['1m'] * 1000).toISOString()})`);

    // Find reference points for each window
    const ref1d = findPointAtOrBefore(mergedSeries, targets['1d']);
    const ref1w = findPointAtOrBefore(mergedSeries, targets['1w']);
    const ref1m = findPointAtOrBefore(mergedSeries, targets['1m']);

    console.log('\nFound reference points:');
    if (ref1d) console.log(`  1D ref: t=${ref1d.t}, p=${ref1d.p}, date=${new Date(ref1d.t * 1000).toISOString()}`);
    if (ref1w) console.log(`  1W ref: t=${ref1w.t}, p=${ref1w.p}, date=${new Date(ref1w.t * 1000).toISOString()}`);
    if (ref1m) console.log(`  1M ref: t=${ref1m.t}, p=${ref1m.p}, date=${new Date(ref1m.t * 1000).toISOString()}`);

    // Let's also check what points are around the 1W mark
    console.log('\nData points around 1W target:');
    const weekIdx = mergedSeries.findIndex(p => p.t >= targets['1w']);
    if (weekIdx > 0) {
      for (let i = Math.max(0, weekIdx - 2); i < Math.min(mergedSeries.length, weekIdx + 3); i++) {
        const p = mergedSeries[i];
        console.log(`    [${i}] t=${p.t}, p=${p.p}, date=${new Date(p.t * 1000).toISOString()}`);
      }
    }

    /**
     * CRITICAL INSIGHT: Polymarket uses the point CLOSEST to exactly N time ago
     * Not "at or before", not "minimum in window", but literally the closest point
     */
    
    // Find the closest point to a target timestamp (can be before or after)
    const findClosestPoint = (targetTs: number): PolymarketPnLDataPoint | null => {
      if (mergedSeries.length === 0) return null;
      
      return mergedSeries.reduce((closest, point) => {
        const closestDiff = Math.abs(closest.t - targetTs);
        const pointDiff = Math.abs(point.t - targetTs);
        return pointDiff < closestDiff ? point : closest;
      });
    };

    const closest1d = findClosestPoint(targets['1d']);
    const closest1w = findClosestPoint(targets['1w']);

    console.log('\nClosest points to exact targets:');
    if (closest1d) console.log(`  1D closest: t=${closest1d.t}, p=${closest1d.p}, date=${new Date(closest1d.t * 1000).toISOString()}, diff=${Math.abs(closest1d.t - targets['1d'])}s`);
    if (closest1w) console.log(`  1W closest: t=${closest1w.t}, p=${closest1w.p}, date=${new Date(closest1w.t * 1000).toISOString()}, diff=${Math.abs(closest1w.t - targets['1w'])}s`);

    // Helper to calculate window stats
    const calc = (
      to: PolymarketPnLDataPoint,
      from: PolymarketPnLDataPoint | null,
      windowKey: StatKey
    ): WindowStat => {
      if (!from) {
        from = first;
      }

      let value: number;

      // For 1D and 1W, calculate the change from the reference point
      // For 1M and ALL, show absolute current PnL
      if (windowKey === '1m' || windowKey === 'all') {
        value = round2(to.p);
      } else {
        value = round2(to.p - from.p);
      }

      return {
        value,
        formatted: formatUSD(value),
        fromTimestamp: from.t,
        toTimestamp: to.t,
        fromPnL: round2(from.p),
        toPnL: round2(to.p),
      };
    };

    const windows: Record<StatKey, WindowStat> = {
      '1d': calc(latest, closest1d, '1d'),
      '1w': calc(latest, closest1w, '1w'),
      '1m': calc(latest, ref1m, '1m'),
      'all': calc(latest, first, 'all'),
    };

    console.log('Computed windows:', JSON.stringify(windows, null, 2));
    console.log('Polymarket comparison:');
    console.log('  1D yours vs PM:', windows['1d'].formatted, 'vs -$143,665.00');
    console.log('  1W yours vs PM:', windows['1w'].formatted, 'vs $631,326.78'); 
    console.log('  1M yours vs PM:', windows['1m'].formatted, 'vs $389,879.90');
    console.log('  ALL yours vs PM:', windows['all'].formatted, 'vs $1,070,776.90');

    const payload: ProfitStatsResponse = {
      address: userAddress,
      windows,
      latestPoint: latest,
      totalDataPoints: mergedSeries.length,
      dataSourcesUsed,
      series: mergedSeries,
    };

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