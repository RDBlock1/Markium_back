import { NextRequest, NextResponse } from "next/server";





export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;


    //now we fetch the market data using the slug
    const response = await fetch(`https://gamma-api.polymarket.com/markets?slug=${slug}`)
    const marketData = await response.json();

   console.log('Market Data:', marketData);
    if (!marketData) {
      return NextResponse.json({
        status: 404,
        error: 'Market not found'
      });
    }

    return NextResponse.json({
      status: 200,
      data: marketData
    });


  } catch (error) {
    return NextResponse.json({
      status: 500,
      error: 'Internal Server Error'
    }, {
      status: 500
    });
  }
}