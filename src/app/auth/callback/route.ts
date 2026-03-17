import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Server-side handler for Supabase PKCE auth code exchange.
 * Must manually handle cookies so they propagate to the redirect response.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const invite = searchParams.get("invite");

  const redirectTo = request.nextUrl.clone();
  redirectTo.searchParams.delete("code");
  redirectTo.searchParams.delete("next");

  // Default destination
  redirectTo.pathname = "/logga-in";
  redirectTo.search = "";

  // We need to collect cookies set during exchangeCodeForSession
  // and apply them to the redirect response
  const cookiesToSet: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            // Collect cookies — we'll apply them to the redirect response
            cookies.forEach((cookie) => {
              cookiesToSet.push(cookie);
            });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Determine where to send the user
        if (invite) {
          redirectTo.pathname = "/onboarding/invite";
          redirectTo.search = `?token=${invite}`;
        } else if (next) {
          redirectTo.pathname = next;
          redirectTo.search = "";
        } else {
          // Check profile & memberships to decide
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .single();

          if (!profile) {
            redirectTo.pathname = "/onboarding/company";
          } else {
            const { data: memberships } = await supabase
              .from("company_memberships")
              .select("id")
              .eq("user_id", user.id)
              .limit(1);

            if (!memberships || memberships.length === 0) {
              redirectTo.pathname = "/onboarding/company";
            } else {
              redirectTo.pathname = "/dashboard";
            }
          }
          redirectTo.search = "";
        }
      }
    } else {
      console.error("Code exchange failed:", error.message);
    }
  }

  // Create redirect response and apply collected auth cookies
  const response = NextResponse.redirect(redirectTo);

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options as Record<string, string>);
  }

  return response;
}
