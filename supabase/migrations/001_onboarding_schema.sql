-- Profiles: extended user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Company memberships: links users to EduAdmin customer accounts
CREATE TABLE IF NOT EXISTS public.company_memberships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edu_customer_id     INTEGER NOT NULL,
  edu_contact_id      INTEGER,
  company_name        TEXT NOT NULL,
  org_number          TEXT,
  role                TEXT NOT NULL CHECK (role IN ('company_admin', 'contact_person', 'participant')),
  is_contact_person   BOOLEAN DEFAULT false,
  invited_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, edu_customer_id)
);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
  ON public.company_memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view all memberships for their companies"
  ON public.company_memberships FOR SELECT
  USING (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
  );

CREATE POLICY "Company admins can insert memberships for their companies"
  ON public.company_memberships FOR INSERT
  WITH CHECK (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Company admins can update memberships for their companies"
  ON public.company_memberships FOR UPDATE
  USING (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
  );

CREATE POLICY "Company admins can delete memberships for their companies"
  ON public.company_memberships FOR DELETE
  USING (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
  );

-- Invitations: team invites
CREATE TABLE IF NOT EXISTS public.invitations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT NOT NULL,
  edu_customer_id  INTEGER NOT NULL,
  role             TEXT NOT NULL CHECK (role IN ('contact_person', 'participant')),
  invited_by       UUID NOT NULL REFERENCES auth.users(id),
  token            UUID NOT NULL DEFAULT gen_random_uuid(),
  accepted_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ DEFAULT (now() + INTERVAL '7 days'),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invited users can view their invitations"
  ON public.invitations FOR SELECT
  USING (true);

CREATE POLICY "Company admins can insert invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
  );

CREATE POLICY "Company admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    edu_customer_id IN (
      SELECT edu_customer_id FROM public.company_memberships
      WHERE user_id = auth.uid() AND role = 'company_admin'
    )
  );
