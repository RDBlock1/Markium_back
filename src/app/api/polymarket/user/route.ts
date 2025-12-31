// app/api/polymarket/user/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface PolymarketUserData {
  createdAt: string;
  proxyWallet: string;
  profileImage: string;
  displayUsernamePublic: boolean;
  bio?: string;
  pseudonym: string;
  name: string;
  users: Array<{
    id: string;
    creator: boolean;
    mod: boolean;
  }>;
}

// Function to extract address from username by scraping profile page
async function resolveUsername(username: string): Promise<string | null> {
  try {
    const profileUrl = `https://polymarket.com/@${username}`;
    console.log('Fetching profile page:', profileUrl);
    
    const response = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error('Profile page fetch failed:', response.status);
      return null;
    }

    const html = await response.text();
    
    // Extract primaryAddress from Next.js props
    // Look for: "primaryAddress":"0x..."
    const primaryAddressMatch = html.match(/"primaryAddress":"(0x[a-fA-F0-9]{40})"/);
    if (primaryAddressMatch) {
      console.log('Found primaryAddress:', primaryAddressMatch[1]);
      return primaryAddressMatch[1].toLowerCase();
    }

    // Fallback: Look for proxyAddress
    const proxyAddressMatch = html.match(/"proxyAddress":"(0x[a-fA-F0-9]{40})"/);
    if (proxyAddressMatch) {
      console.log('Found proxyAddress:', proxyAddressMatch[1]);
      return proxyAddressMatch[1].toLowerCase();
    }

    // Last fallback: any ethereum address in the page
    const anyAddressMatch = html.match(/0x[a-fA-F0-9]{40}/);
    if (anyAddressMatch) {
      console.log('Found address (fallback):', anyAddressMatch[0]);
      return anyAddressMatch[0].toLowerCase();
    }
    
    console.error('No address found in HTML');
    return null;
  } catch (error) {
    console.error('Error resolving username:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const address = searchParams.get('address');

    console.log('Request params:', { username, address });

    // Validate input
    if (!username && !address) {
      return NextResponse.json(
        { error: 'Either username or address parameter is required' },
        { status: 400 }
      );
    }

    let walletAddress = address;

    // If username is provided, resolve it to an address
    if (username && !address) {
      console.log('Resolving username to address...');
      walletAddress = await resolveUsername(username);
      
      if (!walletAddress) {
        return NextResponse.json(
          { 
            error: 'Could not resolve username to wallet address',
            details: 'Username not found or profile page could not be accessed'
          },
          { status: 404 }
        );
      }
      console.log('Resolved address:', walletAddress);
    }

    // Validate address format
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/i.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Fetch user data from Polymarket API
    const apiUrl = `https://polymarket.com/api/profile/userData?address=${walletAddress.toLowerCase()}`;
    console.log('Fetching user data from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      // Add cache control for Next.js
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error:', errorText);
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch user data from Polymarket',
          details: errorText 
        },
        { status: response.status }
      );
    }

    const userData: PolymarketUserData = await response.json();
    console.log('User data retrieved successfully for:', userData.name);

    // Return the user data with CORS headers
    return NextResponse.json(userData, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error fetching Polymarket user data:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Optional: POST endpoint for batch requests
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usernames, addresses } = body;

    if ((!usernames || !Array.isArray(usernames)) && 
        (!addresses || !Array.isArray(addresses))) {
      return NextResponse.json(
        { error: 'Either usernames or addresses array is required' },
        { status: 400 }
      );
    }

    const results = [];
    const items = usernames || addresses;
    const isUsername = !!usernames;

    // Limit to 10 requests to prevent abuse
    for (const item of items.slice(0, 10)) {
      try {
        let walletAddress = item;
        
        if (isUsername) {
          walletAddress = await resolveUsername(item);
          if (!walletAddress) {
            results.push({ 
              success: false, 
              error: 'Username not found', 
              item 
            });
            continue;
          }
        }

        const apiUrl = `https://polymarket.com/api/profile/userData?address=${walletAddress.toLowerCase()}`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          results.push({ 
            success: true, 
            data: userData, 
            searchedFor: item 
          });
        } else {
          results.push({ 
            success: false, 
            error: 'User not found', 
            item 
          });
        }
      } catch (error) {
        results.push({ 
          success: false, 
          error: 'Fetch failed', 
          item,
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ results }, { status: 200 });

  } catch (error) {
    console.error('Error in batch request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}