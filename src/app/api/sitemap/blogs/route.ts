import { prisma } from '@/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Only fetch necessary fields for sitemap
    const blogs = await prisma.blogPost.findMany({
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json(
      { blogs },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
    return NextResponse.json(
      { blogs: [] },
      { status: 500 }
    );
  }
}