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
  '/auth/forgot-password',
  '/pricing',
  '/features',
  '/about',
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
  const { supabaseResponse, user, hasCompany } = await updateSession(request)

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  // Allow public paths first
  if (isPublicPath) {
    // If user is logged in and trying to access login/signup, redirect appropriately
    if (user && (pathname === '/auth/login' || pathname === '/auth/sign-up')) {
      return NextResponse.redirect(new URL(hasCompany ? '/dashboard' : '/onboarding', request.url))
    }
    return supabaseResponse
  }

  // Protected routes - require authentication
  if (!user) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // User is authenticated - check if they have a company for app routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/journal') || 
      pathname.startsWith('/reports') || pathname.startsWith('/parties') ||
      pathname.startsWith('/documents') || pathname.startsWith('/chat') ||
      pathname.startsWith('/settings')) {
    if (!hasCompany) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Onboarding page - if user already has company, redirect to dashboard
  if (pathname === '/onboarding' || pathname.startsWith('/onboarding/')) {
    if (hasCompany) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
