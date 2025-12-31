// app/api/polymarket/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Define types for the API response
interface PolymarketComment {
  id: string
  body: string
  parentEntityType: string
  parentEntityID: number
  userAddress: string
  createdAt: string
  updatedAt: string
  profile?: {
    name?: string
    pseudonym?: string
    displayUsernamePublic?: boolean
    bio?: string
    proxyWallet?: string
    baseAddress?: string
    profileImage?: string
    positions?: Array<{
      tokenId: string
      positionSize: string
    }>
  }
  reactions?: Array<{
    id: string
    commentID: number
    reactionType: string
    userAddress: string
    profile?: {
      proxyWallet?: string
    }
  }>
  reportCount: number
  reactionCount: number
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const {
      parentEntityId ,
      parent_entity_type,
      limit = 40,
      offset = 0,
      orderBy = 'createdAt',
      holdersOnly = true,
    } = body

    console.log('Fetching comments with params:', { body });

    // Construct the Polymarket API URL
    const apiUrl = new URL('https://gamma-api.polymarket.com/comments')
    
    // Add query parameters
    apiUrl.searchParams.append('get_positions', 'true')
    apiUrl.searchParams.append('get_reports', 'true')
    apiUrl.searchParams.append('parent_entity_type',parent_entity_type )
    apiUrl.searchParams.append('parent_entity_id', parentEntityId.toString())
    apiUrl.searchParams.append('ascending', 'false')
    apiUrl.searchParams.append('holders_only', holdersOnly.toString())
    apiUrl.searchParams.append('order', orderBy)
    apiUrl.searchParams.append('limit', limit.toString())
    apiUrl.searchParams.append('offset', offset.toString())

    // Fetch from Polymarket API with proper headers
    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add user agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        // Optional: Add referer if needed
        'Referer': 'https://polymarket.com',
      },
      // Cache for 30 seconds to reduce API calls
      next: { revalidate: 30 }
    })

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`)
    }

    const data: PolymarketComment[] = await response.json()

    // Process and return the data
    const processedResponse = {
      comments: data,
      hasMore: data.length === limit,
      totalCount: data.length,
    }

    // Return with CORS headers
    return NextResponse.json(processedResponse, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    })
  } catch (error) {
    console.error('Error fetching Polymarket comments:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch comments',
        message: error instanceof Error ? error.message : 'Unknown error',
        comments: [],
        hasMore: false,
        totalCount: 0
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

// Also support GET method for easier testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const body = {
    parentEntityId: parseInt(searchParams.get('parentEntityId') || '35'),
    limit: parseInt(searchParams.get('limit') || '40'),
    offset: parseInt(searchParams.get('offset') || '0'),
    orderBy: searchParams.get('orderBy') || 'createdAt',
    holdersOnly: searchParams.get('holdersOnly') === 'true',
  }
  console.log('GET request with params:', body);

  // Reuse the POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify(body),
  }))
}