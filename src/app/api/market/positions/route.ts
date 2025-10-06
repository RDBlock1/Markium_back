// app/api/polymarket/positions/route.ts
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
    const limit = searchParams.get('limit') || '50'
    const offset = searchParams.get('offset') || '0'
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch both open and closed positions in parallel
    const [openPositionsResponse, closedPositionsResponse] = await Promise.all([
      fetch(
        `https://data-api.polymarket.com/positions?user=${address}&sortBy=${sortBy}&sortDirection=${sortDirection}&sizeThreshold=${sizeThreshold}&limit=${limit}&offset=${offset}`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      ),
      fetch(
        `https://data-api.polymarket.com/closed-positions?user=${address}&sortBy=realizedpnl&sortDirection=DESC&limit=25&offset=0`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      )
    ])
    
    if (!openPositionsResponse.ok) {
      throw new Error(`Open positions fetch failed: ${openPositionsResponse.status}`)
    }
    
    if (!closedPositionsResponse.ok) {
      console.warn(`Closed positions fetch failed: ${closedPositionsResponse.status}`)
      // Continue even if closed positions fail
    }
    
    const openPositionsData = await openPositionsResponse.json()
    const closedPositionsData = closedPositionsResponse.ok 
      ? await closedPositionsResponse.json() 
      : []

    // Transform open positions
    const transformedOpenPositions = openPositionsData.map((position: any) => ({
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
      status: 'open' // Add status to distinguish
    }))

    // Transform closed positions
    const transformedClosedPositions = closedPositionsData.map((position: any) => ({
      id: position.conditionId,
      market: position.title,
      slug: position.slug,
      eventSlug: position.eventSlug,
      icon: position.icon,
      outcome: position.outcome,
      outcomeIndex: position.outcomeIndex,
      oppositeOutcome: position.oppositeOutcome,
      shares: position.size || 0,
      avgPrice: position.avgPrice,
      currentPrice: position.curPrice || 0,
      initialValue: position.initialValue,
      currentValue: position.currentValue || 0,
      pnl: position.cashPnl || position.realizedPnl,
      totalBought: position.totalBought,
      realizedPnl: position.realizedPnl,
      percentRealizedPnl: position.percentRealizedPnl,
      redeemable: position.redeemable || false,
      mergeable: position.mergeable || false,
      endDate: position.endDate,
      negativeRisk: position.negativeRisk || false,
      status: 'closed' // Add status to distinguish
    }))

    // Merge both arrays - open positions first, then closed
    const allPositions = [...transformedOpenPositions, ...transformedClosedPositions]

    return NextResponse.json(allPositions, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions data' },
      { status: 500, headers: corsHeaders }
    )
  }
}