import { NextResponse, type NextRequest } from 'next/server'

// Lightweight session refresh without @supabase/ssr
export async function updateSession(request: NextRequest) {
  // Simply pass through - session management is handled client-side
  // by @supabase/supabase-js with localStorage/cookie persistence
  return NextResponse.next({ request })
}
