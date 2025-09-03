import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma';


type Params = {
  params: Promise<{ id: string }>;
};

// PUT - Update existing watchlist
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      email,
      triggerType,
      triggerValue,
      frequency,
      isEmailNotification,
      isTelegramNotification,
      isActive
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Verify the watchlist belongs to the user
    const watchList = await prisma.watchList.findFirst({
      where: {
        id,
        user: { email }
      }
    });

    if (!watchList) {
      return NextResponse.json(
        { error: 'Watchlist not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update watchlist
    const updatedWatchList = await prisma.watchList.update({
      where: { id },
      data: {
        ...(triggerType !== undefined && { triggerType }),
        ...(triggerValue !== undefined && { triggerValue }),
        ...(frequency !== undefined && { frequency }),
        ...(isEmailNotification !== undefined && { isEmailNotification }),
        ...(isTelegramNotification !== undefined && { isTelegramNotification }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json({ watchList: updatedWatchList });
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}

// DELETE - Delete watchlist
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    const email = searchParams.get('email');
    let dbId;
    let marketId
    if(id.startsWith("cm")) {
      dbId = id;
    }
    else {
      marketId = id;
    }

    console.log('Deleting watchlist for email:', email);
    console.log('marketId:', marketId);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Deleting watchlist for email:', email);
    console.log('marketId:', id);
    // Verify the watchlist belongs to the user
    let watchList

    if (marketId) {
      console.log('Deleting watchlist for email:', email);
      console.log('marketId:', marketId);
      watchList = await prisma.watchList.findFirst({
        where: {
          marketId,
          user: { email }
        }
      });
      console.log('Found watchlist by marketId:', watchList);
    }
    else if (dbId) {
      watchList = await prisma.watchList.findFirst({
        where: {
          id: dbId,
          user: { email }
        }
      });
    }

    if (!watchList) {
      console.log('Watchlist not found or unauthorized',watchList);
      return NextResponse.json(
        { error: 'Watchlist not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete watchlist
    await prisma.watchList.delete({
      where: { 
        id: watchList.id
      }
    });

    return NextResponse.json({ message: 'Watchlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to delete watchlist' },
      { status: 500 }
    );
  }
}
