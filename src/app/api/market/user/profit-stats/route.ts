// app/api/market/user/profit-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type definitions for Polymarket API
interface PolymarketPnLDataPoint {
  t: number; // timestamp in seconds
  p: number; // profit/loss value
}

type PolymarketPnLResponse = PolymarketPnLDataPoint[];

interface ErrorResponse {
  error: string;
}

// Valid interval types
type IntervalType = '1d' | '1w' | '1m' | 'all';
type FidelityType = '1h' | '1d';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userAddress = searchParams.get('user_address');
    const interval = (searchParams.get('interval') || 'all') as IntervalType;
    const fidelity = (searchParams.get('fidelity') || '1d') as FidelityType;

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

    // Validate interval
    const validIntervals: IntervalType[] = ['1d', '1w', '1m', 'all'];
    if (!validIntervals.includes(interval)) {
      const errorResponse: ErrorResponse = { error: 'Invalid interval. Must be one of: 1d, 1w, 1m, all' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate fidelity
    const validFidelities: FidelityType[] = ['1h', '1d'];
    if (!validFidelities.includes(fidelity)) {
      const errorResponse: ErrorResponse = { error: 'Invalid fidelity. Must be one of: 1h, 1d' };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const apiUrl = new URL('https://user-pnl-api.polymarket.com/user-pnl');
    apiUrl.searchParams.append('user_address', userAddress);
    apiUrl.searchParams.append('interval', interval);
    apiUrl.searchParams.append('fidelity', fidelity);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // Next.js 15 caching options
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(`Polymarket API error: ${response.status} ${response.statusText}`);
      const errorResponse: ErrorResponse = { 
        error: `API responded with status: ${response.status}` 
      };
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const data: PolymarketPnLResponse = await response.json();
    
    // Validate response data structure
    if (!Array.isArray(data)) {
      const errorResponse: ErrorResponse = { error: 'Invalid response format from Polymarket API' };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Validate each data point
    const isValidData = data.every(
      (point): point is PolymarketPnLDataPoint => 
        typeof point.t === 'number' && 
        typeof point.p === 'number'
    );

    if (!isValidData) {
      const errorResponse: ErrorResponse = { error: 'Invalid data structure from Polymarket API' };
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    return NextResponse.json<PolymarketPnLResponse>(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching from Polymarket API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorResponse: ErrorResponse = { 
      error: `Failed to fetch data from Polymarket: ${errorMessage}` 
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}