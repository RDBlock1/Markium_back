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

    return NextResponse.json(profileData, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500, headers: corsHeaders }
    )
  }
}