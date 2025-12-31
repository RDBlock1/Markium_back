// app/api/polymarket/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch all metrics in parallel
    const [volumeResponse, profitResponse, positionValueResponse] = await Promise.all([
      // Volume data
      fetch(
        `https://lb-api.polymarket.com/volume?window=all&limit=1&address=${address}`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      ),
      // Profit data
      fetch(
        `https://lb-api.polymarket.com/profit?window=all&limit=1&address=${address}`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      ),
      // Position value data
      fetch(
        `https://data-api.polymarket.com/value?user=${address}`,
        { 
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        }
      )
    ])

    // Check if all requests were successful
    if (!volumeResponse.ok || !profitResponse.ok || !positionValueResponse.ok) {
      throw new Error('One or more metric fetches failed')
    }

    const volumeData = await volumeResponse.json()
    const profitData = await profitResponse.json()
    const positionValueData = await positionValueResponse.json()

    // Process and combine the data
    const metrics = {
      volume: volumeData[0]?.amount || 0,
      profit: profitData[0]?.amount || 0,
      positionValue: positionValueData[0]?.value || 0,
      // Calculate positions count from the data if needed
      marketsTraded: 0 // This would need to be calculated from positions data
    }

    return NextResponse.json(metrics, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics data' },
      { status: 500, headers: corsHeaders }
    )
  }
}