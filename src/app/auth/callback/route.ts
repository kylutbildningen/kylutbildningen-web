import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

/**
 * Server-side handler for Supabase PKCE auth code exchange.
 * Supabase redirects here with ?code=... after magic link click.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const invite = searchParams.get("invite");
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectTo = request.nextUrl.clone();

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check what the user needs to complete
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!profile) {
          redirectTo.pathname = "/onboarding/profile";
          redirectTo.search = "";
          return NextResponse.redirect(redirectTo);
        }

        // Check memberships
        const { data: memberships } = await supabase
          .from("company_memberships")
          .select("id")
          .eq("user_id", user.id)
          .limit(1);

        if (!memberships || memberships.length === 0) {
          redirectTo.pathname = "/onboarding/company";
          redirectTo.search = "";
          return NextResponse.redirect(redirectTo);
        }

        // Handle invite token if present
        if (invite) {
          redirectTo.pathname = "/onboarding/invite";
          redirectTo.search = `?token=${invite}`;
          return NextResponse.redirect(redirectTo);
        }

        // All good
        redirectTo.pathname = next;
        redirectTo.search = "";
        return NextResponse.redirect(redirectTo);
      }
    }
  }

  // Something went wrong — send to login
  redirectTo.pathname = "/logga-in";
  redirectTo.search = "";
  return NextResponse.redirect(redirectTo);
}
