import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  // Verify webhook signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
    .update(rawBody)
    .digest('hex')

  if (expectedSig !== signature) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const payload = JSON.parse(rawBody)
  const event = payload.event

  // Use service role client for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Log the webhook event
  await supabase.from('webhook_logs').insert({
    event_type: event,
    payload: payload,
    source: 'razorpay',
  })

  const subscriptionId = payload.payload?.subscription?.entity?.id

  if (!subscriptionId) {
    return Response.json({ received: true, skipped: 'No subscription ID' })
  }

  try {
    switch (event) {
      case 'subscription.activated':
        await supabase
          .from('companies')
          .update({ plan_status: 'active' })
          .eq('razorpay_subscription_id', subscriptionId)
        break

      case 'subscription.charged':
        // Reset usage counters on successful charge (new billing cycle)
        await supabase
          .from('companies')
          .update({
            ai_transactions_used_month: 0,
            ai_queries_used_month: 0,
            docs_uploaded_month: 0,
          })
          .eq('razorpay_subscription_id', subscriptionId)
        break

      case 'subscription.halted':
        await supabase
          .from('companies')
          .update({ plan_status: 'past_due' })
          .eq('razorpay_subscription_id', subscriptionId)
        break

      case 'subscription.cancelled':
        await supabase
          .from('companies')
          .update({ plan_status: 'cancelled' })
          .eq('razorpay_subscription_id', subscriptionId)
        break
    }

    return Response.json({ received: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
