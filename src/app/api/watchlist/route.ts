import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma';
import { getWatchlistsWithMarketData } from '@/app/actions/watchlist';

// GET - Get all watchlists for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const includeMarketData = searchParams.get('includeMarketData') === 'true';

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (includeMarketData) {
      // Fetch watchlists with market data
      const watchlistsWithMarketData = await getWatchlistsWithMarketData(walletAddress);
      return NextResponse.json({ watchLists: watchlistsWithMarketData });
    } else {
      // Original functionality - just watchlists
      const user = await prisma.user.findUnique({
        where: { walletAddress },
        include: {
          watchLists: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        return NextResponse.json({ watchLists: [] });
      }

      return NextResponse.json({ watchLists: user.watchLists });
    }

  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlists' },
      { status: 500 }
    );
  }
}

// POST - Create new watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      marketId,
      triggerType,
      triggerValue,
      frequency,
      isEmailNotification,
      isTelegramNotification
    } = body;

    // Validate required fields
    if (!walletAddress || !marketId || !triggerType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    

    //check if that marketId already exists in the user's watchlist
    const existingWatchlistItem = await prisma.watchList.findFirst({
      where: {
        marketId
      }
    });

    console.log('Existing watchlist item:', existingWatchlistItem);

    if (existingWatchlistItem) {
      return NextResponse.json(
        { error: 'Market is already in watchlist' },
        { status: 400 }
      );
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress }
    });

    // Create watchlist
    const watchList = await prisma.watchList.create({
      data: {
        userId: user.id,
        marketId,
        triggerType,
        triggerValue: triggerValue || null,
        frequency: frequency || 'IMMEDIATE',
        isEmailNotification: isEmailNotification || false,
        isTelegramNotification: isTelegramNotification || false,
        isActive: true
      }
    });

    return NextResponse.json({ watchList }, { status: 201 });
  } catch (error) {
    console.error('Error creating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to create watchlist' },
      { status: 500 }
    );
  }
}