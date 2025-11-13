import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma';
import { getWatchlistsWithMarketData } from '@/app/actions/watchlist';

// GET - Get all watchlists for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const includeMarketData = searchParams.get('includeMarketData') === 'true';
    console.log('GET request for watchlists with email:', email, 'Include market data:', includeMarketData);
    if (!email) {
      return NextResponse.json(
        { error: 'Email  is required' },
        { status: 400 }
      );
    }

    if (includeMarketData) {
      // Fetch watchlists with market data
      const watchlistsWithMarketData = await getWatchlistsWithMarketData(email);
      console.log('Watchlists with market data:', watchlistsWithMarketData);
      return NextResponse.json({ watchLists: watchlistsWithMarketData });
    } else {
      // Original functionality - just watchlists
      const user = await prisma.user.findUnique({
        where: { email },
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
      email,
      marketId,
      triggerType,
      triggerValue,
      frequency,
      isEmailNotification,
      isTelegramNotification
    } = body;
    console.log('POST body:', marketId);

    // Validate required fields
    console.log('Validating fields:', { email, marketId, triggerType });
    if (!email || !marketId || !triggerType) {
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
      where: { email },
      update: {},
      create: { email }
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