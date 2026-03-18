-- Fix infinite recursion in company_memberships RLS policies.
-- The admin policies referenced company_memberships in a sub-SELECT,
-- which triggered the same RLS policies again → infinite loop.
-- Solution: SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION public.get_admin_customer_ids(uid UUID)
RETURNS SETOF INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT edu_customer_id FROM public.company_memberships
  WHERE user_id = uid AND role = 'company_admin'
$$;

-- Drop recursive policies
DROP POLICY IF EXISTS "Company admins can view all memberships for their companies" ON public.company_memberships;
DROP POLICY IF EXISTS "Company admins can insert memberships for their companies" ON public.company_memberships;
DROP POLICY IF EXISTS "Company admins can update memberships for their companies" ON public.company_memberships;
DROP POLICY IF EXISTS "Company admins can delete memberships for their companies" ON public.company_memberships;

-- Recreate using SECURITY DEFINER function
CREATE POLICY "Company admins can view all memberships for their companies"
  ON public.company_memberships FOR SELECT
  USING (edu_customer_id IN (SELECT public.get_admin_customer_ids(auth.uid())));

CREATE POLICY "Company admins can insert memberships for their companies"
  ON public.company_memberships FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR edu_customer_id IN (SELECT public.get_admin_customer_ids(auth.uid()))
  );

CREATE POLICY "Company admins can update memberships for their companies"
  ON public.company_memberships FOR UPDATE
  USING (edu_customer_id IN (SELECT public.get_admin_customer_ids(auth.uid())));

CREATE POLICY "Company admins can delete memberships for their companies"
  ON public.company_memberships FOR DELETE
  USING (edu_customer_id IN (SELECT public.get_admin_customer_ids(auth.uid())));
