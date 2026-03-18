import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import type { Company, User, PlanTier } from './types'
import { PLAN_LIMITS } from './types'

/**
 * Get company slug from various sources (headers, cookies, query)
 */
export async function getCompanySlug(): Promise<string | null> {
  const headersList = await headers()
  const cookieStore = await cookies()
  
  // Check header first (set by middleware)
  const headerSlug = headersList.get('x-company-slug')
  if (headerSlug) return headerSlug
  
  // Check cookie
  const cookieSlug = cookieStore.get('company_slug')?.value
  if (cookieSlug) return cookieSlug
  
  return null
}

/**
 * Get the current company and user context
 */
export async function getCompanyContext(): Promise<{
  company: Company & { ai_queries_used: number; ai_queries_limit: number }
  user: User
  isOwner: boolean
  isAccountant: boolean
  canEdit: boolean
} | null> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  
  // Get company slug
  const slug = await getCompanySlug()
  
  // Get user record with company
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*, company:companies(*)')
    .eq('id', authUser.id)
    .single()
  
  if (userError || !user) {
    // User might not have a company yet (onboarding)
    return null
  }
  
  // If we have a slug, verify user has access to that company
  if (slug && user.company?.slug !== slug) {
    // Check if user has access to requested company
    const { data: requestedUser } = await supabase
      .from('users')
      .select('*, company:companies(*)')
      .eq('id', authUser.id)
      .eq('company.slug', slug)
      .single()
    
    if (requestedUser?.company) {
      const company = requestedUser.company as Company
      const planLimits = PLAN_LIMITS[company.plan as PlanTier] || PLAN_LIMITS.essentials
      const isOwner = requestedUser.role === 'owner'
      const isAccountant = requestedUser.role === 'accountant' || isOwner
      return {
        company: {
          ...company,
          ai_queries_used: company.ai_queries_used_month || 0,
          ai_queries_limit: planLimits.queries,
        },
        user: requestedUser as User,
        isOwner,
        isAccountant,
        canEdit: isAccountant,
      }
    }
  }
  
  // Return default company
  if (user.company) {
    const company = user.company as Company
    const planLimits = PLAN_LIMITS[company.plan as PlanTier] || PLAN_LIMITS.essentials
    const isOwner = user.role === 'owner'
    const isAccountant = user.role === 'accountant' || isOwner
    
    return {
      company: {
        ...company,
        ai_queries_used: company.ai_queries_used_month || 0,
        ai_queries_limit: planLimits.queries,
      },
      user: user as User,
      isOwner,
      isAccountant,
      canEdit: isAccountant,
    }
  }
  
  return null
}

/**
 * Require authentication and company context
 */
export async function requireAuth(): Promise<{
  company: Company
  user: User
}> {
  const context = await getCompanyContext()
  
  if (!context) {
    throw new Error('Unauthorized')
  }
  
  return context
}

/**
 * Set company slug in cookie (for client-side company switching)
 */
export async function setCompanySlug(slug: string) {
  const cookieStore = await cookies()
  cookieStore.set('company_slug', slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

/**
 * Generate a unique slug from company name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

/**
 * Generate next reference number for journal entries
 */
export async function getNextReferenceNumber(companyId: string): Promise<string> {
  const supabase = await createClient()
  
  const { count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
  
  const nextNumber = ((count || 0) + 1).toString().padStart(4, '0')
  return `JE-${nextNumber}`
}
