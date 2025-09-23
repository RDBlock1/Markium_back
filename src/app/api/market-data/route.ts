import { fetchMarketData } from '@/app/actions/market';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Request failed:', error);
      }
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  isProcessing = false;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(slug: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchMarketData(slug);
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a rate limit error
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await sleep(delay);
          continue;
        }
      }
      
      throw error;
    }
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { slug } = await request.json();
    
    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug is required'
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Check cache first
    const cacheKey = `market_${slug}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached data for:', slug);
      return NextResponse.json({ 
        success: true, 
        data: cached.data,
        cached: true
      }, { headers: corsHeaders });
    }

    // Queue the request to avoid overwhelming the API
    const result = await new Promise((resolve, reject) => {
      requestQueue.push(async () => {
        try {
          const data = await fetchWithRetry(slug);
          
          // Cache the result
          cache.set(cacheKey, {
            data,
            timestamp: Date.now()
          });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      });
      
      processQueue();
    });

    return NextResponse.json({ 
      success: true, 
      data: result 
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return more specific error messages
    if (errorMessage.includes('429')) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60 // seconds
      }, { 
        status: 429,
        headers: {
          ...corsHeaders,
          'Retry-After': '60'
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { 
      status: 500,
      headers: corsHeaders
    });
  }
}