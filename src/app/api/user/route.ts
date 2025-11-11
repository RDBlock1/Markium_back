// pages/api/market/users.ts
// Complete API endpoint with database integration using Prisma

import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { prisma } from '@/db/prisma';
import { ClobClient } from '@polymarket/clob-client';
import { auth } from '@/lib/auth';


// Type definitions
interface User {
  id: string;
  walletAddress: string;
  clobApiKey?: string;
  clobSecret?: string;
  clobPassphrase?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserResponse {
  user: Omit<User, 'clobApiKey' | 'clobSecret' | 'clobPassphrase'>;
  message: string;
  isNewUser: boolean;
}

interface ErrorResponse {
  error: string;
}

// Helper function to validate Ethereum address
function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
}

// Helper function to generate CLOB credentials using Polymarket
async function generateClobCredentials(walletAddress: string) {
  try {
    const host = process.env.POLYMARKET_CLOB_HOST || 'https://clob.polymarket.com';
    const chainId = parseInt(process.env.CHAIN_ID || '137'); // Polygon mainnet

    const privateKey = process.env.CLOB_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('CLOB_PRIVATE_KEY not configured');
    }

    const wallet = new ethers.Wallet(privateKey);
    
    const clobClient = new ClobClient(
      host,
      chainId,
      wallet
    );

    // Create or derive API credentials
    const apiCreds = await clobClient.createApiKey();

    return {
      apiKey: apiCreds.key,
      secret: apiCreds.secret,
      passphrase: apiCreds.passphrase,
    };
  } catch (error) {
    console.error('Error generating CLOB credentials:', error);
    
    // Fallback to mock credentials for development
    if (process.env.NODE_ENV === 'development') {
      return {
        apiKey: `dev_clob_${walletAddress.slice(2, 10)}_${Date.now()}`,
        secret: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
        passphrase: ethers.utils.hexlify(ethers.utils.randomBytes(16)),
      };
    }
    throw error;
  }
}

// Helper function to get or create user
async function getOrCreateUser(walletAddress: string): Promise<{ user: User; isNewUser: boolean }> {
  const normalizedAddress = walletAddress.toLowerCase();
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error('Unauthorized');
  }
  
  try {
    // Check if user exists by wallet address
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress, email: session.user.email },
    });
    
    if (user) {
      return {
        user: {
          id: user.id,
          walletAddress: user.walletAddress!,
          clobApiKey: user.clobApiKey || undefined,
          clobSecret: user.clobSecret || undefined,
          clobPassphrase: user.clobPassphrase || undefined,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        isNewUser: false,
      };
    }
    
    // Generate CLOB credentials
    const credentials = await generateClobCredentials(normalizedAddress);
    
    // Create new user with wallet address
    const newUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        walletAddress: normalizedAddress,
        clobApiKey: credentials.apiKey,
        clobSecret: credentials.secret,
        clobPassphrase: credentials.passphrase,
      },
    });
    
    return {
      user: {
        id: newUser.id,
        walletAddress: newUser.walletAddress!,
        clobApiKey: newUser.clobApiKey || undefined,
        clobSecret: newUser.clobSecret || undefined,
        clobPassphrase: newUser.clobPassphrase || undefined,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
      isNewUser: true,
    };
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to get or create user');
  }
}

// Helper function to get user by wallet address
async function getUserByAddress(walletAddress: string): Promise<User | null> {
  const normalizedAddress = walletAddress.toLowerCase();
  
  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress!,
      clobApiKey: user.clobApiKey || undefined,
      clobSecret: user.clobSecret || undefined,
      clobPassphrase: user.clobPassphrase || undefined,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

// POST - Create or get user
export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    // Validate input
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    if (typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Wallet address must be a string' }, { status: 400 });
    }

    // Validate Ethereum address format
    if (!isValidEthereumAddress(walletAddress)) {
      return NextResponse.json({ error: 'Invalid Ethereum address format' }, { status: 400 });
    }

    // Get or create user
    const { user, isNewUser } = await getOrCreateUser(walletAddress);

    // Return response (don't expose secrets in response for security)
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: isNewUser ? 'User created successfully' : 'User already exists',
      isNewUser,
    });
  } catch (error) {
    console.error('API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// GET - Get user by wallet address (from query params)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { error: 'Wallet address is required and must be a string' },
        { status: 400 }
      );
    }

    if (!isValidEthereumAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const user = await getUserByAddress(walletAddress);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return user without sensitive credentials
    return NextResponse.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('API error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}