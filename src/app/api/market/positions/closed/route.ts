/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest,NextResponse } from "next/server"

type LabelType = 'WON' | 'LOST' | 'BREAK-EVEN'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const sortBy = searchParams.get('sortBy') || 'realizedpnl'
    const sortDirection = searchParams.get('sortDirection') || 'DESC'
    const requestedLimit = parseInt(searchParams.get('limit') || '50') // User can request how many
    const batchSize = 25 // API batch size

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log(`Fetching ${requestedLimit} closed positions for address: ${address}`)

    const allPositions: any[] = []
    let offset = 0
    let hasMoreData = true

    while (hasMoreData && allPositions.length < requestedLimit) {
      try {
        console.log('offset', offset)

        const response = await fetch(
          `https://data-api.polymarket.com/closed-positions?user=${address}&sortBy=${sortBy}&sortDirection=${sortDirection}&limit=${batchSize}&offset=${offset}`,
          {
            headers: {
              "Accept": 'application/json',
              "User-Agent": 'Mozilla/5.0'
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

        if (positionsArray.length === 0) {
          hasMoreData = false
          console.log('No more data at offset ', offset)
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

    console.log(`Finished fetching. Total closed positions: ${allPositions.length}`)

    // Limit to requested amount
    const limitedPositions = allPositions.slice(0, requestedLimit)

    // Transform closed positions with complete data structure and win/loss label
    const transformedPositions = limitedPositions.map((position: any) => {
      const realizedPnl = position.realizedPnl || 0

      let label: LabelType = 'WON'
      if (realizedPnl > 0) {
        label = 'WON'
      } else if (realizedPnl <= 0) {
        label = 'LOST'
      } 
      return {
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
        pnl: realizedPnl,
        realizedPnl: realizedPnl,
        unrealizedPnl: position.unrealizedPnl || 0,
        percentPnl: position.percentPnl || 0,
        percentRealizedPnl: position.percentRealizedPnl || position.percentPnl || 0,
        
        // Win/Loss Label
        label: label,
        
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
      }
    })

    // Sort by realized P&L if no explicit sort was requested
    if (!searchParams.get('sortBy')) {
      transformedPositions.sort((a: any, b: any) => b.realizedPnl - a.realizedPnl)
    }

    // Calculate summary statistics
    const totalRealizedPnl = transformedPositions.reduce((sum: number, pos: any) => sum + pos.realizedPnl, 0)
    const winningPositions = transformedPositions.filter((pos: any) => pos.label === 'WON').length
    const losingPositions = transformedPositions.filter((pos: any) => pos.label === 'LOST').length
    const breakEvenPositions = transformedPositions.filter((pos: any) => pos.label === 'BREAK-EVEN').length
    const winRate = transformedPositions.length > 0 
      ? (winningPositions / transformedPositions.length * 100).toFixed(1) 
      : 0

    console.log(`Successfully processed ${transformedPositions.length} closed positions for address: ${address}`)
    console.log(`Summary - Wins: ${winningPositions}, Losses: ${losingPositions}, Break-even: ${breakEvenPositions}`)

    return NextResponse.json({
      positions: transformedPositions,
      count: transformedPositions.length,
      address: address,
      hasMore: hasMoreData || allPositions.length > requestedLimit,
      nextLimit: Math.min(allPositions.length, requestedLimit) + 50, // Suggest next limit
      summary: {
        totalRealizedPnl: totalRealizedPnl,
        winningPositions: winningPositions,
        losingPositions: losingPositions,
        breakEvenPositions: breakEvenPositions,
        winRate: winRate
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching closed positions:', error)
    
    return NextResponse.json(
      { 
        positions: [],
        count: 0,
        address: request.nextUrl.searchParams.get('address') || '',
        hasMore: false,
        nextLimit: 50,
        error: error instanceof Error ? error.message : 'Failed to fetch closed positions data',
        summary: {
          totalRealizedPnl: 0,
          winningPositions: 0,
          losingPositions: 0,
          breakEvenPositions: 0,
          winRate: 0
        }
      },
      { status: 200, headers: corsHeaders }
    )
  }
}