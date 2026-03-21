"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { LoaderIcon, BuildingIcon, CheckIcon } from "@/components/icons";

interface CompanyMatch {
  customerId: number;
  customerName: string;
  organisationNumber: string;
  personId: number;
  personName: string;
  isContactPerson: boolean;
}

export default function CompanyPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CompanyMatch | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        router.replace("/onboarding");
        return;
      }
      setUserEmail(user.email);

      try {
        const res = await fetch(`/api/auth/companies-by-email?email=${encodeURIComponent(user.email)}`);
        if (res.ok) setCompanies(await res.json());
      } catch { /* show empty state */ }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleContinue() {
    if (!selected || !userEmail) return;
    setCreating(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/onboarding"); return; }

      const res = await fetch("/api/auth/create-membership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customerId: selected.customerId,
          userId: session.user.id,
          email: userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte skapa koppling");

      router.push("/onboarding/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />

      <div className="border-b bg-white py-4" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-2xl px-6">
          <StepIndicator currentStep={3} />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-2 text-center text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
          Välj ditt företag
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
          Vi hittade följande företag kopplade till{" "}
          {userEmail && <strong style={{ color: "var(--slate-deep)" }}>{userEmail}</strong>}{" "}
          i EduAdmin.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <LoaderIcon className="animate-spin" />
            <span className="text-sm" style={{ color: "var(--slate-light)" }}>Söker efter dina företag...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center" style={{ borderColor: "var(--border)" }}>
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--slate-deep)" }}>
              Ingen matchning hittades
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
              Din e-post finns inte registrerad som kontaktperson i EduAdmin.
              Kontakta oss på{" "}
              <a href="mailto:info@kylutbildningen.se" className="underline" style={{ color: "var(--frost)" }}>
                info@kylutbildningen.se
              </a>{" "}
              så hjälper vi dig.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company) => {
              const isSelected = selected?.customerId === company.customerId;
              return (
                <button
                  key={company.customerId}
                  onClick={() => setSelected(isSelected ? null : company)}
                  className="w-full rounded-lg border bg-white p-4 text-left transition-all"
                  style={{
                    borderColor: isSelected ? "var(--frost)" : "var(--border)",
                    boxShadow: isSelected ? "0 0 0 1px var(--frost)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: isSelected ? "var(--frost-light)" : "#f0f0f0", color: isSelected ? "var(--frost-dark)" : "var(--slate-light)" }}>
                      {isSelected ? <CheckIcon /> : <BuildingIcon />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium" style={{ color: "var(--slate-deep)" }}>
                        {company.customerName}
                      </span>
                      <span className="block text-xs" style={{ color: "var(--slate-light)" }}>
                        {company.organisationNumber && `Org.nr: ${company.organisationNumber} · `}
                        {company.isContactPerson ? "Kontaktperson" : "Person"}: {company.personName}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {selected && (
              <button
                onClick={handleContinue}
                disabled={creating}
                className="mt-2 w-full rounded-lg py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)" }}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderIcon className="animate-spin" /> Skapar koppling...
                  </span>
                ) : (
                  `Fortsätt med ${selected.customerName}`
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
