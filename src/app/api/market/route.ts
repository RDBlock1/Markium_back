import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Existing cache variables...
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000;

// Add search cache
let searchCache: Map<string, { data: any; timestamp: number }> = new Map();
const SEARCH_CACHE_DURATION = 30000;

// Add category cache
let categoryCache: Map<string, { data: any; timestamp: number }> = new Map();
const CATEGORY_CACHE_DURATION = 60000;

// Category to tag mapping
const CATEGORY_MAPPINGS: Record<string, string> = {
  'politics': 'politics',
  'crypto': 'crypto',
  'tech': 'tech',
  'pop-culture': 'pop-culture',
  'geopolitics': 'geopolitics',
  'sports': 'sports',
};

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    console.log('API route called');
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '500');
    const offset = parseInt(searchParams.get('offset') || '0');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const sortBy = searchParams.get('sortBy') || 'volume';
    const searchQuery = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const filter = searchParams.get('filter') || '';

    console.log('Request params:', {
      limit,
      offset,
      sortBy,
      searchQuery,
      category,
      filter
    });

    let responseData: any;

    // If there's a search query, use the search API
    if (searchQuery && searchQuery.trim().length > 0) {
      responseData = await handleSearchRequest(searchQuery, limit, offset, sortBy);
    }
    // If there's a category or filter, use specialized endpoints
    else if (category || filter) {
      responseData = await handleFilteredRequest(category, filter, limit, offset, sortBy, forceRefresh);
    }
    // Otherwise, use existing logic for fetching all markets
    else {
      responseData = await handleDefaultRequest(limit, offset, sortBy, forceRefresh);
    }
    
    // Return with CORS headers
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=10',
      }
    });
    
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Return error with CORS headers
    return NextResponse.json({
      status: 500,
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: [],
      hasMore: false
    }, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      }
    });
  }
}

