import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

// Public paths that don't require authentication
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

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('.') 
  ) {
    return NextResponse.next()
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  )

  if (isPublicPath) {
    // Still refresh session cookies on public paths
    return await updateSession(request)
  }

  // For protected paths, refresh session and check auth
  const response = await updateSession(request)

  // Check for Supabase auth cookie
  const hasAuth = request.cookies.getAll().some(
    (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
  )

  if (!hasAuth) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
