// app/api/polymarket/activity/route.ts
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const limit = searchParams.get('limit') || '25'
    const offset = searchParams.get('offset') || '0'
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch activity data
    const response = await fetch(
      `https://data-api.polymarket.com/activity?user=${address}&limit=${limit}&offset=${offset}`,
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      throw new Error(`Activity fetch failed: ${response.status}`)
    }
    
    const activityData = await response.json()

    // Filter out activities with empty market/title and then transform
    const transformedActivity = (activityData || [])
      .filter((activity: any) => {
        // Prefer title, fallback to market — consider both undefined/null/empty-string
        const marketName = activity?.title ?? activity?.market
        return typeof marketName === 'string' && marketName.trim() !== ''
      })
      .map((activity: any) => {
        const marketName = activity?.title ?? activity?.market ?? ''
        return {
          id: activity.transactionHash,
          timestamp: activity.timestamp,
          type: activity.type,
          side: activity.side,
          market: marketName,
          slug: activity.slug,
          eventSlug: activity.eventSlug,
          icon: activity.icon,
          outcome: activity.outcome,
          outcomeIndex: activity.outcomeIndex,
          size: activity.size,
          usdcSize: activity.usdcSize,
          price: activity.price,
          transactionHash: activity.transactionHash
        }
      })

    return NextResponse.json(transformedActivity, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity data' },
      { status: 500, headers: corsHeaders }
    )
  }
}
