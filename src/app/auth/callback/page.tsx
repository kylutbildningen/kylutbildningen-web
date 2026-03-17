"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "var(--warm-white)" }}
        >
          <p className="text-sm" style={{ color: "var(--slate-light)" }}>
            Loggar in...
          </p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowser();
      const code = searchParams.get("code");
      const next = searchParams.get("next");
      const invite = searchParams.get("invite");

      // Exchange PKCE code for session (client-side has the verifier)
      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("Code exchange failed:", exchangeError.message);
          setError(exchangeError.message);
          return;
        }
      }

      // Verify we have a session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/logga-in");
        return;
      }

      // Handle invite token
      if (invite) {
        router.replace(`/onboarding/invite?token=${invite}`);
        return;
      }

      // Handle explicit next destination
      if (next) {
        router.replace(next);
        return;
      }

      // Auto-detect: check profile & memberships
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.replace("/onboarding/company");
        return;
      }

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

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--frost)",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-sm" style={{ color: "var(--slate-light)" }}>
          Loggar in...
        </p>
      </div>
    </div>
  );
}
