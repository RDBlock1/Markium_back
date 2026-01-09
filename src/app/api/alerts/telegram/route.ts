// app/api/alerts/telegram/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

// GET - Check if user has Telegram integration
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const telegramIntegration = await prisma.telegramIntegration.findFirst({
      where: {
        createdBy: {
          email: session.user.email
        }
      }
    });

    return NextResponse.json(
      { 
        hasIntegration: !!telegramIntegration,
        integration: telegramIntegration ? {
          userName: telegramIntegration.userName,
          chatId: telegramIntegration.chatId,
          createdAt: telegramIntegration.createdAt
        } : null
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking Telegram integration:', error);
    return NextResponse.json(
      { error: 'Failed to check Telegram integration' },
      { status: 500 }
    );
  }
}

// POST - Create or update Telegram integration
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userName, chatId } = body;

    // Validation
    if (!userName || !chatId) {
      return NextResponse.json(
        { error: 'Username and Chat ID are required' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric and underscores, 5-32 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{5,32}$/;
    if (!usernameRegex.test(userName)) {
      return NextResponse.json(
        { error: 'Invalid username format. Use only letters, numbers, and underscores (5-32 characters)' },
        { status: 400 }
      );
    }

    // Validate chatId is numeric
    if (!/^\d+$/.test(chatId)) {
      return NextResponse.json(
        { error: 'Chat ID must be numeric' },
        { status: 400 }
      );
    }

    // Check if user already has Telegram integration
    const existingIntegration = await prisma.telegramIntegration.findFirst({
      where: {
        createdBy: {
          email: session.user.email
        }
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
          userName,
          chatId,
          userId: session.user.id,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new integration
      integration = await prisma.telegramIntegration.create({
        data: {
          userName,
          chatId,
          userId: session.user.id,
          createdById: session.user.id
        }
      });
    }

    return NextResponse.json(
      {
        message: existingIntegration ? 'Telegram integration updated successfully' : 'Telegram integration created successfully',
        integration: {
          userName: integration.userName,
          chatId: integration.chatId,
          createdAt: integration.createdAt
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving Telegram integration:', error);
    return NextResponse.json(
      { error: 'Failed to save Telegram integration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove Telegram integration
export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the integration
    const integration = await prisma.telegramIntegration.findFirst({
      where: {
        createdBy: {
          email: session.user.email
        }
      }
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'No Telegram integration found' },
        { status: 404 }
      );
    }

    // Also update all alerts to disable Telegram notifications
    await prisma.alert.updateMany({
      where: {
        userEmail: session.user.email,
        telegramNotify: true
      },
      data: {
        telegramNotify: false
      }
    });

    // Delete the integration
    await prisma.telegramIntegration.delete({
      where: {
        id: integration.id
      }
    });

    return NextResponse.json(
      { message: 'Telegram integration removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting Telegram integration:', error);
    return NextResponse.json(
      { error: 'Failed to remove Telegram integration' },
      { status: 500 }
    );
  }
}