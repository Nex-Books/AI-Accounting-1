/**
 * Middleware for auth protection
 * NO @supabase/ssr dependency
 * Updated: v0.3.0
 */
import { type NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/sign-up', 
  '/auth/sign-up-success',
  '/auth/error',
  '/auth/callback',
  '/onboarding',
  '/',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files
  if (pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublic) {
    return NextResponse.next()
  }

  // Check for Supabase auth cookie on protected paths
  const hasAuthCookie = request.cookies.getAll().some(
    c => c.name.includes('sb-') && c.name.includes('-auth-token')
  )

  if (!hasAuthCookie) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
