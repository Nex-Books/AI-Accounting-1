import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    let user = null
    let hasCompany = false

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
      
      if (user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single()
          hasCompany = !!userData?.company_id
        } catch {
          // Silently fail - user exists but company_id check failed
          hasCompany = false
        }
      }
    } catch {
      // Silently fail - auth check failed
      user = null
      hasCompany = false
    }

    return { supabaseResponse, user, hasCompany, supabase }
  } catch (error) {
    console.error('[updateSession] Fatal error:', error)
    // Return a safe default response
    return { 
      supabaseResponse: NextResponse.next(), 
      user: null, 
      hasCompany: false,
      supabase: null 
    }
  }
}

