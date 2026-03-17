"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function OnboardingPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding/verify`,
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

      <div className="border-b bg-white py-4" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-6">
          <StepIndicator currentStep={1} />
        </div>
      </div>

      <div className="mx-auto max-w-md px-6 py-16">
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
            <p className="leading-relaxed" style={{ color: "var(--slate-light)" }}>
              Vi har skickat en inloggningslänk till{" "}
              <strong style={{ color: "var(--slate-deep)" }}>{email}</strong>.
              Klicka på länken för att fortsätta.
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
              Kom igång
            </h1>
            <p
              className="mb-8 text-center text-sm leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              Ange din e-postadress så skickar vi en inloggningslänk.
              Ingen registrering krävs.
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
              className="mt-6 text-center text-xs leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              Har du redan ett konto?{" "}
              <a href="/logga-in" className="underline" style={{ color: "var(--frost)" }}>
                Logga in
              </a>
            </p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
