-- Create webhook_logs table for Razorpay webhook tracking
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB,
  source TEXT DEFAULT 'razorpay',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying by event type
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
