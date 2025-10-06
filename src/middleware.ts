import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware triggered for:', request.url);
  
  let ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
           request.headers.get('x-real-ip');
  
  console.log('Extracted IP:', ip);
  
  // For local testing: use a test IP or allow a test parameter
  const isLocalhost = !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.');
  
  if (isLocalhost) {
    return NextResponse.next();
  }
  
  console.log('Client IP:', ip);
  
  try {
    // Use ip-api.com (free, no auth required, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    console.log('Geo-IP data:', data);
    
    if (data.countryCode === 'US' && request.nextUrl.pathname.startsWith('/market/')) {
      console.log('Blocking US user from market route');
      return NextResponse.redirect(new URL('/blocked', request.url));
    }
  } catch (error) {
    console.error('Geo-IP lookup failed:', error);
    // Fail open - allow access if geo-IP check fails
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/market/:path*',
};