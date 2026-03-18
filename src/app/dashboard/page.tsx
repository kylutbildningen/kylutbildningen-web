"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CompanySelector } from "@/components/dashboard/CompanySelector";
import { RoleBadge } from "@/components/dashboard/RoleBadge";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { canBook, canManageMembers } from "@/lib/auth/permissions";

interface Membership {
  id: string;
  edu_customer_id: number;
  company_name: string;
  org_number: string | null;
  role: string;
  is_contact_person: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/logga-in");
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setUserName(profile?.full_name ?? user.email ?? "");

      // Get memberships
      const { data: mems } = await supabase
        .from("company_memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mems || mems.length === 0) {
        router.replace("/onboarding/company");
        return;
      }

      setMemberships(mems);

      const stored = sessionStorage.getItem("selected_company");
      const initial = stored
        ? parseInt(stored)
        : mems[0].edu_customer_id;
      setSelectedCompany(initial);
      setLoading(false);
    }

    load();
  }, [router]);

  function handleCompanySelect(customerId: number) {
    setSelectedCompany(customerId);
    sessionStorage.setItem("selected_company", String(customerId));
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/logga-in");
  }

  const currentMembership = memberships.find(
    (m) => m.edu_customer_id === selectedCompany,
  );
  const role = currentMembership?.role ?? "";

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <span className="text-sm" style={{ color: "var(--slate-light)" }}>
            Laddar...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Hej, {userName}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm" style={{ color: "var(--slate-light)" }}>
                {currentMembership?.company_name}
              </span>
              <RoleBadge role={role} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CompanySelector
              memberships={memberships}
              selected={selectedCompany}
              onSelect={handleCompanySelect}
            />
            <button
              onClick={handleLogout}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
              style={{
                borderColor: "var(--border)",
                color: "var(--slate-light)",
              }}
            >
              Logga ut
            </button>
          </div>
        </div>

        {/* Action cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canBook(role) && (
            <Link
              href="/kurser"
              className="rounded-xl border bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <h3
                className="mb-2 text-lg font-medium"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                Boka kurs
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--slate-light)" }}
              >
                Se kommande kurstillfällen och boka platser.
              </p>
            </Link>
          )}

          <Link
            href="/dashboard/foretag"
            className="rounded-xl border bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="mb-2 text-lg font-medium"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Företagsöversikt
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              Kontaktpersoner, deltagare och företagsuppgifter.
            </p>
          </Link>

          {canManageMembers(role) && (
            <Link
              href="/dashboard/team"
              className="rounded-xl border bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <h3
                className="mb-2 text-lg font-medium"
                style={{
                  fontFamily: "var(--font-serif)",
                  color: "var(--slate-deep)",
                }}
              >
                Hantera team
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--slate-light)" }}
              >
                Bjud in kollegor och hantera behörigheter.
              </p>
            </Link>
          )}

          <Link
            href="/onboarding/company"
            className="rounded-xl border bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="mb-2 text-lg font-medium"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Lägg till företag
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              Koppla ytterligare ett företag till ditt konto.
            </p>
          </Link>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
