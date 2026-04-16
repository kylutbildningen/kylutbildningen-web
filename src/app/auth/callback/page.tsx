"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { routeUser } from "@/lib/route-user";

function getHashError(): { code: string; description: string } | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.replace("#", ""));
  const code = params.get("error_code");
  const description = params.get("error_description");
  if (code) return { code, description: description?.replace(/\+/g, " ") || code };
  return null;
}

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
  const [resending, setResending] = useState(false);
  const [resendingFromError, setResendingFromError] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    const pendingEmail = localStorage.getItem("pending_auth_email");
    if (!pendingEmail) {
      router.replace("/onboarding");
      return;
    }
    setResendingFromError(true);
    const supabase = createSupabaseBrowser();
    const pendingNext = localStorage.getItem("pending_auth_next");
    const next = searchParams.get("next");
    const callbackNext = pendingNext || next || "/dashboard";
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: pendingEmail,
    });
    setResendingFromError(false);
    if (!resendError) {
      setResent(true);
      setError(null);
    }
  }

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowser();
      const next = searchParams.get("next");
      const invite = searchParams.get("invite");

      // Check for errors in URL hash (e.g. otp_expired from expired magic links)
      const hashError = getHashError();
      if (hashError) {
        const pendingEmail = localStorage.getItem("pending_auth_email");
        if (hashError.code === "otp_expired") {
          setError(
            pendingEmail
              ? `Inloggningskoden har gått ut. Klicka nedan för att få en ny kod till ${pendingEmail}.`
              : "Inloggningskoden har gått ut. Försök logga in igen."
          );
        } else {
          setError(`Inloggningen misslyckades: ${hashError.description}`);
        }
        return;
      }

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
          // No session — this was likely an email verification, not a login.
          // Auto-send a new magic link if we have a saved email.
          const pendingEmail = localStorage.getItem("pending_auth_email");
          const pendingNext = localStorage.getItem("pending_auth_next");
          if (pendingEmail) {
            setResending(true);
            const callbackNext = pendingNext || next || "/dashboard";
            const { error: resendError } = await supabase.auth.signInWithOtp({
              email: pendingEmail,
            });
            if (!resendError) {
              return; // Stay in "resending" state — shows the confirmation UI
            }
          }
          setError("Inloggningen misslyckades. Försök logga in igen.");
          return;
        }
        localStorage.removeItem("pending_auth_email");
        localStorage.removeItem("pending_auth_next");
        await routeUser(supabase, retry.user, next, invite, router);
        return;
      }

      localStorage.removeItem("pending_auth_email");
      localStorage.removeItem("pending_auth_next");
      await routeUser(supabase, user, next, invite, router);
    }

    handleCallback();
  }, [router, searchParams]);

  if (resending) {
    const pendingEmail = typeof window !== "undefined" ? localStorage.getItem("pending_auth_email") : null;
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--warm-white)" }}
      >
        <div className="mx-auto max-w-md px-6 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: "var(--frost-light)" }}
          >
            ✅
          </div>
          <h2
            className="mb-3 text-xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            E-post verifierad!
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
            Vi har skickat en ny inloggningskod till{" "}
            {pendingEmail && <strong style={{ color: "var(--slate-deep)" }}>{pendingEmail}</strong>}
            . Gå tillbaka och ange koden för att logga in.
          </p>
        </div>
      </div>
    );
  }

  if (resent) {
    const pendingEmail = typeof window !== "undefined" ? localStorage.getItem("pending_auth_email") : null;
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: "var(--warm-white)" }}
      >
        <div className="mx-auto max-w-md px-6 text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: "var(--frost-light)" }}
          >
            ✉️
          </div>
          <h2
            className="mb-3 text-xl"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--slate-deep)",
            }}
          >
            Ny kod skickad!
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
            Vi har skickat en ny inloggningskod till{" "}
            {pendingEmail && <strong style={{ color: "var(--slate-deep)" }}>{pendingEmail}</strong>}
            . Gå tillbaka och ange koden för att logga in.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const pendingEmail = typeof window !== "undefined" ? localStorage.getItem("pending_auth_email") : null;
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
            Koden har gått ut
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--slate-light)" }}>
            {error}
          </p>
          {pendingEmail ? (
            <button
              onClick={handleResend}
              disabled={resendingFromError}
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--frost)", opacity: resendingFromError ? 0.7 : 1 }}
            >
              {resendingFromError ? "Skickar..." : "Skicka ny inloggningskod"}
            </button>
          ) : (
            <a
              href="/onboarding"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Logga in igen
            </a>
          )}
        </div>
      </div>
    );
  }

  return <Loading />;
}

