-- Svea Checkout order tracking table
CREATE TABLE IF NOT EXISTS public.svea_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_order_number TEXT NOT NULL,
  svea_order_id BIGINT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL,
  form_data JSONB NOT NULL,
  customer_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  booking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.svea_orders ENABLE ROW LEVEL SECURITY;

-- Service role only — no user-facing RLS policies needed
-- Callback API uses createSupabaseAdmin() which bypasses RLS
