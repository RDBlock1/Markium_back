// app/api/telegram/check-registration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

const API_SECRET = process.env.API_SECRET || 'your-secret-key';

function verifyApiSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-api-secret');
  return secret === API_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyApiSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    // Check if this chat ID is registered
    const integration = await prisma.telegramIntegration.findFirst({
      where: {
        chatId: chatId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!integration) {
      return NextResponse.json({
        registered: false,
        alertCount: 0
      });
    }

    // Count alerts with Telegram enabled for this user
    const alertCount = await prisma.alert.count({
      where: {
        userId: integration.createdById,
        telegramNotify: true
      }
    });

    return NextResponse.json({
      registered: true,
      alertCount,
      user: {
        id: integration.createdBy.id,
        email: integration.createdBy.email
      }
    });
  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json(
      { error: 'Failed to check registration' },
      { status: 500 }
    );
  }
}