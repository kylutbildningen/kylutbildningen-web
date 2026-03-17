import { createSupabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user, or redirect to login.
 */
export async function requireAuth() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logga-in");
  }

  return { user, supabase };
}

/**
 * Get the user's profile, or null if not created yet.
 */
export async function getProfile(userId: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

/**
 * Get all company memberships for a user.
 */
export async function getMemberships(userId: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("company_memberships")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