// Modified handleFilteredRequest with better error handling
async function handleFilteredRequest(
  category: string, 
  filter: string, 
  limit: number, 
  offset: number, 
  sortBy: string,
  forceRefresh: boolean
): Promise<any> {
  const cacheKey = `${category}-${filter}-${limit}-${offset}-${sortBy}`;
  
  // Check category cache
  if (!forceRefresh) {
    const cached = categoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CATEGORY_CACHE_DURATION) {
      console.log('Returning cached category results for:', category || filter);
      return cached.data;
    }
  }

  try {
    let apiUrl = '';
    
    // Determine the correct API endpoint based on filter/category
    if (filter === 'trending') {
      apiUrl = `https://gamma-api.polymarket.com/events/pagination?limit=${limit}&active=true&archived=false&closed=false&order=volume24hr&ascending=false&offset=${offset}`;
    } else if (filter === 'new') {
      apiUrl = `https://gamma-api.polymarket.com/events/pagination?limit=${limit}&active=true&archived=false&closed=false&order=startDate&ascending=false&offset=${offset}&exclude_tag_id=100639&exclude_tag_id=102169`;
    } else if (category && CATEGORY_MAPPINGS[category]) {
      const tagSlug = CATEGORY_MAPPINGS[category];
      const orderParam = sortBy === 'volume24hr' ? 'volume24hr' : 
                        sortBy === 'liquidity' ? 'liquidity' :
                        sortBy === 'newest' ? 'startDate' : 'volume24hr';
      
      apiUrl = `https://gamma-api.polymarket.com/events/pagination?limit=${limit}&active=true&archived=false&tag_slug=${tagSlug}&closed=false&order=${orderParam}&ascending=false&offset=${offset}`;
    } else {
      apiUrl = `https://gamma-api.polymarket.com/events/pagination?limit=${limit}&active=true&archived=false&closed=false&order=volume24hr&ascending=false&offset=${offset}`;
    }
    
    console.log('Fetching from Polymarket API:', apiUrl);
    
    // Use node fetch with better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-App'
      },
    });
    
    clearTimeout(timeoutId);
    
    console.log('Polymarket response status:', response.status);

    if (!response.ok) {
      console.error('Polymarket API error:', response.status, response.statusText);
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API response structure:', Object.keys(data));

    // Extract markets from the response
    let markets = [];
    
    if (data.data && Array.isArray(data.data)) {
      markets = data.data;
    } else if (Array.isArray(data)) {
      markets = data;
    }

    // Transform markets to match your existing structure
    const transformedMarkets = markets.map((market: any) => ({
      id: market.id || market.conditionId,
      question: market.question || market.title || market.description,
      slug: market.slug || market.id,
      image: market.image || market.imageUrl || '/placeholder.svg',
      liquidity: parseFloat(market.liquidity || '0'),
      volume: parseFloat(market.volume || '0'),
      volume24hr: parseFloat(market.volume24hr || market.volume_24hr || '0'),
      startDate: market.startDate || market.createdAt || null,
      endDate: market.endDate || null,
      outcomePrices: market.outcomePrices || market.outcome_prices || [0.5, 0.5],
      tags: market.tags || [],
      category: market.category || null,
    }));

    // Apply additional sorting if needed
    const sortedMarkets = sortMarkets(transformedMarkets, sortBy);

    // Calculate pagination info
    const hasMore = markets.length === limit;
    const totalAvailable = data.total || markets.length;

    const responseData = {
      status: 200,
      data: sortedMarkets,
      hasMore: hasMore,
      offset: offset,
      limit: limit,
      total: totalAvailable,
      returned: sortedMarkets.length,
      nextOffset: hasMore ? offset + limit : null,
      sortedBy: sortBy,
      category: category,
      filter: filter,
      message: `Successfully fetched ${sortedMarkets.length} ${category || filter || 'markets'}`
    };

    // Cache the results
    categoryCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (categoryCache.size > 50) {
      const entriesToDelete = Array.from(categoryCache.entries())
        .filter(([_, value]) => Date.now() - value.timestamp > CATEGORY_CACHE_DURATION)
        .map(([key]) => key);
      
      entriesToDelete.forEach(key => categoryCache.delete(key));
    }

    return responseData;
    
  } catch (error) {
    console.error('Category/Filter error:', error);
    
    // Return fallback data instead of throwing
    return {
      status: 200,
      data: [],
      hasMore: false,
      offset: offset,
      limit: limit,
      total: 0,
      returned: 0,
      sortedBy: sortBy,
      category: category,
      filter: filter,
      error: error instanceof Error ? error.message : 'Failed to fetch markets',
      message: 'Failed to fetch markets, please try again'
    };
  }
}

