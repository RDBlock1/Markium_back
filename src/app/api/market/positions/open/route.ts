/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================
// OPEN POSITIONS API
// app/api/polymarket/positions/open/route.ts
// ============================================

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
    const sortBy = searchParams.get('sortBy') || 'CURRENT'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'
    const sizeThreshold = searchParams.get('sizeThreshold') || '0.1'
    const requestedLimit = parseInt(searchParams.get('limit') || '50') // User can request how many
    const batchSize = 50 // API batch size
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`Fetching ${requestedLimit} open positions for address: ${address}`)

    // Fetch open positions up to the requested limit
    const allPositions: any[] = []
    let offset = 0
    let hasMoreData = true

    while (hasMoreData && allPositions.length < requestedLimit) {
      try {
        console.log(`Fetching batch at offset ${offset}...`)
        
        const response = await fetch(
          `https://data-api.polymarket.com/positions?user=${address}&sortBy=${sortBy}&sortDirection=${sortDirection}&sizeThreshold=${sizeThreshold}&limit=${batchSize}&offset=${offset}`,
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
          break
        }
        
        const data = await response.json()
        const positionsArray = Array.isArray(data) ? data : []
        
        // If we get empty array, we've reached the end
        if (positionsArray.length === 0) {
          hasMoreData = false
          console.log(`No more data at offset ${offset}. Total positions fetched: ${allPositions.length}`)
          break
        }
        
        allPositions.push(...positionsArray)
        console.log(`Fetched ${positionsArray.length} positions. Total so far: ${allPositions.length}`)
        
        // If we got less than batchSize, we've reached the end
        if (positionsArray.length < batchSize) {
          hasMoreData = false
          console.log(`Reached end of data. Total positions: ${allPositions.length}`)
          break
        }
        
        // Move to next batch
        offset += batchSize
        
        // Optional: Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`Error fetching batch at offset ${offset}:`, error)
        hasMoreData = false
        break
      }
    }

    console.log(`Finished fetching. Total open positions: ${allPositions.length}`)

    // Limit to requested amount
    const limitedPositions = allPositions.slice(0, requestedLimit)

    // Transform open positions with consistent structure
    const transformedPositions = limitedPositions.map((position: any) => ({
      id: position.conditionId,
      market: position.title,
      slug: position.slug,
      eventSlug: position.eventSlug,
      icon: position.icon,
      outcome: position.outcome,
      outcomeIndex: position.outcomeIndex,
      oppositeOutcome: position.oppositeOutcome,
      shares: position.size,
      avgPrice: position.avgPrice,
      currentPrice: position.curPrice,
      initialValue: position.initialValue,
      currentValue: position.currentValue,
      pnl: position.cashPnl,
      percentPnl: position.percentPnl,
      realizedPnl: position.realizedPnl,
      percentRealizedPnl: position.percentRealizedPnl,
      redeemable: position.redeemable,
      mergeable: position.mergeable,
      endDate: position.endDate,
      negativeRisk: position.negativeRisk,
      totalBought: position.totalBought || 0,
      status: 'open'
    }))

    console.log(`Successfully processed ${transformedPositions.length} open positions for address: ${address}`)

    return NextResponse.json({
      positions: transformedPositions,
      count: transformedPositions.length,
      address: address,
      hasMore: hasMoreData || allPositions.length > requestedLimit,
      nextLimit: Math.min(allPositions.length, requestedLimit) + 50 // Suggest next limit
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching open positions:', error)
    return NextResponse.json(
      { 
        positions: [],
        count: 0,
        address: request.nextUrl.searchParams.get('address') || '',
        hasMore: false,
        nextLimit: 50,
        error: error instanceof Error ? error.message : 'Failed to fetch open positions data'
      },
      { status: 200, headers: corsHeaders }
    )
  }
}