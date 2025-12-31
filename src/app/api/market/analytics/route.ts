/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Helper function to categorize markets
function categorizeMarket(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('bitcoin') || lowerTitle.includes('ethereum') || 
      lowerTitle.includes('crypto') || lowerTitle.includes('btc') || 
      lowerTitle.includes('eth') || lowerTitle.includes('solana')) {
    return 'Crypto'
  }
  if (lowerTitle.includes('election') || lowerTitle.includes('president') || 
      lowerTitle.includes('democrat') || lowerTitle.includes('republican') ||
      lowerTitle.includes('trump') || lowerTitle.includes('biden') ||
      lowerTitle.includes('congress') || lowerTitle.includes('senate')) {
    return 'Politics'
  }
  if (lowerTitle.includes('nfl') || lowerTitle.includes('nba') || 
      lowerTitle.includes('soccer') || lowerTitle.includes('football') ||
      lowerTitle.includes('baseball') || lowerTitle.includes('hockey') ||
      lowerTitle.includes('game') || lowerTitle.includes('match')) {
    return 'Sports'
  }
  if (lowerTitle.includes('gdp') || lowerTitle.includes('inflation') || 
      lowerTitle.includes('fed') || lowerTitle.includes('economy') ||
      lowerTitle.includes('unemployment') || lowerTitle.includes('recession')) {
    return 'Economics'
  }
  if (lowerTitle.includes('ai') || lowerTitle.includes('tech') || 
      lowerTitle.includes('silicon') || lowerTitle.includes('startup')) {
    return 'Technology'
  }
  if (lowerTitle.includes('weather') || lowerTitle.includes('temperature') || 
      lowerTitle.includes('climate')) {
    return 'Weather'
  }
  return 'Other'
}

// Helper function to get month name
function getMonthName(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[date.getMonth()]
}

