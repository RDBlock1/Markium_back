// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {prisma} from '@/db/prisma';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Valid wallet address is required' },
        { status: 400 }
      );
    }

    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress
      }
    });

    // If user doesn't exist, create new user
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: normalizedAddress
        }
      });
      
      return NextResponse.json(
        { 
          user, 
          message: 'User created successfully',
          isNewUser: true
        },
        { status: 201 }
      );
    }

    // User already exists, return existing user
    return NextResponse.json(
      { 
        user, 
        message: 'User already exists',
        isNewUser: false
      },
      { status: 200 }
    );

  } catch (error:any) {
    console.error('Error in user creation/retrieval:', error);
    
    // Handle unique constraint violation (in case of race condition)
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this wallet address already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: GET method to retrieve user by wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address parameter is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = walletAddress.toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress
      },
      include: {
        watchLists: true // Include watch lists if needed
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error('Error retrieving user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}