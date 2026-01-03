// app/api/polymarket/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Call your Node.js Express server
    // Replace with your actual Express server URL
    const EXPRESS_SERVER_URL = process.env.NEXT_PUBLIC_NEW_BACKEND_URL || 'http://localhost:4000'

    const response = await fetch(
      `${EXPRESS_SERVER_URL}/api/user/analytics?address=${address}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Don't cache for fresh data
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch analytics from Node.js server')
    }

    const analytics = await response.json()

    return NextResponse.json(analytics, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500, headers: corsHeaders }
    )
  }
}