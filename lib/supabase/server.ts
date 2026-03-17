/**
 * Server-side Supabase client
 * Uses @supabase/supabase-js directly - NO @supabase/ssr dependency
 * Updated: v0.3.0
 */
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Build cookie map
  const cookieMap: Record<string, string> = {}
  for (const c of allCookies) {
    cookieMap[c.name] = c.value
  }

  // Find Supabase auth token cookie
  const authKey = Object.keys(cookieMap).find(k => k.endsWith('-auth-token'))
  let accessToken: string | undefined
  let refreshToken: string | undefined

  if (authKey && cookieMap[authKey]) {
    try {
      const tokenData = JSON.parse(cookieMap[authKey])
      accessToken = tokenData?.[0]
      refreshToken = tokenData?.[1]
    } catch {
      // Invalid JSON, ignore
    }
  }

  const supabase = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Set session if we have tokens
  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  return supabase
}
