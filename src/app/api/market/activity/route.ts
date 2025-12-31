/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/market/activity/route.ts
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
    console.log('called for more activity');
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const requestedLimit = parseInt(searchParams.get('limit') || '50')// User can request how many
    const batchSize = 25 // API batch size
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`Fetching ${requestedLimit} activities for address: ${address}`)

    // Fetch activity up to the requested limit
    const allActivity: any[] = []
    let offset = 0
    let hasMoreData = true
    let reachedEnd = false // Track if we've reached the actual end of data

    while (hasMoreData && allActivity.length < requestedLimit) {
      try {
        console.log(`Fetching activity batch at offset ${offset}...`)
        
        const response = await fetch(
          `https://data-api.polymarket.com/activity?user=${address}&limit=${batchSize}&offset=${offset}`,
          { 
            headers: { 
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            },
            cache: 'no-store'
          }
        )
        
        if (!response.ok) {
          console.warn(`API returned status ${response.status} at offset ${offset}`)
          hasMoreData = false
          reachedEnd = true
          break
        }
        
        const data = await response.json()
        const activityArray = Array.isArray(data) ? data : []
        
        // If we get empty array, we've reached the end
        if (activityArray.length === 0) {
          hasMoreData = false
          reachedEnd = true
          console.log(`No more data at offset ${offset}. Total activities fetched: ${allActivity.length}`)
          break
        }
        
        allActivity.push(...activityArray)
        console.log(`Fetched ${activityArray.length} activities. Total so far: ${allActivity.length}`)
        
        // If we got less than batchSize, we've reached the end
        if (activityArray.length < batchSize) {
          hasMoreData = false
          reachedEnd = true
          console.log(`Reached end of data. Total activities: ${allActivity.length}`)
          break
        }
        
        // Move to next batch
        offset += batchSize
        
        // Optional: Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error fetching batch at offset ${offset}:`, error)
        hasMoreData = false
        reachedEnd = true
        break
      }
    }


    // Limit to requested amount
    const limitedActivity = allActivity.slice(0, requestedLimit)

    // Filter out activities with empty market/title and then transform
    const transformedActivity = limitedActivity
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


    // 🔥 KEY FIX: hasMore should be true if:
    // 1. We haven't reached the actual end of data (reachedEnd === false)
    // 2. OR we stopped because we hit the requestedLimit (allActivity.length >= requestedLimit)
    const hasMoreActivities = !reachedEnd || allActivity.length > requestedLimit

    return NextResponse.json({
      activities: transformedActivity,
      count: transformedActivity.length,
      address: address,
      hasMore: hasMoreActivities, // 🔥 Fixed logic
      nextOffset: Math.min(allActivity.length, requestedLimit)
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json(
      { 
        activities: [],
        count: 0,
        address: request.nextUrl.searchParams.get('address') || '',
        hasMore: false,
        nextOffset: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch activity data'
      },
      { status: 200, headers: corsHeaders } // Return 200 to prevent UI errors
    )
  }
}