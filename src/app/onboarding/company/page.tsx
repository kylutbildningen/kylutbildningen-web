"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { CompanySearch } from "@/components/onboarding/CompanySearch";
import { VerificationResult } from "@/components/onboarding/VerificationResult";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { LoaderIcon } from "@/components/icons";

interface SelectedCompany {
  CustomerId: number;
  CustomerName: string;
  OrganisationNumber: string;
}

type VerifyStatus = "idle" | "verifying" | "verified" | "not_contact" | "not_found";

export default function CompanyPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedCompany | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [contactName, setContactName] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user email from session
  useEffect(() => {
    async function getUser() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/onboarding");
        return;
      }
      setUserEmail(user.email ?? null);
    }
    getUser();
  }, [router]);

  // Verify when company is selected
  async function handleSelect(customer: SelectedCompany) {
    setSelected(customer);
    setVerifyStatus("verifying");
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          customerId: customer.CustomerId,
        }),
      });

      const data = await res.json();

      if (data.verified && data.isContactPerson) {
        setVerifyStatus("verified");
        setContactName(data.contactName);
      } else if (data.verified) {
        setVerifyStatus("not_contact");
      } else {
        setVerifyStatus("not_found");
      }
    } catch {
      setVerifyStatus("not_found");
    }
  }

  async function handleContinue() {
    if (!selected) return;
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/create-membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: selected.CustomerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kunde inte skapa koppling");
      }

      router.push("/onboarding/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setCreating(false);
    }
  }

  function handleReset() {
    setSelected(null);
    setVerifyStatus("idle");
    setContactName(null);
    setError(null);
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div
        className="border-b bg-white py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <StepIndicator currentStep={3} />
        </div>
      </div>

      <div className="mx-auto max-w-lg px-6 py-16">
        <h1
          className="mb-2 text-center text-2xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--slate-deep)",
          }}
        >
          Sök ditt företag
        </h1>
        <p
          className="mb-8 text-center text-sm leading-relaxed"
          style={{ color: "var(--slate-light)" }}
        >
          Vi kontrollerar att din e-post{" "}
          {userEmail && (
            <strong style={{ color: "var(--slate-deep)" }}>{userEmail}</strong>
          )}{" "}
          är registrerad som kontaktperson i EduAdmin.
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

        {!selected ? (
          <CompanySearch onSelect={handleSelect} />
        ) : (
          <div className="space-y-4">
            {/* Selected company header */}
            <div
              className="flex items-center justify-between rounded-lg border p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <span
                  className="block text-sm font-medium"
                  style={{ color: "var(--slate-deep)" }}
                >
                  {selected.CustomerName}
                </span>
                {selected.OrganisationNumber && (
                  <span
                    className="text-xs"
                    style={{ color: "var(--slate-light)" }}
                  >
                    Org.nr: {selected.OrganisationNumber}
                  </span>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-medium underline"
                style={{ color: "var(--frost)" }}
              >
                Byt företag
              </button>
            </div>

            {/* Verification status */}
            {verifyStatus === "verifying" && (
              <div className="flex items-center justify-center gap-3 py-8">
                <LoaderIcon className="animate-spin" />
                <span className="text-sm" style={{ color: "var(--slate-light)" }}>
                  Verifierar din e-post...
                </span>
              </div>
            )}

            {verifyStatus === "verified" && (
              <VerificationResult
                status="verified"
                companyName={selected.CustomerName}
                contactName={contactName ?? undefined}
                onContinue={creating ? undefined : handleContinue}
              />
            )}

            {verifyStatus === "not_contact" && (
              <VerificationResult
                status="not_contact"
                companyName={selected.CustomerName}
              />
            )}

            {verifyStatus === "not_found" && (
              <VerificationResult
                status="not_found"
                companyName={selected.CustomerName}
              />
            )}

            {creating && (
              <div className="flex items-center justify-center gap-3 py-4">
                <LoaderIcon className="animate-spin" />
                <span className="text-sm" style={{ color: "var(--slate-light)" }}>
                  Skapar koppling...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
