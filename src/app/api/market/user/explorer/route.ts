// app/api/users/explorer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';
import { Prisma } from '@/generated/prisma/client';

interface FilterParams {
  searchQuery?: string;
  volumeRange?: [number, number];
  ageRange?: [number, number];
  winRateRange?: [number, number];
  buyRatioRange?: [number, number];
  sellRatioRange?: [number, number];
  largestLossRange?: [number, number];
  highestProfitRange?: [number, number];
  avgReturnRange?: [number, number];
  tradesRange?: [number, number];
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse filter parameters
    const filters: FilterParams = {
      searchQuery: searchParams.get('searchQuery') || undefined,
      volumeRange: searchParams.get('volumeRange') 
        ? JSON.parse(searchParams.get('volumeRange')!) 
        : undefined,
      ageRange: searchParams.get('ageRange') 
        ? JSON.parse(searchParams.get('ageRange')!) 
        : undefined,
      winRateRange: searchParams.get('winRateRange') 
        ? JSON.parse(searchParams.get('winRateRange')!) 
        : undefined,
      buyRatioRange: searchParams.get('buyRatioRange') 
        ? JSON.parse(searchParams.get('buyRatioRange')!) 
        : undefined,
      sellRatioRange: searchParams.get('sellRatioRange') 
        ? JSON.parse(searchParams.get('sellRatioRange')!) 
        : undefined,
      largestLossRange: searchParams.get('largestLossRange') 
        ? JSON.parse(searchParams.get('largestLossRange')!) 
        : undefined,
      highestProfitRange: searchParams.get('highestProfitRange') 
        ? JSON.parse(searchParams.get('highestProfitRange')!) 
        : undefined,
      avgReturnRange: searchParams.get('avgReturnRange') 
        ? JSON.parse(searchParams.get('avgReturnRange')!) 
        : undefined,
      tradesRange: searchParams.get('tradesRange') 
        ? JSON.parse(searchParams.get('tradesRange')!) 
        : undefined,
      timeframe: searchParams.get('timeframe') as FilterParams['timeframe'] || 'all',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '30'),
      sortBy: searchParams.get('sortBy') || 'totalVolume',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    };

    // Build where clause
    const whereClause: Prisma.UserAnalyticsWhereInput = {};
    
    // Search by address
    if (filters.searchQuery) {
      whereClause.address = {
        contains: filters.searchQuery.toLowerCase(),
        mode: 'insensitive',
      };
    }

    // Volume filter (converting from thousands in UI to actual values)
    if (filters.volumeRange) {
      whereClause.totalVolume = {
        gte: filters.volumeRange[0] * 1000,
        lte: filters.volumeRange[1] * 1000,
      };
    }

    // Win rate filter
    if (filters.winRateRange) {
      whereClause.averageWinRate = {
        gte: filters.winRateRange[0],
        lte: filters.winRateRange[1],
      };
    }

    // Average return filter
    if (filters.avgReturnRange) {
      whereClause.totalProfit = {
        gte: filters.avgReturnRange[0],
        lte: filters.avgReturnRange[1],
      };
    }

    // Trades filter
    if (filters.tradesRange) {
      whereClause.totalTrades = {
        gte: filters.tradesRange[0],
        lte: filters.tradesRange[1],
      };
    }

    // Calculate wallet age based on timeframe
    if (filters.timeframe !== 'all' && filters.ageRange) {
      const now = new Date();
      const minDate = new Date();
      const maxDate = new Date();
      
      minDate.setDate(now.getDate() - filters.ageRange[1]);
      maxDate.setDate(now.getDate() - filters.ageRange[0]);
      
      whereClause.createdAt = {
        gte: minDate,
        lte: maxDate,
      };
    }

    // Pagination
    const skip = (filters.page! - 1) * filters.limit!;
    const take = filters.limit!;

    // Build orderBy clause
    const orderBy: Prisma.UserAnalyticsOrderByWithRelationInput = {
      [filters.sortBy!]: filters.sortOrder,
    };

    // Fetch users with related data
    const [users, totalCount] = await Promise.all([
      prisma.userAnalytics.findMany({
        where: whereClause,
        include: {
          buySellData: true,
          tradeSizeData: true,
          priceStats: true,
          marketDistribution: {
            take: 5,
            orderBy: {
              volume: 'desc',
            },
          },
          monthlyPerformance: {
            take: 12,
            orderBy: {
              yearMonth: 'desc',
            },
          },
          weeklyWinRate: {
            take: 4,
            orderBy: {
              weekDate: 'desc',
            },
          },
        },
        skip,
        take,
        orderBy,
      }),
      prisma.userAnalytics.count({ where: whereClause }),
    ]);

    // Transform data for UI
    const transformedUsers = users.map(user => ({
      address: user.address,
      tradingVolume: user.totalVolume,
      winRate: user.averageWinRate,
      avgReturn: user.totalProfit / (user.totalTrades || 1), // Calculate average return
      trades: user.totalTrades,
      largestLoss: user.monthlyPerformance.reduce((min, perf) => 
        Math.min(min, perf.profit), 0
      ),
      highestProfit: user.monthlyPerformance.reduce((max, perf) => 
        Math.max(max, perf.profit), 0
      ),
      buyPercentage: user.buySellData?.buyPercentage || 0,
      sellPercentage: user.buySellData?.sellPercentage || 0,
      walletAge: Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      // Additional data for detailed view
      positionValue: user.positionValue,
      mostTradedCategory: user.mostTradedCategory,
      tradingStyle: user.tradingStyle,
      riskProfile: user.riskProfile,
      avgMonthlyProfit: user.avgMonthlyProfit,
      avgMonthlyTrades: user.avgMonthlyTrades,
      marketDistribution: user.marketDistribution,
      tradeSizeData: user.tradeSizeData,
      priceStats: user.priceStats,
      monthlyPerformance: user.monthlyPerformance,
      weeklyWinRate: user.weeklyWinRate,
    }));

    const response = NextResponse.json({
      users: transformedUsers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / filters.limit!),
      },
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch user analytics' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

