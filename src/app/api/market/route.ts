/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  'finance':'finance',
  'earnings':'earnings',
  'economy':'economy',
  'elections':'elections',
'world':'world'

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

// Improved handleFilteredRequest with retries, backoff, and cached fallback
async function handleFilteredRequest(
  category: string,
  filter: string,
  limit: number,
  offset: number,
  sortBy: string,
  forceRefresh: boolean
): Promise<any> {
  const cacheKey = `${category}-${filter}-${limit}-${offset}-${sortBy}`;

  // Serve from cache if available and not forcing refresh
  if (!forceRefresh) {
    const cached = categoryCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CATEGORY_CACHE_DURATION) {
      console.log('Returning cached category results for:', category || filter);
      return cached.data;
    }
  }

  // Build apiUrl
  let apiUrl = '';
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

  // Retry config
  const maxRetries = 3;
  const baseTimeoutMs = 10000; // per-try timeout in ms
  const backoffBase = 500; // ms

  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const tryTimeout = baseTimeoutMs + attempt * 5000; // increase timeout a bit each attempt
    const timeoutId = setTimeout(() => controller.abort(), tryTimeout);

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          // Slightly more descriptive UA can help debugging on remote APIs
          'User-Agent': 'NextJS-App/1.0 (+yourapp@example.com)'
        },
        // If using node fetch/undici you can also set keepalive in agent config if needed.
      });
      clearTimeout(timeoutId);

      console.log(`Polymarket response status (attempt ${attempt+1}):`, response.status);

      if (!response.ok) {
        // 429 or 5xx could be temporary; capture and retry for 5xx/429
        lastError = new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
        if (response.status >= 500 || response.status === 429) {
          // backoff and retry
          const backoff = backoffBase * Math.pow(2, attempt);
          console.warn(`Transient error ${response.status}. Backing off ${backoff}ms before retrying.`);
          await new Promise(res => setTimeout(res, backoff));
          continue;
        } else {
          // non-retryable client error
          throw lastError;
        }
      }

      const data = await response.json();
      console.log('API response structure keys:', Object.keys(data || {}));

      // Normalize markets
      let markets: any[] = [];
      if (data && Array.isArray(data.data)) {
        markets = data.data;
      } else if (Array.isArray(data)) {
        markets = data;
      } else if (data && Array.isArray(data.events)) {
        markets = data.events;
      }

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

      const sortedMarkets = sortMarkets(transformedMarkets, sortBy);
      const hasMore = markets.length === limit;
      const totalAvailable = data.total || markets.length || 0;

      const responseData = {
        status: 200,
        data: sortedMarkets,
        hasMore,
        offset,
        limit,
        total: totalAvailable,
        returned: sortedMarkets.length,
        nextOffset: hasMore ? offset + limit : null,
        sortedBy: sortBy,
        category,
        filter,
        message: `Successfully fetched ${sortedMarkets.length} ${category || filter || 'markets'}`
      };

      // Cache successful result
      categoryCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

      // keep cache small
      if (categoryCache.size > 50) {
        const entriesToDelete = Array.from(categoryCache.entries())
          .filter(([_, value]) => Date.now() - value.timestamp > CATEGORY_CACHE_DURATION)
          .map(([key]) => key);
        entriesToDelete.forEach(k => categoryCache.delete(k));
      }

      return responseData;

    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      // Distinguish abort vs other network errors
      if (err && (err.name === 'AbortError' || err.name === 'FetchError' || err.code === 'UND_ERR_CONNECT_TIMEOUT')) {
        console.warn(`Fetch attempt ${attempt+1} aborted/timeout:`, err && (err.message || err.name));
      } else {
        console.error(`Fetch attempt ${attempt+1} failed:`, err);
      }

      // If last attempt, break loop and use fallback
      if (attempt === maxRetries - 1) break;

      // Backoff before retrying
      const backoff = backoffBase * Math.pow(2, attempt);
      await new Promise(res => setTimeout(res, backoff));
    }
  }

  console.error('Category/Filter final error after retries:', lastError);

  // If we have a cached result for this key or a general cache, return it as fallback
  const fallbackCached = categoryCache.get(cacheKey) || (cachedData ? { data: cachedData, timestamp: cacheTimestamp } : null);
  if (fallbackCached && fallbackCached.data) {
    console.log('Returning fallback cached data due to fetch failures.');
    return {
      ...fallbackCached.data,
      message: 'Returned cached fallback data due to fetch failures',
      error: lastError instanceof Error ? lastError.message : String(lastError)
    };
  }

  // Final graceful empty fallback (keeps consistent response shape)
  return {
    status: 200,
    data: [],
    hasMore: false,
    offset,
    limit,
    total: 0,
    returned: 0,
    sortedBy: sortBy,
    category,
    filter,
    error: lastError instanceof Error ? lastError.message : String(lastError),
    message: 'Failed to fetch markets after retries'
  };
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

  console.log('transformedMarkets',transformedMarkets);
  
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