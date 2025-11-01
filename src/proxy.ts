export { auth as proxy } from '@/lib/auth';

// proxy.ts in app root
export const config = {
  matcher: ['/((?!api/auth).*)'],
}
// Only apply Edge logic to routes that are NOT your NextAuth handler
