import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest, NextResponse } from 'next/server'

// Extract company slug from subdomain
function getCompanySlug(request: NextRequest): string | null {
  const host = request.headers.get('host') || ''
  
  // For local development, use query param or cookie
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('.vercel.app')) {
    // Check for slug in query param first (for demo mode)
    const slugParam = request.nextUrl.searchParams.get('company')
    if (slugParam) return slugParam
    
    // Check cookie
    const slugCookie = request.cookies.get('company_slug')?.value
    if (slugCookie) return slugCookie
    
    return null
  }
  
  // For production: extract from subdomain
  // Expected format: {company-slug}.elevaitebooks.com
  const parts = host.split('.')
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Exclude common subdomains
    if (!['www', 'app', 'api', 'admin'].includes(subdomain)) {
      return subdomain
    }
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  // First, handle session refresh
  const response = await updateSession(request)
  
  const { pathname } = request.nextUrl
  
  // Public paths that don't require auth or company context
  const publicPaths = [
    '/auth/login',
    '/auth/sign-up',
    '/auth/sign-up-success',
    '/auth/error',
    '/auth/callback',
    '/onboarding',
    '/',
    '/api/webhooks',
  ]
  
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // API routes that need company context from header
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks') && !pathname.startsWith('/api/auth')) {
    const companySlug = getCompanySlug(request)
    if (companySlug) {
      // Clone request and add company slug header
      response.headers.set('x-company-slug', companySlug)
    }
  }
  
  // Extract company slug for app routes
  const companySlug = getCompanySlug(request)
  
  // If we have a company slug, set it in a header for server components
  if (companySlug) {
    response.headers.set('x-company-slug', companySlug)
  }
  
  // For protected paths, check if user is authenticated
  if (!isPublicPath) {
    // The session check is handled by updateSession
    // If user is not authenticated, they'll be redirected by the page
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
