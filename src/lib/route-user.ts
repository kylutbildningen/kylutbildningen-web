import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Router = { replace: (url: string) => void };

export async function routeUser(
  supabase: ReturnType<typeof createSupabaseBrowser>,
  user: { id: string; email?: string },
  next: string | null,
  invite: string | null,
  router: Router,
) {
  if (invite) {
    router.replace(`/onboarding/invite?token=${invite}`);
    return;
  }

  if (next) {
    router.replace(next);
    return;
  }

  // Check memberships
  const { data: memberships } = await supabase
    .from("company_memberships")
    .select("id, role")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    const role = memberships[0].role;
    router.replace(role === "participant" ? "/dashboard/mina-kurser" : "/dashboard");
    return;
  }

  // No membership — try auto-creating a participant membership from persons table
  if (user.email) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const res = await fetch("/api/auth/create-participant-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      if (res.ok) {
        const data = await res.json() as { found: boolean };
        if (data.found) {
          router.replace("/dashboard/mina-kurser");
          return;
        }
      }
    }
  }

  // Fall through to onboarding for contact persons
  router.replace("/onboarding/company");
}
