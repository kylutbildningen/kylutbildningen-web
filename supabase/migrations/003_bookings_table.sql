-- Bookings table: local booking records (EduAdmin API doesn't support POST for bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  edu_customer_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  course_name TEXT NOT NULL,
  event_date TEXT,
  event_city TEXT,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('company', 'private')),
  company_name TEXT,
  org_number TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'invoice')),
  participants JSONB NOT NULL DEFAULT '[]',
  total_price_ex_vat NUMERIC,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'pending')),
  booking_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view company bookings"
  ON public.bookings FOR SELECT
  USING (edu_customer_id IN (SELECT public.get_admin_customer_ids(auth.uid())));
