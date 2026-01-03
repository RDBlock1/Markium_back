// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth'; // adjust path to your auth setup
import { prisma } from '@/db/prisma'; // adjust path to your prisma client

// GET - Fetch all alerts for the authenticated user
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        userEmail: session.user.email
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(alerts, { status: 200 });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// POST - Create a new alert
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { walletAddress, tradeType, minAmount, market, notifyVia } = body;

    // Validation
    if (!walletAddress || !tradeType || !market || !notifyVia) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate alerts
    const existingAlert = await prisma.alert.findFirst({
      where: {
        userEmail: session.user.email,
        walletAddress,
        tradeType,
        market
      }
    });

    if (existingAlert) {
      return NextResponse.json(
        { error: 'Alert with similar configuration already exists' },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id || session.user.email,
        userEmail: session.user.email,
        walletAddress,
        tradeType,
        minAmount,
        market,
        notifyVia
      }
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}