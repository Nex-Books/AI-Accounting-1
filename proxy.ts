// Next.js 16 proxy for auth session management
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/sign-up',
  '/auth/sign-up-success',
  '/auth/error',
  '/auth/callback',
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, api routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Update the session and get user
  const { supabaseResponse, user } = await updateSession(request)

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // If user is logged in and trying to access login/signup, redirect to dashboard or onboarding
  if (user && (pathname === '/auth/login' || pathname === '/auth/sign-up')) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Allow public paths
  if (isPublicPath) {
    return supabaseResponse
  }

  // Allow onboarding for authenticated users
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return supabaseResponse
  }

  // Protected routes - require authentication
  if (!user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
