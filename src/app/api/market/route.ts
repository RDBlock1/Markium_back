import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Cache to store fetched data
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export async function GET(request: NextRequest) {
  try {
    console.log('API route called');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = parseInt(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const sortBy = searchParams.get('sortBy') || 'volume'; // Add sort parameter
    
    console.log(`Fetching markets - Limit: ${limit}, Offset: ${offset}, Sort: ${sortBy}`);

    // Check if we should use cached data
    const now = Date.now();
    const useCache = !forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION;
    
    let allMarkets = [];
    
    if (useCache) {
      console.log('Using cached data');
      allMarkets = cachedData;
    } else {
      console.log('Fetching fresh data from Polymarket');
      
      // Fetch multiple pages to get more data
      const marketsPerPage = 100; // Max allowed by API
      const totalPagesToFetch = 5; // Fetch 5 pages = 500 markets
      let fetchedMarkets = [];
      
      // Fetch multiple pages in parallel for better performance
      const fetchPromises = [];
      
      for (let page = 0; page < totalPagesToFetch; page++) {
        const pageOffset = page * marketsPerPage;
        
        fetchPromises.push(
          fetch(
            `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${marketsPerPage}&offset=${pageOffset}`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'NextJS-App'
              },
              cache: 'no-store'
            }
          ).then(async (response) => {
            if (!response.ok) {
              console.error(`Failed to fetch page ${page}: ${response.status}`);
              return [];
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
          }).catch(error => {
            console.error(`Error fetching page ${page}:`, error);
            return [];
          })
        );
      }
      
      // Wait for all fetches to complete
      const results = await Promise.all(fetchPromises);
      
      // Combine all results
      fetchedMarkets = results.flat();
      

      
      // Sort markets based on the requested field
      allMarkets = sortMarkets(fetchedMarkets, sortBy);
      
      // Update cache with sorted data
      cachedData = allMarkets;
      cacheTimestamp = now;
    }
    
    // If cached data was used, still apply the current sort preference
    if (useCache) {
      allMarkets = sortMarkets(allMarkets, sortBy);
    }
    
    // Apply pagination to sorted data
    const paginatedMarkets = allMarkets.slice(offset, offset + limit);
    

    
    // Transform the data if needed (keeping original structure for now)
    const transformedMarkets = paginatedMarkets.map((market: { liquidity: any; volume: any; volume24hr: any; startDate: any; createdAt: any; endDate: any; }) => ({
      ...market,
      // Ensure liquidity is a number for proper sorting
      liquidity: parseFloat(market.liquidity || '0'),
      volume: parseFloat(market.volume || '0'),
      volume24hr: parseFloat(market.volume24hr || '0'),
      // Parse dates properly
      startDate: market.startDate || market.createdAt || null,
      endDate: market.endDate || null,
    }));
    

    
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
      sortedBy: sortBy,
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

// Helper function to sort markets
function sortMarkets(markets: any[], sortBy: string): any[] {
  const sortedMarkets = [...markets];
  
  switch (sortBy) {
    case 'liquidity':
      return sortedMarkets.sort((a, b) => {
        const liquidityA = parseFloat(a.liquidity || '0');
        const liquidityB = parseFloat(b.liquidity || '0');
        return liquidityB - liquidityA; // Descending order (highest first)
      });
      
    case 'volume':
      return sortedMarkets.sort((a, b) => {
        const volumeA = parseFloat(a.volume || '0');
        const volumeB = parseFloat(b.volume || '0');
        return volumeB - volumeA;
      });
      
    case 'volume24hr':
      return sortedMarkets.sort((a, b) => {
        const volume24hrA = parseFloat(a.volume24hr || '0');
        const volume24hrB = parseFloat(b.volume24hr || '0');
        return volume24hrB - volume24hrA;
      });
      
    case 'newest':
      return sortedMarkets.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.startDate || 0).getTime();
        return dateB - dateA;
      });
      
    case 'ending_soon':
      return sortedMarkets.sort((a, b) => {
        const endA = new Date(a.endDate || '9999-12-31').getTime();
        const endB = new Date(b.endDate || '9999-12-31').getTime();
        return endA - endB;
      });
      
    default:
      // Default to liquidity
      return sortMarkets(markets, 'liquidity');
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