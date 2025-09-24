
import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Only fetch necessary fields for sitemap
    const markets = await prisma.market.findMany({
      where: {
        slug: { not: null }, // Only get markets with slugs
        active: true,        // Only active markets
        archived: false      // Exclude archived markets
      },
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(
      { markets },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching markets for sitemap:', error);
    return NextResponse.json(
      { markets: [] },
      { status: 500 }
    );
  }
}
