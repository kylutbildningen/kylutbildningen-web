"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<Loading />}
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--frost)", borderTopColor: "transparent" }}
        />
        <p className="text-sm" style={{ color: "var(--slate-light)" }}>
          Loggar in...
        </p>
      </div>
    </div>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowser();
      const next = searchParams.get("next");
      const invite = searchParams.get("invite");

      // With implicit flow, the browser client auto-detects
      // #access_token=... from the URL hash and sets the session.
      // We just need to wait a moment and then check.

      // Also handle legacy ?code= param if present
      const code = searchParams.get("code");
      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
        } catch {
          // PKCE verifier might be missing — fall through to getUser
        }
      }

      // Give the client a moment to process hash tokens
      await new Promise((resolve) => setTimeout(resolve, 500));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Try once more — hash detection can be async
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { data: retry } = await supabase.auth.getUser();
        if (!retry.user) {
          setError("Inloggningen misslyckades. Försök skicka en ny länk.");
          return;
        }
        await routeUser(supabase, retry.user, next, invite, router);
        return;
      }

      await routeUser(supabase, user, next, invite, router);
    }

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--warm-white)" }}
      >
        <div className="mx-auto max-w-md px-6 text-center">
          <h2
            className="mb-3 text-xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            Inloggningen misslyckades
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--slate-light)" }}>
            {error}
          </p>
          <a
            href="/onboarding"
            className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--frost)" }}
          >
            Försök igen
          </a>
        </div>
      </div>
    );
  }

  return <Loading />;
}

async function routeUser(
  supabase: ReturnType<typeof createSupabaseBrowser>,
  user: { id: string },
  next: string | null,
  invite: string | null,
  router: ReturnType<typeof useRouter>,
) {
  if (invite) {
    router.replace(`/onboarding/invite?token=${invite}`);
    return;
  }

  if (next) {
    router.replace(next);
    return;
  }

  // Check profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    router.replace("/onboarding/company");
    return;
  }

  // Check memberships
  const { data: memberships } = await supabase
    .from("company_memberships")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (!memberships || memberships.length === 0) {
    router.replace("/onboarding/company");
    return;
  }

  router.replace("/dashboard");
}
