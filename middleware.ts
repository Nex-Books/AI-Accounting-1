/**
 * Middleware for auth protection
 * Fixed redirect loop
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
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Allow public paths
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPublic) {
    return NextResponse.next()
  }

  // Check auth cookie (less strict)
  const cookies = request.cookies.getAll()

  const hasAuthCookie = cookies.some((c) =>
    c.name.includes('auth-token')
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
