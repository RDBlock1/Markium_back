/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token_ids } = body;

    if (!token_ids || !Array.isArray(token_ids)) {
      return NextResponse.json(
        { error: 'token_ids array is required' },
        { status: 400 }
      );
    }

    // Format token_ids array to match Polymarket's expected format
    const formattedTokenIds = token_ids.map(id => ({ token_id: id }));

    const response = await fetch('https://clob.polymarket.com/books?token_ids', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'Referer': 'https://polymarket.com/',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
      },
      body: JSON.stringify(formattedTokenIds),
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Fetched order book data:', data);

    //log the bids 
    console.log('Asks:', data.map((book: any) => book.asks));
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching order book:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order book data' },
      { status: 500 }
    );
  }
}