// Your existing handleSearchRequest function with error handling
async function handleSearchRequest(query: string, limit: number, offset: number, sortBy: string): Promise<any> {
  const cacheKey = `${query}-${limit}-${offset}-${sortBy}`;
  
  const cached = searchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < SEARCH_CACHE_DURATION) {
    console.log('Returning cached search results for:', query);
    return cached.data;
  }

  try {
    console.log('Fetching search results from Polymarket for:', query);
    
    const page = Math.floor(offset / limit) + 1;
    const searchUrl = `https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(query)}&page=${page}&limit_per_type=${limit}&type=events&events_status=active&sort=${sortBy === 'volume24hr' ? 'volume_24hr' : sortBy}`;
    
    console.log('Search URL:', searchUrl);
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-App'
      },
    });

    if (!response.ok) {
      throw new Error(`Search API failed: ${response.status}`);
    }

    const searchData = await response.json();
    let markets = [];
    
    if (searchData.events && Array.isArray(searchData.events)) {
      markets = searchData.events;
    } else if (searchData.data && Array.isArray(searchData.data)) {
      markets = searchData.data;
    } else if (Array.isArray(searchData)) {
      markets = searchData;
    }

    const transformedMarkets = markets.map((market: any) => ({
      ...market,
      liquidity: parseFloat(market.liquidity || '0'),
      volume: parseFloat(market.volume || '0'),
      volume24hr: parseFloat(market.volume24hr || market.volume_24hr || '0'),
      startDate: market.startDate || market.createdAt || null,
      endDate: market.endDate || null,
      id: market.id || market.conditionId,
      question: market.question || market.title || market.description,
      slug: market.slug || market.id,
      image: market.image || market.imageUrl || '/placeholder.svg',
      outcomePrices: market.outcomePrices || market.outcome_prices || [0.5, 0.5]
    }));

    const sortedMarkets = sortMarkets(transformedMarkets, sortBy);
    const hasMore = markets.length === limit;
    const totalAvailable = searchData.total || markets.length;

    const responseData = {
      status: 200,
      data: sortedMarkets,
      hasMore: hasMore,
      offset: offset,
      limit: limit,
      total: totalAvailable,
      returned: sortedMarkets.length,
      nextOffset: hasMore ? offset + limit : null,
      sortedBy: sortBy,
      searchQuery: query,
      message: `Found ${sortedMarkets.length} markets matching "${query}"`
    };

    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    if (searchCache.size > 100) {
      const entriesToDelete = Array.from(searchCache.entries())
        .filter(([_, value]) => Date.now() - value.timestamp > SEARCH_CACHE_DURATION)
        .map(([key]) => key);
      
      entriesToDelete.forEach(key => searchCache.delete(key));
    }

    return responseData;
    
  } catch (error) {
    console.error('Search error:', error);
    
    return {
      status: 200,
      data: [],
      hasMore: false,
      offset: offset,
      limit: limit,
      total: 0,
      returned: 0,
      searchQuery: query,
      error: error instanceof Error ? error.message : 'Search failed',
      message: `Search failed, please try again`
    };
  }
}

// Your existing handleDefaultRequest function
async function handleDefaultRequest(limit: number, offset: number, sortBy: string, forceRefresh: boolean): Promise<any> {
  const now = Date.now();
  const useCache = !forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION;
  
  let allMarkets = [];
  
  if (useCache) {
    console.log('Using cached data');
    allMarkets = cachedData;
  } else {
    const marketsPerPage = 100;
    const totalPagesToFetch = 5;
    let fetchedMarkets = [];
    
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
    
    const results = await Promise.all(fetchPromises);
    fetchedMarkets = results.flat();
    
    allMarkets = sortMarkets(fetchedMarkets, sortBy);
    cachedData = allMarkets;
    cacheTimestamp = now;
  }
  
  if (useCache) {
    allMarkets = sortMarkets(allMarkets, sortBy);
  }
  
  const paginatedMarkets = allMarkets.slice(offset, offset + limit);
  
  const transformedMarkets = paginatedMarkets.map((market: any) => ({
    ...market,
    liquidity: parseFloat(market.liquidity || '0'),
    volume: parseFloat(market.volume || '0'),
    volume24hr: parseFloat(market.volume24hr || '0'),
    startDate: market.startDate || market.createdAt || null,
    endDate: market.endDate || null,
  }));
  
  const hasMore = (offset + limit) < allMarkets.length;
  const totalAvailable = allMarkets.length;
  
  return {
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
  };
}

// Your existing sortMarkets function
function sortMarkets(markets: any[], sortBy: string): any[] {
  const sortedMarkets = [...markets];
  
  switch (sortBy) {
    case 'liquidity':
      return sortedMarkets.sort((a, b) => {
        const liquidityA = parseFloat(a.liquidity || '0');
        const liquidityB = parseFloat(b.liquidity || '0');
        return liquidityB - liquidityA;
      });
    case 'volume':
      return sortedMarkets.sort((a, b) => {
        const volumeA = parseFloat(a.volume || '0');
        const volumeB = parseFloat(b.volume || '0');
        return volumeB - volumeA;
      });
    case 'volume24hr':
    case 'volume_24hr':
      return sortedMarkets.sort((a, b) => {
        const volume24hrA = parseFloat(a.volume24hr || a.volume_24hr || '0');
        const volume24hrB = parseFloat(b.volume24hr || b.volume_24hr || '0');
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
      return sortMarkets(markets, 'liquidity');
  }
}