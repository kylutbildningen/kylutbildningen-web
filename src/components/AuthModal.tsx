"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

type Mode = "login" | "onboarding";

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = useCallback((m: Mode = "login") => {
    setMode(m);
    setEmail("");
    setSent(false);
    setError(null);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onLogin = () => handleOpen("login");
    const onOnboarding = () => handleOpen("onboarding");
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };

    window.addEventListener("open-auth-modal", onLogin);
    window.addEventListener("open-auth-modal-onboarding", onOnboarding);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("open-auth-modal", onLogin);
      window.removeEventListener("open-auth-modal-onboarding", onOnboarding);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleOpen, handleClose, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const callbackNext =
      mode === "onboarding" ? "/onboarding/company" : "/dashboard";

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
        },
      });

      if (authError) throw authError;
      localStorage.setItem("pending_auth_email", email);
      localStorage.setItem("pending_auth_next", callbackNext);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte skicka länk",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,31,58,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
          style={{ color: "var(--slate-light)" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>

        <div className="px-8 py-10">
          {sent ? (
            <div className="text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
                style={{ backgroundColor: "var(--frost-light)" }}
              >
                ✉️
              </div>
              <h2
                className="mb-3 text-2xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                Kolla din inkorg
              </h2>
              <p
                className="leading-relaxed text-sm"
                style={{ color: "var(--slate-light)" }}
              >
                Vi har skickat {mode === "onboarding" ? "ett mejl" : "en inloggningslänk"} till{" "}
                <strong style={{ color: "var(--slate-deep)" }}>{email}</strong>.
                {mode === "onboarding" && (
                  <>
                    {" "}Om det är första gången du loggar in verifierar vi din
                    e-post och skickar sedan automatiskt en ny inloggningslänk.
                  </>
                )}
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
              <h2
                className="mb-2 text-center text-2xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                {mode === "onboarding" ? "Kom igång" : "Logga in"}
              </h2>
              <p
                className="mb-8 text-center text-sm leading-relaxed"
                style={{ color: "var(--slate-light)" }}
              >
                {mode === "onboarding" ? (
                  <>
                    Ange din e-postadress så skickar vi en inloggningslänk.
                    Ingen registrering krävs — är det första gången du loggar in
                    skickar vi först ett mejl för att verifiera din e-postadress.
                  </>
                ) : (
                  "Vi skickar en inloggningslänk till din e-post."
                )}
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
                    htmlFor="auth-email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                    style={{ color: "var(--slate-light)" }}
                  >
                    E-postadress
                  </label>
                  <input
                    id="auth-email"
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
                {mode === "onboarding" ? (
                  <>
                    Har du redan ett konto?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="underline"
                      style={{ color: "var(--frost)" }}
                    >
                      Logga in
                    </button>
                  </>
                ) : (
                  <>
                    Inget konto?{" "}
                    <button
                      onClick={() => setMode("onboarding")}
                      className="underline"
                      style={{ color: "var(--frost)" }}
                    >
                      Kom igång här
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
