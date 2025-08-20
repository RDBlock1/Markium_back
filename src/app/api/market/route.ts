// app/api/market/route.ts
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Cache to store fetched data (optional, for performance)
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: NextRequest) {
  try {
    console.log('API route called');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    console.log(`Fetching markets - Limit: ${limit}, Offset: ${offset}`);
    
    // Check if we should use cached data
    const now = Date.now();
    const useCache = !forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION;
    
    let allMarkets = [];
    
    if (useCache) {
      console.log('Using cached data');
      allMarkets = cachedData;
    } else {
      // Fetch fresh data from Polymarket
      console.log('Fetching fresh data from Polymarket');
      
      // Fetch more than needed to ensure we have enough data
      const fetchLimit = Math.min(500, offset + limit + 100);
      
      const response = await fetch(
        `https://gamma-api.polymarket.com/markets?active=true&closed=false&order=volume24hr&ascending=false&limit=${fetchLimit}&offset=0`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'NextJS-App'
          },
          // Don't cache at fetch level to ensure fresh data
          cache: 'no-store'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Polymarket API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Polymarket API');
      }
      
      allMarkets = data;
      
      // Update cache
      cachedData = data;
      cacheTimestamp = now;
      
      console.log(`Fetched ${allMarkets.length} total markets from Polymarket`);
    }
    
    // Apply pagination
    const paginatedMarkets = allMarkets.slice(offset, offset + limit);
    
    console.log(`Returning ${paginatedMarkets.length} markets (offset: ${offset}, limit: ${limit})`);
    
    // Transform the data
    const transformedMarkets = paginatedMarkets.map((market: any) => ({
      id: market.id || market.conditionId || `market-${Math.random()}`, // Ensure unique ID
      question: market.question || market.title || 'Unknown Market',
      slug: market.slug || market.id,
      image: market.image || '',
      outcomes: market.outcomes || [],
      outcomePrices: market.outcomePrices || '',
      volume24hr: parseFloat(market.volume || market.volume24hr || 0),
      liquidity: parseFloat(market.liquidity || 0),
      endDate: market.endDate || market.end_date_iso || new Date().toISOString(),
      active: market.active !== false,
      spread: parseFloat(market.spread || 0),
      lastTradePrice: parseFloat(market.lastTradePrice || market.last_trade_price || 0),
      oneDayPriceChange: parseFloat(market.oneDayPriceChange || market.price_change_24h || 0),
      // Additional fields for compatibility
      name: market.name || '',
      ticker: market.ticker || '',
      logo: market.logo || '',
      price: parseFloat(market.price || 0),
      marketCap: parseFloat(market.marketCap || market.market_cap || 0),
      volume: parseFloat(market.volume || 0),
      change24h: parseFloat(market.change24h || 0),
      sparklineData: market.sparklineData || [],
      status: market.status || 'active'
    }));
    console.log('Transformed markets:', transformedMarkets);
    // Check if there are more markets available
    const hasMore = (offset + limit) < allMarkets.length;
    const totalAvailable = allMarkets.length;
    
    return NextResponse.json({
      status: 200,
      data: transformedMarkets,
      hasMore: hasMore,
      offset: offset,
      limit: limit,
      total: totalAvailable,
      returned: transformedMarkets.length,
      nextOffset: hasMore ? offset + limit : null,
      message: `Successfully fetched markets ${offset + 1} to ${offset + transformedMarkets.length} of ${totalAvailable}`
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json({
      status: 500,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      hasMore: false
    }, {
      status: 500
    });
  }
}

// Optional: Add a POST endpoint to clear cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'clear-cache') {
      cachedData = null;
      cacheTimestamp = 0;
      
      return NextResponse.json({
        status: 200,
        message: 'Cache cleared successfully'
      });
    }
    
    return NextResponse.json({
      status: 400,
      error: 'Invalid action'
    }, {
      status: 400
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: 'Internal Server Error'
    }, {
      status: 500
    });
  }
}