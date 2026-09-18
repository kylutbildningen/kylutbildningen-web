import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

/** Roles that manage a company (bookings, team, company details). */
export const STAFF_ROLES = ["company_admin", "contact_person"] as const;

export interface GuardMembership {
  role: string;
  edu_contact_id: number | null;
}

type Denied = { error: NextResponse };

function deny(message: string, status: number): Denied {
  return { error: NextResponse.json({ error: message }, { status }) };
}

/**
 * Require a logged-in user — from the session cookie, or from an
 * `Authorization: Bearer <jwt>` header. Use in API routes:
 *   const auth = await requireUser();
 *   if ("error" in auth) return auth.error;
 */
export async function requireUser(): Promise<Denied | { user: User }> {
  const supabase = await createSupabaseServer();
  const authHeader = (await headers()).get("Authorization");
  const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  const {
    data: { user },
  } = jwt ? await supabase.auth.getUser(jwt) : await supabase.auth.getUser();

  if (!user) return deny("Ej inloggad", 401);
  return { user };
}

/**
 * Require a logged-in user with a membership on the given EduAdmin customer,
 * optionally restricted to specific roles.
 */
export async function requireMembership(
  customerId: unknown,
  allowedRoles?: readonly string[],
): Promise<Denied | { user: User; membership: GuardMembership; customerId: number }> {
  const cid = Number(customerId);
  if (!Number.isInteger(cid) || cid <= 0) return deny("Ogiltigt kund-ID", 400);

  const auth = await requireUser();
  if ("error" in auth) return auth;

  const { data: membership } = await createSupabaseAdmin()
    .from("company_memberships")
    .select("role, edu_contact_id")
    .eq("user_id", auth.user.id)
    .eq("edu_customer_id", cid)
    .maybeSingle();

  if (!membership || (allowedRoles && !allowedRoles.includes(membership.role))) {
    return deny("Åtkomst nekad", 403);
  }

  return { user: auth.user, membership, customerId: cid };
}
