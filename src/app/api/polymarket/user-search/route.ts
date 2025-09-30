// app/api/polymarket/user-search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/db/prisma'

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
    console.log('address',address);
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Normalize address for consistency
    const normalizedAddress = address.toLowerCase()

    // Step 1: Check if user exists in database (UserAnalytics table)
    const existingUser = await prisma.userAnalytics.findUnique({
      where: { 
        address: normalizedAddress 
      },
      include: {
        buySellData: true,
        tradeSizeData: true,
        priceStats: true,
        marketDistribution: {
          take: 5,
          orderBy: {
            volume: 'desc'
          }
        },
        monthlyPerformance: {
          take: 12,
          orderBy: {
            yearMonth: 'desc'
          }
        },
        weeklyWinRate: {
          take: 8,
          orderBy: {
            weekDate: 'desc'
          }
        }
      }
    })

    if (existingUser) {
      console.log(`User ${normalizedAddress} found in database`)
      
      // Transform existing user data to match expected format
      const transformedUser = {
        address: existingUser.address,
        tradingVolume: existingUser.totalVolume,
        winRate: existingUser.averageWinRate,
        avgReturn: existingUser.totalProfit / (existingUser.totalTrades || 1),
        trades: existingUser.totalTrades,
        largestLoss: existingUser.monthlyPerformance.reduce((min, perf) => 
          Math.min(min, perf.profit), 0
        ),
        highestProfit: existingUser.monthlyPerformance.reduce((max, perf) => 
          Math.max(max, perf.profit), 0
        ),
        buyPercentage: existingUser.buySellData?.buyPercentage || 0,
        sellPercentage: existingUser.buySellData?.sellPercentage || 0,
        walletAge: Math.floor(
          (Date.now() - new Date(existingUser.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ),
        riskProfile: existingUser.riskProfile,
        // Include all additional data
        positionValue: existingUser.positionValue,
        mostTradedCategory: existingUser.mostTradedCategory,
        tradingStyle: existingUser.tradingStyle,
        avgMonthlyProfit: existingUser.avgMonthlyProfit,
        avgMonthlyTrades: existingUser.avgMonthlyTrades,
        marketDistribution: existingUser.marketDistribution,
        monthlyPerformance: existingUser.monthlyPerformance,
        weeklyWinRate: existingUser.weeklyWinRate
      }

      return NextResponse.json({
        user: transformedUser,
        fromDatabase: true
      }, { headers: corsHeaders })
    }

    // Step 2: User not in database, fetch from Polymarket
    console.log(`User ${normalizedAddress} not in database, fetching from Polymarket`)
    
    // Fetch user profile from Polymarket using your existing route
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
    console.log('baseUrl',baseUrl);
    const profileResponse = await fetch(
      `${baseUrl}/api/market/user?address=${normalizedAddress}`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )

    console.log('');
    
    if (!profileResponse.ok) {
      return NextResponse.json(
        { error: 'User not found on Polymarket' },
        { status: 404, headers: corsHeaders }
      )
    }
    
    const profileData = await profileResponse.json()

    // Step 3: Fetch analytics for the new user
    const analyticsResponse = await fetch(
      `${baseUrl}/api/polymarket/analytics?address=${normalizedAddress}`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )
    
    let analytics = null
    if (analyticsResponse.ok) {
      analytics = await analyticsResponse.json()
    }

    // Transform the fresh data to match your table format
    const transformedUser = {
      address: normalizedAddress,
      tradingVolume: analytics?.overview?.totalVolume || profileData.volumeTraded || 0,
      winRate: analytics?.overview?.averageWinRate || 0,
      avgReturn: analytics?.overview?.totalProfit && analytics?.overview?.totalVolume 
        ? (analytics.overview.totalProfit / analytics.overview.totalVolume) * 100 
        : 0,
      trades: analytics?.overview?.totalTrades || profileData.numTrades || 0,
      largestLoss: analytics?.tradeSizeDistribution?.minSize 
        ? Math.abs(analytics.tradeSizeDistribution.minSize) 
        : 0,
      highestProfit: analytics?.tradeSizeDistribution?.maxSize || 0,
      buyPercentage: analytics?.buySellDistribution?.buyPercentage || 0,
      sellPercentage: analytics?.buySellDistribution?.sellPercentage || 0,
      walletAge: profileData.createdAt 
        ? Math.floor((Date.now() - new Date(profileData.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
      riskProfile: analytics?.insights?.riskProfile || 'Medium',
      // Include analytics data
      positionValue: analytics?.overview?.positionValue || profileData.portfolioValue || 0,
      mostTradedCategory: analytics?.insights?.mostTradedCategory || 'Unknown',
      tradingStyle: analytics?.insights?.tradingStyle || 'Mixed',
      avgMonthlyProfit: analytics?.overview?.avgMonthlyProfit || 0,
      avgMonthlyTrades: analytics?.overview?.avgMonthlyTrades || 0,
      marketDistribution: analytics?.marketDistribution || [],
      monthlyPerformance: analytics?.performanceData || [],
      weeklyWinRate: analytics?.winRateData || [],
      // Include profile data
      username: profileData.username,
      bio: profileData.bio,
      isVerified: profileData.isVerified,
      pnlUsd: profileData.pnlUsd,
      totalDeposits: profileData.totalDeposits,
      totalWithdrawals: profileData.totalWithdrawals
    }

    return NextResponse.json({
      user: transformedUser,
      fromDatabase: false,
      newUser: true
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Error in user search:', error)
    return NextResponse.json(
      { error: 'Failed to search user' },
      { status: 500, headers: corsHeaders }
    )
  }
}