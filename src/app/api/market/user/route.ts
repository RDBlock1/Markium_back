// app/api/polymarket/user/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Configure CORS headers
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
    
    console.log('address', address);

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch user profile data
    const profileResponse = await fetch(
      `https://polymarket.com/api/profile/userData?address=${address}`,
      { 
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      }
    )

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.status}`)
    }

    const profileData = await profileResponse.json()


    // Fetch user stats if we have proxyWallet and pseudonym
    let statsData = null
    if (profileData.proxyWallet && profileData.pseudonym) {
      try {
        const statsResponse = await fetch(
          `https://polymarket.com/api/profile/stats?proxyAddress=${encodeURIComponent(profileData.proxyWallet)}&username=${encodeURIComponent(profileData.pseudonym)}`,
          {
            headers: { 'Accept': 'application/json' },
            cache: 'no-store'
          }
        )

        if (statsResponse.ok) {
          statsData = await statsResponse.json()

        } else {

        }
      } catch (statsError) {
        console.error('Error fetching stats:', statsError)
        // Continue without stats if fetch fails
      }
    }

    // Merge profile data with stats
    const mergedData = {
      ...profileData,
      ...(statsData && {
        trades: statsData.trades,
        largestWin: statsData.largestWin,
        views: statsData.views,
        joinDate: statsData.joinDate
      })
    }

    return NextResponse.json(mergedData, { headers: corsHeaders })
    
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}