// Helper function to get week label
function getWeekLabel(date: Date): string {
  const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1
  return `W${weekNumber}`
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

    // Fetch all data in parallel
    const [activityResponse, positionsResponse, metricsResponse] = await Promise.all([
      // Activity data - get more records for better analysis
      fetch(
        `https://data-api.polymarket.com/activity?user=${address}&limit=500&offset=0`,
        { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
      ),
      // Positions data
      fetch(
        `https://data-api.polymarket.com/positions?user=${address}&sortBy=CURRENT&sortDirection=DESC&sizeThreshold=0.1&limit=100&offset=0`,
        { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
      ),
      // Metrics data
      Promise.all([
        fetch(
          `https://lb-api.polymarket.com/volume?window=all&limit=1&address=${address}`,
          { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
        ),
        fetch(
          `https://lb-api.polymarket.com/profit?window=all&limit=1&address=${address}`,
          { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
        ),
        fetch(
          `https://data-api.polymarket.com/value?user=${address}`,
          { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
        )
      ])
    ])

    if (!activityResponse.ok || !positionsResponse.ok) {
      throw new Error('Failed to fetch data')
    }

    const activityData = await activityResponse.json()
    const positionsData = await positionsResponse.json()
    
    const [volumeRes, profitRes, valueRes] = metricsResponse
    const volumeData = await volumeRes.json()
    const profitData = await profitRes.json()
    const valueData = await valueRes.json()

    // Process Market Distribution
    const marketCategories: Record<string, { trades: number, volume: number, markets: Set<string> }> = {}
    
    activityData.forEach((activity: any) => {
      const category = categorizeMarket(activity.title || '')
      if (!marketCategories[category]) {
        marketCategories[category] = { trades: 0, volume: 0, markets: new Set() }
      }
      marketCategories[category].trades++
      marketCategories[category].volume += parseFloat(activity.usdcSize || 0)
      marketCategories[category].markets.add(activity.slug)
    })

    const totalTrades = Object.values(marketCategories).reduce((sum, cat) => sum + cat.trades, 0)
    const marketDistribution = Object.entries(marketCategories)
      .map(([market, data]) => ({
        market,
        value: totalTrades > 0 ? Math.round((data.trades / totalTrades) * 100) : 0,
        trades: data.trades,
        volume: Math.round(data.volume),
        uniqueMarkets: data.markets.size
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories

    // Process Buy/Sell Distribution
    let buyCount = 0
    let sellCount = 0
    let buyVolume = 0
    let sellVolume = 0
    
    activityData.forEach((activity: any) => {
      if (activity.side === 'BUY') {
        buyCount++
        buyVolume += parseFloat(activity.usdcSize || 0)
      } else if (activity.side === 'SELL') {
        sellCount++
        sellVolume += parseFloat(activity.usdcSize || 0)
      }
    })

    const totalOrders = buyCount + sellCount
    const buySellDistribution = {
      buyPercentage: totalOrders > 0 ? Math.round((buyCount / totalOrders) * 100) : 0,
      sellPercentage: totalOrders > 0 ? Math.round((sellCount / totalOrders) * 100) : 0,
      buyVolume: Math.round(buyVolume),
      sellVolume: Math.round(sellVolume),
      buyCount,
      sellCount
    }

    // Process Trade Size Distribution
    const tradeSizes = activityData.map((activity: any) => parseFloat(activity.usdcSize || 0))
    const sortedSizes = tradeSizes.sort((a: number, b: number) => a - b)
    
    const tradeSizeDistribution = {
      averageSize: tradeSizes.length > 0 ? 
        Math.round(tradeSizes.reduce((sum: number, size: number) => sum + size, 0) / tradeSizes.length) : 0,
      medianSize: sortedSizes.length > 0 ? 
        Math.round(sortedSizes[Math.floor(sortedSizes.length / 2)]) : 0,
      minSize: sortedSizes.length > 0 ? Math.round(sortedSizes[0]) : 0,
      maxSize: sortedSizes.length > 0 ? Math.round(sortedSizes[sortedSizes.length - 1]) : 0,
      smallTrades: tradeSizes.filter((size: number) => size < 100).length,
      mediumTrades: tradeSizes.filter((size: number) => size >= 100 && size < 1000).length,
      largeTrades: tradeSizes.filter((size: number) => size >= 1000).length
    }

    // Process Average Prices
    const prices = activityData
      .filter((activity: any) => activity.price)
      .map((activity: any) => parseFloat(activity.price))
    
    const averagePriceStats = {
      averagePrice: prices.length > 0 ? 
        (prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length).toFixed(3) : '0',
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices).toFixed(3) : '0',
        max: prices.length > 0 ? Math.max(...prices).toFixed(3) : '0'
      }
    }

    // Process Monthly Performance (last 9 months)
    const monthlyData: Record<string, { profit: number, volume: number, trades: number }> = {}
    const now = new Date()
    
    // Initialize last 9 months
    for (let i = 8; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = { profit: 0, volume: 0, trades: 0 }
    }

    // Aggregate activity data by month
    activityData.forEach((activity: any) => {
      // Handle timestamp - it might be in seconds or milliseconds
      const timestamp = activity.timestamp
      let date: Date
      
      // Check if timestamp is in seconds (10 digits) or milliseconds (13 digits)
      if (timestamp < 10000000000) {
        date = new Date(timestamp * 1000) // Convert seconds to milliseconds
      } else {
        date = new Date(timestamp)
      }
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].trades++
        // Use usdcSize for volume calculation
        const volumeAmount = parseFloat(activity.usdcSize || activity.size || 0)
        monthlyData[monthKey].volume += volumeAmount
        
        // Estimate profit based on side and price changes
        if (activity.side === 'SELL') {
          monthlyData[monthKey].profit += volumeAmount * 0.1 // Simplified profit calculation
        }
      }
    })

    // Add positions profit to current month
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    positionsData.forEach((position: any) => {
      const pnl = parseFloat(position.cashPnl || position.pnl || 0)
      if (monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey].profit += pnl
      }
    })

    const performanceData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, data]) => {
        const date = new Date(monthKey + '-01')
        return {
          month: getMonthName(date),
          profit: Math.round(data.profit),
          volume: Math.round(data.volume),
          trades: data.trades
        }
      })

    // Process Win Rate (weekly for last 8 weeks)
    const weeklyWinRate: Record<string, { wins: number, losses: number, total: number }> = {}
    const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000))
    
    // Initialize weeks
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(eightWeeksAgo.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
      const weekKey = `W${i + 1}`
      weeklyWinRate[weekKey] = { wins: 0, losses: 0, total: 0 }
    }

    // Calculate win rate from positions
    positionsData.forEach((position: any) => {
      const pnl = parseFloat(position.cashPnl || 0)
      const weekIndex = Math.floor(Math.random() * 8) // Distribute positions across weeks
      const weekKey = `W${weekIndex + 1}`
      
      if (weeklyWinRate[weekKey]) {
        weeklyWinRate[weekKey].total++
        if (pnl > 0) {
          weeklyWinRate[weekKey].wins++
        } else if (pnl < 0) {
          weeklyWinRate[weekKey].losses++
        }
      }
    })

    const winRateData = Object.entries(weeklyWinRate).map(([week, data]) => ({
      week,
      winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 50,
      totalTrades: data.total
    }))

    // Calculate overall statistics
    const totalPositions = positionsData.length
    const profitablePositions = positionsData.filter((p: any) => parseFloat(p.cashPnl || 0) > 0).length
    const averageWinRate = totalPositions > 0 ? 
      Math.round((profitablePositions / totalPositions) * 100) : 0

    const totalProfit = profitData[0]?.amount || 0
    const monthsWithData = performanceData.filter(m => m.trades > 0).length
    const avgMonthlyProfit = monthsWithData > 0 ? Math.round(totalProfit / monthsWithData) : 0
    const avgMonthlyTrades = monthsWithData > 0 ? 
      Math.round(performanceData.reduce((sum, m) => sum + m.trades, 0) / monthsWithData) : 0

    // Compile final analytics response
    const analytics = {
      // Overview metrics
      overview: {
        totalVolume: volumeData[0]?.amount || 0,
        totalProfit: totalProfit,
        positionValue: valueData[0]?.value || 0,
        totalTrades: activityData.length,
        totalPositions: positionsData.length,
        averageWinRate: averageWinRate,
        avgMonthlyProfit: avgMonthlyProfit,
        avgMonthlyTrades: avgMonthlyTrades
      },
      
      // Market distribution
      marketDistribution,
      
      // Buy/Sell analysis
      buySellDistribution,
      
      // Trade size analysis
      tradeSizeDistribution,
      
      // Price analysis
      averagePriceStats,
      
      // Time series data
      performanceData,
      winRateData,
      
      // Additional insights
      insights: {
        mostTradedCategory: marketDistribution[0]?.market || 'Unknown',
        tradingStyle: buyCount > sellCount ? 'Buyer' : 'Seller',
        averageHoldTime: 'N/A', // Would need more data to calculate
        riskProfile: tradeSizeDistribution.largeTrades > tradeSizeDistribution.smallTrades ? 'High Risk' : 'Conservative'
      }
    }


    return NextResponse.json(analytics, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500, headers: corsHeaders }
    )
  }
}