/**
 * Middleware for auth protection
 * Stable version
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

  // Skip static / api / files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow public routes
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPublic) {
    return NextResponse.next()
  }

  // Check auth cookie (safer check)
  const cookies = request.cookies.getAll()

  const hasAuthCookie = cookies.some(
    (c) =>
      c.name.includes('sb') ||
      c.name.includes('supabase') ||
      c.name.includes('auth')
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