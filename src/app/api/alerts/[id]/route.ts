// app/api/alerts/[id]/route.ts - Updated with monitoring unregistration

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

const TELEGRAM_BOT_API_URL = process.env.TELEGRAM_BOT_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.API_SECRET || 'your-secret-key';

// GET - Fetch a specific alert
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alert = await prisma.alert.findFirst({
      where: {
        id: id,
        userEmail: session.user.email
      }
    });

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(alert, { status: 200 });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert' },
      { status: 500 }
    );
  }
}

// PATCH - Update an alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if alert exists and belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: id,
        userEmail: session.user.email
      },
       select: {
    id: true,
    userId: true,
    userEmail: true,
    walletAddress: true,
    tradeType: true,
    minAmount: true,
    market: true,
    notifyVia: true,
    telegramNotify: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  }
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const body = await request.json();
    const { walletAddress, tradeType, minAmount, market, notifyVia, telegramNotify } = body;

    // If telegramNotify is being enabled, verify user has Telegram integration
    if (telegramNotify && !existingAlert.telegramNotify) {
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

    const updatedAlert = await prisma.alert.update({
      where: {
        id: id
      },
      data: {
        ...(walletAddress && { walletAddress }),
        ...(tradeType && { tradeType }),
        ...(minAmount !== undefined && { minAmount }),
        ...(market && { market }),
        ...(notifyVia && { notifyVia }),
        ...(telegramNotify !== undefined && { telegramNotify })
      }
    });

    return NextResponse.json(updatedAlert, { status: 200 });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if alert exists and belongs to user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: id,
        userEmail: session.user.email
      }
    });

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    // Unregister wallet from monitoring in bot backend
    try {
      const monitorResponse = await fetch(`${TELEGRAM_BOT_API_URL}/api/monitor/unregister/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-secret': API_SECRET
        }
      });

      if (monitorResponse.ok) {
        console.log('✅ Wallet unregistered from monitoring');
      } else {
        const error = await monitorResponse.text();
        console.error('⚠️  Failed to unregister wallet from monitoring:', error);
        // Continue with alert deletion anyway
      }
    } catch (error) {
      console.error('⚠️  Error unregistering wallet from monitoring:', error);
      // Continue with alert deletion anyway
    }

    // Delete the alert
    await prisma.alert.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json(
      { message: 'Alert deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    );
  }
}