// Get single user details
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    
    if (!address) {
      const response = NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    const user = await prisma.userAnalytics.findUnique({
      where: { address },
      include: {
        buySellData: true,
        tradeSizeData: true,
        priceStats: true,
        marketDistribution: {
          orderBy: {
            volume: 'desc',
          },
        },
        monthlyPerformance: {
          orderBy: {
            yearMonth: 'desc',
          },
        },
        weeklyWinRate: {
          orderBy: {
            weekDate: 'desc',
          },
        },
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }

    // Transform for UI
    const transformedUser = {
      address: user.address,
      tradingVolume: user.totalVolume,
      winRate: user.averageWinRate,
      avgReturn: user.totalProfit / (user.totalTrades || 1),
      trades: user.totalTrades,
      largestLoss: user.monthlyPerformance.reduce((min, perf) => 
        Math.min(min, perf.profit), 0
      ),
      highestProfit: user.monthlyPerformance.reduce((max, perf) => 
        Math.max(max, perf.profit), 0
      ),
      buyPercentage: user.buySellData?.buyPercentage || 0,
      sellPercentage: user.buySellData?.sellPercentage || 0,
      walletAge: Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      positionValue: user.positionValue,
      mostTradedCategory: user.mostTradedCategory,
      tradingStyle: user.tradingStyle,
      riskProfile: user.riskProfile,
      avgMonthlyProfit: user.avgMonthlyProfit,
      avgMonthlyTrades: user.avgMonthlyTrades,
      marketDistribution: user.marketDistribution,
      tradeSizeData: user.tradeSizeData,
      priceStats: user.priceStats,
      monthlyPerformance: user.monthlyPerformance,
      weeklyWinRate: user.weeklyWinRate,
    };

    const response = NextResponse.json(transformedUser);
    return addCorsHeaders(response);
  } catch (error) {
    console.error('Error fetching user details:', error);
    const response = NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}