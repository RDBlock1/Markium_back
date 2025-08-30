import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma';


// POST - Create multiple watchlists at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, watchLists } = body;

    if (!walletAddress || !watchLists || !Array.isArray(watchLists)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Find or create user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {},
      create: { walletAddress }
    });

    // Create multiple watchlists
    const createdWatchLists = await prisma.watchList.createMany({
      data: watchLists.map(wl => ({
        userId: user.id,
        marketId: wl.marketId,
        triggerType: wl.triggerType,
        triggerValue: wl.triggerValue || null,
        frequency: wl.frequency || 'IMMEDIATE',
        isEmailNotification: wl.isEmailNotification || false,
        isTelegramNotification: wl.isTelegramNotification || false,
        isActive: true
      }))
    });

    return NextResponse.json({ 
      count: createdWatchLists.count,
      message: `Created ${createdWatchLists.count} watchlists` 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating batch watchlists:', error);
    return NextResponse.json(
      { error: 'Failed to create watchlists' },
      { status: 500 }
    );
  }
}
