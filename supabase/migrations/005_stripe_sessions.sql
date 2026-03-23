-- Stripe Checkout session tracking table
CREATE TABLE IF NOT EXISTS public.stripe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  event_id INTEGER NOT NULL,
  form_data JSONB NOT NULL,
  customer_email TEXT,
  booking_id INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stripe_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only — webhook API uses createSupabaseAdmin() which bypasses RLS
