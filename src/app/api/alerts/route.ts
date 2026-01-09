// app/api/alerts/route.ts - Updated with monitoring registration

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

const TELEGRAM_BOT_API_URL = process.env.TELEGRAM_BOT_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.API_SECRET || 'your-secret-key';

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
    const { walletAddress, tradeType, minAmount, market, notifyVia, telegramNotify } = body;

    console.log('Creating alert:', {
      walletAddress,
      tradeType,
      minAmount,
      market,
      notifyVia,
      telegramNotify
    });

    // Validation
    if (!walletAddress || !tradeType || !market || !notifyVia) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate wallet address format (Ethereum address)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
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

    // If telegramNotify is true, verify user has Telegram integration
    if (telegramNotify) {
      const telegramIntegration = await prisma.telegramIntegration.findFirst({
        where: {
          createdBy: {
            email: session.user.email
          }
        }
      });

      if (!telegramIntegration) {
        return NextResponse.json(
          { error: 'Telegram integration not found. Please connect your Telegram account first.' },
          { status: 400 }
        );
      }
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id || session.user.email,
        userEmail: session.user.email,
        walletAddress,
        tradeType,
        minAmount,
        market,
        notifyVia,
        telegramNotify: telegramNotify || false,
        isActive: true
      }
    });

    console.log('✅ Alert created:', alert.id);

    // Register wallet for monitoring in bot backend
    try {
      const monitorResponse = await fetch(`${TELEGRAM_BOT_API_URL}/api/monitor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-secret': API_SECRET
        },
        body: JSON.stringify({
          alertId: alert.id,
          proxyWallet: walletAddress
        })
      });

      if (monitorResponse.ok) {
        const monitorResult = await monitorResponse.json();
        console.log('✅ Wallet registered for monitoring:', monitorResult);
      } else {
        const error = await monitorResponse.text();
        console.error('⚠️  Failed to register wallet for monitoring:', error);
        // Don't fail the whole request, alert is still created
      }
    } catch (error) {
      console.error('⚠️  Error registering wallet for monitoring:', error);
      // Don't fail the whole request, alert is still created
    }

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}