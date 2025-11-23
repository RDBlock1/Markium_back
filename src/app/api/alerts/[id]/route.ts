// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/db/prisma';

// GET - Fetch a specific alert
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // 👈 Await params

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
    const { id } = await params; // 👈 Await params

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

    const body = await request.json();
    const { walletAddress, tradeType, minAmount, market, notifyVia } = body;

    const updatedAlert = await prisma.alert.update({
      where: {
        id: id
      },
      data: {
        ...(walletAddress && { walletAddress }),
        ...(tradeType && { tradeType }),
        ...(minAmount !== undefined && { minAmount }),
        ...(market && { market }),
        ...(notifyVia && { notifyVia })
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
    const { id } = await params; // 👈 Await params

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