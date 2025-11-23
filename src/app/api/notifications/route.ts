// app/api/notifications/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

// GET - Fetch notifications for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    const notifications = await prisma.notification.findMany({
      where: {
        userEmail: session.user.email,
        ...(unreadOnly && { read: false })
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    });

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST - Mark notification(s) as read
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userEmail: session.user.email,
          read: false
        },
        data: {
          read: true
        }
      });

      return NextResponse.json(
        { message: 'All notifications marked as read' },
        { status: 200 }
      );
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userEmail: session.user.email
        },
        data: {
          read: true
        }
      });

      return NextResponse.json(
        { message: 'Notifications marked as read' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}