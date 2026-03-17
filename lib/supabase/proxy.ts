/**
 * Middleware session handler
 * NO @supabase/ssr dependency - just passes through
 * Updated: v0.3.0
 */
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Pass through - session is managed client-side by @supabase/supabase-js
  return NextResponse.next({ request })
}
