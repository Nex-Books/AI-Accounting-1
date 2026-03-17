import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import type { Company, User } from './types'

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
  company: Company
  user: User
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
      return {
        company: requestedUser.company as Company,
        user: requestedUser as User,
      }
    }
  }
  
  // Return default company
  if (user.company) {
    return {
      company: user.company as Company,
      user: user as User,
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
 * Generate next entry number for journal entries
 */
export async function getNextEntryNumber(companyId: string): Promise<string> {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('journal_entries')
    .select('entry_number')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!data) {
    return 'JE-0001'
  }
  
  const lastNumber = parseInt(data.entry_number.replace('JE-', ''), 10)
  const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
  return `JE-${nextNumber}`
}
