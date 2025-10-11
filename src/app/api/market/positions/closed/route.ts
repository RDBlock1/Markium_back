// app/api/polymarket/positions/closed/route.ts
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
    const sortBy = searchParams.get('sortBy') || 'realizedpnl'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`Fetching closed positions for address: ${address}`)

    // Fetch closed positions from Polymarket API
    const response = await fetch(
      `https://data-api.polymarket.com/closed-positions?user=${address}&sortBy=${sortBy}&sortDirection=${sortDirection}&limit=${limit}&offset=${offset}`,
      { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0' // Some APIs require a user agent
        },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      // Log the error but don't throw - return empty array instead
      console.warn(`Closed positions API returned status ${response.status} for address: ${address}`)
      
      // Try to get error message from response
      let errorMessage = `API returned status ${response.status}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
      
      // Return empty array with warning instead of throwing error
      return NextResponse.json({
        positions: [],
        count: 0,
        address: address,
        warning: `No closed positions found: ${errorMessage}`
      }, { headers: corsHeaders })
    }
    
    const data = await response.json()
    
    // Ensure data is an array
    const positionsArray = Array.isArray(data) ? data : []

    // Transform closed positions with complete data structure
    const transformedPositions = positionsArray.map((position: any) => ({
      // Core identifiers
      id: position.conditionId || position.id,
      conditionId: position.conditionId,
      
      // Market information
      market: position.title || position.market,
      slug: position.slug,
      eventSlug: position.eventSlug,
      icon: position.icon,
      
      // Position details
      outcome: position.outcome,
      outcomeIndex: position.outcomeIndex,
      oppositeOutcome: position.oppositeOutcome,
      
      // Quantities
      shares: position.size || 0,
      totalBought: position.totalBought || position.size || 0,
      totalSold: position.totalSold || 0,
      
      // Prices
      avgPrice: position.avgPrice || 0,
      avgBuyPrice: position.avgBuyPrice || position.avgPrice || 0,
      avgSellPrice: position.avgSellPrice || 0,
      currentPrice: position.curPrice || position.currentPrice || 0,
      closePrice: position.closePrice || position.curPrice || 0,
      
      // Values
      initialValue: position.initialValue || 0,
      currentValue: position.currentValue || 0,
      closeValue: position.closeValue || position.currentValue || 0,
      
      // Profit/Loss metrics
      pnl: position.cashPnl || position.realizedPnl || 0,
      realizedPnl: position.realizedPnl || position.cashPnl || 0,
      unrealizedPnl: position.unrealizedPnl || 0,
      percentPnl: position.percentPnl || 0,
      percentRealizedPnl: position.percentRealizedPnl || position.percentPnl || 0,
      
      // Status flags
      redeemable: position.redeemable || false,
      mergeable: position.mergeable || false,
      resolved: position.resolved !== undefined ? position.resolved : true,
      negativeRisk: position.negativeRisk || false,
      
      // Timestamps
      endDate: position.endDate,
      closedAt: position.closedAt || position.endDate,
      resolvedAt: position.resolvedAt,
      
      // Fixed status
      status: 'closed'
    }))

    // Sort by realized P&L if no explicit sort was requested
    if (!searchParams.get('sortBy')) {
      transformedPositions.sort((a: any, b: any) => b.realizedPnl - a.realizedPnl)
    }

    console.log(`Successfully fetched ${transformedPositions.length} closed positions for address: ${address}`)

    // Calculate summary statistics
    const totalRealizedPnl = transformedPositions.reduce((sum: number, pos: any) => sum + pos.realizedPnl, 0)
    const winningPositions = transformedPositions.filter((pos: any) => pos.realizedPnl > 0).length
    const losingPositions = transformedPositions.filter((pos: any) => pos.realizedPnl < 0).length
    const winRate = transformedPositions.length > 0 
      ? (winningPositions / transformedPositions.length * 100).toFixed(1) 
      : 0

    return NextResponse.json({
      positions: transformedPositions,
      count: transformedPositions.length,
      address: address,
      summary: {
        totalRealizedPnl: totalRealizedPnl,
        winningPositions: winningPositions,
        losingPositions: losingPositions,
        winRate: winRate
      }
    }, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching closed positions:', error)
    
    // Return empty data instead of error to prevent UI crashes
    return NextResponse.json(
      { 
        positions: [],
        count: 0,
        address: request.nextUrl.searchParams.get('address') || '',
        error: error instanceof Error ? error.message : 'Failed to fetch closed positions data',
        summary: {
          totalRealizedPnl: 0,
          winningPositions: 0,
          losingPositions: 0,
          winRate: 0
        }
      },
      { status: 200, headers: corsHeaders } // Return 200 to prevent UI errors
    )
  }
}