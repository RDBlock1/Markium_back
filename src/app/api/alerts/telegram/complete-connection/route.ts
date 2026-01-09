// app/api/telegram/complete-connection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/prisma';

const API_SECRET = process.env.API_SECRET || 'your-secret-key';

// Verify API secret middleware
function verifyApiSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-api-secret');
  return secret === API_SECRET;
}

export async function POST(request: NextRequest) {
  try {
    // Verify this request is from our bot
    if (!verifyApiSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token, userId, userEmail, chatId, username, firstName, lastName } = body;

    if (!userId || !userEmail || !chatId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already has integration
    const existingIntegration = await prisma.telegramIntegration.findFirst({
      where: {
        createdById: userId
      }
    });

    let integration;

    if (existingIntegration) {
      // Update existing integration
      integration = await prisma.telegramIntegration.update({
        where: {
          id: existingIntegration.id
        },
        data: {
          userName: username,
          chatId,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new integration
      integration = await prisma.telegramIntegration.create({
        data: {
          userName: username,
          chatId,
          userId: userId,
          createdById: userId
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Telegram integration completed',
        integration: {
          userName: integration.userName,
          chatId: integration.chatId,
          createdAt: integration.createdAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error completing Telegram connection:', error);
    return NextResponse.json(
      { error: 'Failed to complete Telegram connection' },
      { status: 500 }
    );
  }
}