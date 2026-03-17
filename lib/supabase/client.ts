'use client'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Singleton client instance for browser-side usage
let client: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  if (client) return client
  
  client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
  
  return client
}
