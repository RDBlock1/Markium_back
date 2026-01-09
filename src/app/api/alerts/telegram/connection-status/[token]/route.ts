// app/api/telegram/connection-status/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if integration has been created for this user
    const integration = await prisma.telegramIntegration.findFirst({
      where: {
        createdBy: {
          email: session.user.email
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If integration exists and was created recently (within last 2 minutes), consider it completed
    if (integration) {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      if (integration.createdAt > twoMinutesAgo) {
        return NextResponse.json({
          status: 'completed',
          integration: {
            userName: integration.userName,
            chatId: integration.chatId,
            createdAt: integration.createdAt
          }
        });
      }
    }

    return NextResponse.json({
      status: 'pending',
      message: 'Waiting for Telegram connection'
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}