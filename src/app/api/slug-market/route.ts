// app/api/slug-market/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching market data for slug: ${slug}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Your external API call (replace with your actual API)
    const apiUrl = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com/events';
    
    const response = await fetch(`${apiUrl}?slug=${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add API key if needed
        ...(process.env.POLYMARKET_API_KEY && {
          'Authorization': `Bearer ${process.env.POLYMARKET_API_KEY}`
        })
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const marketData = await response.json();
    
    // Validate response
    if (!marketData || !Array.isArray(marketData)) {
      throw new Error('Invalid API response format');
    }

    if (marketData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`Market data fetched successfully in ${responseTime}ms`);

    //i have to filter out marketData.markets which has zero volume and i have to maintain the original structure of marketData
    const filteredMarkets = {
      ...marketData[0],
      markets: marketData[0].markets.filter((market: any) => {
        const volume = typeof market.volume === 'string' ? parseFloat(market.volume) : market.volume;
        return volume && volume > 0;
      })
    };





    // Simple response without problematic headers
    return NextResponse.json({
      data: filteredMarkets,
      success: true
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Response-Time': `${responseTime}ms`,
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('API Error:', error);

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
        errorMessage = `Failed to fetch market data: ${error.message}`;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, {
      status,
      headers: {
        'X-Response-Time': `${responseTime}ms`,
      }
    });
  }
}