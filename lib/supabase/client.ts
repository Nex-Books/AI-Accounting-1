'use client'

/**
 * Browser-side Supabase client
 * Uses @supabase/supabase-js directly - NO @supabase/ssr dependency
 * Updated: v0.3.0
 */
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

let browserClient: ReturnType<typeof supabaseCreateClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }
  
  browserClient = supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return browserClient
}
