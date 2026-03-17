import { type NextRequest, NextResponse } from 'next/server'

// Extract company slug from subdomain
function getCompanySlug(request: NextRequest): string | null {
  const host = request.headers.get('host') || ''
  
  // For local development, use query param or cookie
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.vercel.app')) {
    const slugParam = request.nextUrl.searchParams.get('company')
    if (slugParam) return slugParam
    
    const slugCookie = request.cookies.get('company_slug')?.value
    if (slugCookie) return slugCookie
    
    return null
  }
  
  // For production: extract from subdomain
  const parts = host.split('.')
  if (parts.length >= 3) {
    const subdomain = parts[0]
    if (!['www', 'app', 'api', 'admin'].includes(subdomain)) {
      return subdomain
    }
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()
  
  // Public paths that don't require auth
  const publicPaths = [
    '/auth/login',
    '/auth/sign-up',
    '/auth/sign-up-success',
    '/auth/error',
    '/auth/callback',
    '/onboarding',
    '/',
  ]
  
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // API routes are handled separately
  if (pathname.startsWith('/api/')) {
    const companySlug = getCompanySlug(request)
    if (companySlug) {
      response.headers.set('x-company-slug', companySlug)
    }
    return response
  }
  
  // Extract company slug and set header
  const companySlug = getCompanySlug(request)
  if (companySlug) {
    response.headers.set('x-company-slug', companySlug)
  }
  
  // For protected paths, check for auth cookie
  if (!isPublicPath) {
    // Check for Supabase auth cookies
    const hasAuthCookie = request.cookies.getAll().some(cookie => 
      cookie.name.includes('auth-token') || 
      cookie.name.includes('sb-') ||
      cookie.name === 'sb-access-token'
    )
    
    if (!hasAuthCookie) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
