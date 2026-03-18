"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const callbackNext = redirectTo || "/dashboard";

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
        },
      });

      if (authError) throw authError;
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte skicka länk",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="mx-auto max-w-md px-6 py-20">
        {sent ? (
          <div className="text-center">
            <div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: "var(--frost-light)" }}
            >
              ✉️
            </div>
            <h1
              className="mb-3 text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Kolla din inkorg
            </h1>
            <p style={{ color: "var(--slate-light)" }}>
              Vi har skickat en inloggningslänk till{" "}
              <strong style={{ color: "var(--slate-deep)" }}>{email}</strong>.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-sm font-medium underline"
              style={{ color: "var(--frost)" }}
            >
              Använd en annan e-postadress
            </button>
          </div>
        ) : (
          <>
            <h1
              className="mb-2 text-center text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Logga in
            </h1>
            <p
              className="mb-8 text-center text-sm"
              style={{ color: "var(--slate-light)" }}
            >
              Vi skickar en inloggningslänk till din e-post.
            </p>

            {error && (
              <div
                className="mb-4 rounded-lg border p-3 text-sm"
                style={{
                  borderColor: "var(--danger)",
                  backgroundColor: "#fef2f2",
                  color: "var(--danger)",
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                  style={{ color: "var(--slate-light)" }}
                >
                  E-postadress
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="anna@foretag.se"
                  className="form-input"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  background:
                    "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
                }}
              >
                {loading ? "Skickar..." : "Skicka inloggningslänk"}
              </button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "var(--slate-light)" }}
            >
              Inget konto?{" "}
              <a
                href="/onboarding"
                className="underline"
                style={{ color: "var(--frost)" }}
              >
                Kom igång här
              </a>
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
