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

    // Fetch positions data
    const response = await fetch(
      `https://data-api.polymarket.com/positions?user=${address}&sortBy=${sortBy}&sortDirection=${sortDirection}&sizeThreshold=${sizeThreshold}&limit=${limit}&offset=${offset}`,
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )
    
    if (!response.ok) {
      throw new Error(`Positions fetch failed: ${response.status}`)
    }
    
    const positionsData = await response.json()

    // Transform the data to match the UI structure
    const transformedPositions = positionsData.map((position: any) => ({
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
      negativeRisk: position.negativeRisk
    }))


    return NextResponse.json(transformedPositions, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch positions data' },
      { status: 500, headers: corsHeaders }
    )
  }
}