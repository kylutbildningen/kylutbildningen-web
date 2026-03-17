"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function VerifyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      const supabase = createSupabaseBrowser();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError("Verifieringen misslyckades. Försök igen.");
        return;
      }

      // Session OK — redirect to company step
      router.replace("/onboarding/company");
    }

    verify();
  }, [router]);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="border-b bg-white py-4" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-6">
          <StepIndicator currentStep={2} />
        </div>
      </div>

      <div className="mx-auto max-w-md px-6 py-16 text-center">
        {error ? (
          <>
            <h1
              className="mb-3 text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Något gick fel
            </h1>
            <p className="mb-6" style={{ color: "var(--slate-light)" }}>
              {error}
            </p>
            <a
              href="/onboarding"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Försök igen
            </a>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: "var(--frost)",
                borderTopColor: "transparent",
              }}
            />
            <p style={{ color: "var(--slate-light)" }}>Verifierar...</p>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
