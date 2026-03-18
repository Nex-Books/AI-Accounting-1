import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  // Verify cron secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Use service role client for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Reset monthly usage counters for active subscriptions
  const { error } = await supabase
    .from('companies')
    .update({
      ai_transactions_used_month: 0,
      ai_queries_used_month: 0,
      docs_uploaded_month: 0,
    })
    .in('plan_status', ['active'])

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({
    success: true,
    message: 'Monthly usage counters reset',
    timestamp: new Date().toISOString(),
  })
}
