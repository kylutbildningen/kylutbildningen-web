CREATE TABLE IF NOT EXISTS booking_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  edu_customer_id integer,
  booking_id text,
  participant_id integer,
  edu_person_id integer,
  participant_name text,
  action text NOT NULL,
  from_event_id integer,
  to_event_id integer,
  actor_email text,
  actor_user_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view company booking events" ON booking_events
  FOR SELECT USING (
    edu_customer_id IN (
      SELECT edu_customer_id FROM company_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on booking_events" ON booking_events
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX booking_events_customer_idx ON booking_events (edu_customer_id, created_at DESC);
