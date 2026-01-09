// app/api/telegram/init-connection/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const TELEGRAM_BOT_API = process.env.TELEGRAM_BOT_API_URL || 'http://localhost:3001';
const API_SECRET = process.env.API_SECRET || 'your-secret-key';

export async function POST() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call Telegram bot API to initialize connection
    const response = await fetch(`${TELEGRAM_BOT_API}/api/telegram/init-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET
      },
      body: JSON.stringify({
        userId: session.user.id,
        userEmail: session.user.email
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initialize Telegram connection');
    }

    const data = await response.json();

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error initializing Telegram connection:', error);
    return NextResponse.json(
      { error: 'Failed to initialize Telegram connection' },
      { status: 500 }
    );
  }
}