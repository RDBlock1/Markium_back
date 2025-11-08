import { NextRequest, NextResponse } from 'next/server';
import { HolderData, TokenHolders } from '@/types/holder';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const marketId = searchParams.get('marketId');

    if (!marketId) {
      return NextResponse.json(
        { error: 'marketId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://data-api.polymarket.com/holders?market=${marketId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // or 'force-cache' depending on your needs
      }
    );

    if (!response.ok) {
      console.error('Error fetching top holders:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch holders' },
        { status: response.status }
      );
    }

    const rawData: { token: string; holders: HolderData[] }[] = await response.json();

    console.log('Fetched top holders:', rawData);

    if (rawData.length < 2) {
      return NextResponse.json({ data: [] });
    }

    // Map API output into TokenHolders format
    const mappedData: TokenHolders = {
      tokenYes: rawData[0].token,
      holdersYes: rawData[0].holders,
      tokenNo: rawData[1].token,
      holdersNo: rawData[1].holders,
    };

    return NextResponse.json({ data: [mappedData] });
  } catch (error) {
    console.error('Error fetching top holders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}