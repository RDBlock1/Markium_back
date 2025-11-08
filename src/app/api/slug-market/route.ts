/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/slug-market/route.ts
import { NextRequest, NextResponse } from 'next/server';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('request');
  
  try {
    
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }


    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased to 30 second timeout

    // Your external API call
    const apiUrl = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com/events';
    const fullUrl = `${apiUrl}?slug=${encodeURIComponent(slug)}`;
    

    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-App',
          // Add API key if needed
          ...(process.env.POLYMARKET_API_KEY && {
            'Authorization': `Bearer ${process.env.POLYMARKET_API_KEY}`
          })
        },
        signal: controller.signal,
      });
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      clearTimeout(timeoutId);
      
      // If fetch fails, try without signal/timeout
      console.log('Retrying without timeout...');
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-App',
        }
      });
    }

    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorBody = await response.text();
        errorDetails = errorBody.substring(0, 200);
      } catch (e) {
        console.error('Could not read error body');
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Market not found' },
          { 
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }
      
      throw new Error(`API responded with status: ${response.status}. Details: ${errorDetails}`);
    }

    const responseText = await response.text();
    
    let marketData;
    try {
      marketData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response preview:', responseText.substring(0, 500));
      throw new Error('Invalid JSON response from API');
    }
    
    // Validate response
    if (!marketData) {
      throw new Error('Empty API response');
    }
    
    // Handle both array and object responses
    let marketObject;
    if (Array.isArray(marketData)) {
      if (marketData.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Market not found' },
          { 
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            }
          }
        );
      }
      marketObject = marketData[0];
    } else {
      marketObject = marketData;
    }

    // Filter out markets with zero volume while maintaining structure
    let filteredMarkets = marketObject;
    if (marketObject.markets && Array.isArray(marketObject.markets)) {
      filteredMarkets = {
        ...marketObject,
        markets: marketObject.markets.filter((market: any) => {
          const volume = typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume;
          return volume && volume > 0;
        })
      };
      console.log(`Filtered ${marketObject.markets.length - filteredMarkets.markets.length} zero-volume markets`);
    }

    const responseTime = Date.now() - startTime;
    console.log(`Market data fetched successfully in ${responseTime}ms`);

    // Return with CORS headers
    return NextResponse.json({
      data: filteredMarkets,
      success: true,
      responseTime: `${responseTime}ms`
    }, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${responseTime}ms`,
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    let status = 500;
    let errorMessage = 'Internal server error';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        status = 408;
        errorMessage = 'Request timeout - please try again';
      } else if (error.message.includes('404')) {
        status = 404;
        errorMessage = 'Market not found';
      } else {
        errorMessage = error.message || 'Failed to fetch market data';
      }
    }

    // Return error with CORS headers
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    }, {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${responseTime}ms`,
      }
    });
  }
}

// Also export GET method if needed
export async function GET(request: NextRequest) {
  // Extract slug from query params
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  console.log('slug',slug);
  
  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'Slug is required' },
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
  
  // Reuse POST logic by creating a fake POST request
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ slug }),
    headers: request.headers
  });
  
  return POST(fakeRequest);
}