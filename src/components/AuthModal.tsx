"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { routeUser } from "@/lib/route-user";

type Mode = "login" | "onboarding";

export function AuthModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOpen = useCallback((m: Mode = "login") => {
    setMode(m);
    setEmail("");
    setSent(false);
    setError(null);
    setOtp(["", "", "", "", "", ""]);
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

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
      });

      if (authError) throw authError;
      localStorage.setItem("pending_auth_email", email);
      localStorage.setItem(
        "pending_auth_next",
        mode === "onboarding" ? "/onboarding/company" : "/dashboard",
      );
      setSent(true);
      // Focus first OTP input after render
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte skicka kod",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled
    if (digit && index === 5 && newOtp.every((d) => d)) {
      verifyOtp(newOtp.join(""));
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    // Focus the next empty or last input
    const nextEmpty = newOtp.findIndex((d) => !d);
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    // Auto-submit if all filled
    if (newOtp.every((d) => d)) {
      verifyOtp(newOtp.join(""));
    }
  }

  async function verifyOtp(token: string) {
    setVerifying(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (verifyError) throw verifyError;

      if (data.user) {
        localStorage.removeItem("pending_auth_email");
        localStorage.removeItem("pending_auth_next");
        const callbackNext =
          mode === "onboarding" ? "/onboarding/company" : null;
        await routeUser(supabase, data.user, callbackNext, null, router);
        setOpen(false);
      }
    } catch (err) {
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setError(
        err instanceof Error ? err.message : "Ogiltig kod. Försök igen.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    setOtp(["", "", "", "", "", ""]);

    try {
      const supabase = createSupabaseBrowser();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
      });
      if (authError) throw authError;
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kunde inte skicka ny kod",
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
                Ange din kod
              </h2>
              <p
                className="leading-relaxed text-sm"
                style={{ color: "var(--slate-light)" }}
              >
                Vi har skickat en 6-siffrig kod till{" "}
                <strong style={{ color: "var(--slate-deep)" }}>{email}</strong>.
                Ange koden nedan för att logga in.
              </p>

              {error && (
                <div
                  className="mt-4 rounded-lg border p-3 text-sm"
                  style={{
                    borderColor: "var(--danger)",
                    backgroundColor: "#fef2f2",
                    color: "var(--danger)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* OTP input */}
              <div className="mt-6 flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={verifying}
                    className="h-14 w-12 rounded-lg border-2 text-center text-xl font-semibold transition-colors focus:outline-none"
                    style={{
                      borderColor: digit ? "var(--frost)" : "#e2e8f0",
                      color: "var(--slate-deep)",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--frost)";
                    }}
                    onBlur={(e) => {
                      if (!digit) e.target.style.borderColor = "#e2e8f0";
                    }}
                  />
                ))}
              </div>

              {verifying && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                    style={{ borderColor: "var(--frost)", borderTopColor: "transparent" }}
                  />
                  <span className="text-sm" style={{ color: "var(--slate-light)" }}>
                    Verifierar...
                  </span>
                </div>
              )}

              <div className="mt-6 flex flex-col items-center gap-2">
                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm font-medium underline"
                  style={{ color: "var(--frost)" }}
                >
                  {loading ? "Skickar..." : "Skicka ny kod"}
                </button>
                <button
                  onClick={() => {
                    setSent(false);
                    setError(null);
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="text-sm font-medium underline"
                  style={{ color: "var(--slate-light)" }}
                >
                  Använd en annan e-postadress
                </button>
              </div>
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
                    Ange din e-postadress så skickar vi en inloggningskod.
                    Ingen registrering krävs.
                  </>
                ) : (
                  "Vi skickar en inloggningskod till din e-post."
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
                  {loading ? "Skickar..." : "Skicka inloggningskod"}
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
