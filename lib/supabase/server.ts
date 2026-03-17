import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // Get all Supabase auth cookies
  const allCookies = cookieStore.getAll()
  const authCookies: Record<string, string> = {}
  allCookies.forEach(c => { authCookies[c.name] = c.value })

  // Find the access and refresh tokens from Supabase cookies
  const accessTokenKey = Object.keys(authCookies).find(k => k.endsWith('-auth-token'))
  let accessToken: string | undefined
  let refreshToken: string | undefined

  if (accessTokenKey) {
    try {
      const parsed = JSON.parse(authCookies[accessTokenKey])
      accessToken = parsed?.[0]
      refreshToken = parsed?.[1]
    } catch {}
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  }

  return supabase
}
