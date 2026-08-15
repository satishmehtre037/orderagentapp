-- Migration: Phase 4 Razorpay Subscription Billing
-- Add Razorpay columns to businesses table
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS razorpay_customer_id text,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'trial';

-- Create payment_events table for tracking ledger payments
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  razorpay_payment_id text NOT NULL,
  amount integer NOT NULL, -- Amount in paise (e.g. 99900 = ₹999)
  status text NOT NULL, -- 'success' | 'failed'
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on payment_events
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view payment events for their business
CREATE POLICY "Owners can view payment events for their business"
  ON payment_events FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_email = auth.jwt()->>'email'
    )
  );

-- Service role bypass policy for backend engine insertion
CREATE POLICY "Service role full access to payment_events"
  ON payment_events FOR ALL
  USING (true)
  WITH CHECK (true);
