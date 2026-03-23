"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { LoaderIcon, BuildingIcon, CheckIcon } from "@/components/icons";
import { NewCustomerModal } from "@/components/onboarding/NewCustomerModal";

interface CompanyMatch {
  customerId: number;
  customerName: string;
  organisationNumber: string;
  personId: number;
  personName: string;
  isContactPerson: boolean;
}

interface PersonData {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  civic_registration_number: string | null;
}

export default function CompanyPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CompanyMatch | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);

  // Person data from persons table (pre-filled for participants)
  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    mobile: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        router.replace("/onboarding");
        return;
      }
      setUserEmail(user.email);

      // Check if person data exists in persons table
      const { data: person } = await supabase
        .from("persons")
        .select("first_name,last_name,email,phone,mobile,civic_registration_number")
        .eq("email", user.email)
        .limit(1)
        .single();

      if (person) {
        setPersonData(person as PersonData);
        setProfileForm({
          firstName: person.first_name || "",
          lastName: person.last_name || "",
          phone: person.phone || "",
          mobile: person.mobile || "",
        });
      }

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

      // If we have person data, save profile and skip profile step
      if (personData) {
        await supabase.from("profiles").upsert({
          id: session.user.id,
          full_name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
          phone: profileForm.phone || profileForm.mobile || null,
          updated_at: new Date().toISOString(),
        });

        // Determine redirect based on role
        const isParticipant = !selected.isContactPerson;
        router.push(isParticipant ? "/dashboard/mina-kurser" : "/dashboard");
      } else {
        router.push("/onboarding/profile");
      }
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
          Välkommen!
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed" style={{ color: "var(--slate-light)" }}>
          {personData
            ? "Kontrollera dina uppgifter och välj företag för att komma igång."
            : <>Vi hittade följande företag kopplade till{" "}
                {userEmail && <strong style={{ color: "var(--slate-deep)" }}>{userEmail}</strong>}{" "}
                i EduAdmin.</>
          }
        </p>

        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-12">
            <LoaderIcon className="animate-spin" />
            <span className="text-sm" style={{ color: "var(--slate-light)" }}>Söker efter dina uppgifter...</span>
          </div>
        ) : (
          <>
            {/* Person data card */}
            {personData && (
              <div className="mb-6 rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                    Dina uppgifter
                  </h2>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{ borderColor: "var(--frost)", color: "var(--frost)" }}
                    >
                      Ändra
                    </button>
                  )}
                </div>

                {!editingProfile ? (
                  <div className="space-y-1 text-sm" style={{ color: "var(--slate-light)" }}>
                    <p>
                      <span className="font-medium" style={{ color: "var(--slate-deep)" }}>
                        {personData.first_name} {personData.last_name}
                      </span>
                    </p>
                    {personData.email && <p>{personData.email}</p>}
                    {(personData.phone || personData.mobile) && (
                      <p>{personData.phone || personData.mobile}</p>
                    )}
                    {personData.civic_registration_number && (
                      <p>Personnummer: {personData.civic_registration_number}</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                          Förnamn
                        </label>
                        <input
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                          Efternamn
                        </label>
                        <input
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                          Telefon
                        </label>
                        <input
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                          className="form-input"
                          type="tel"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                          Mobil
                        </label>
                        <input
                          value={profileForm.mobile}
                          onChange={(e) => setProfileForm(f => ({ ...f, mobile: e.target.value }))}
                          className="form-input"
                          type="tel"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="rounded-lg px-4 py-2 text-xs font-medium"
                      style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}
                    >
                      Klar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Registration modal */}
            {showRegistration && userEmail && (
              <NewCustomerModal
                email={userEmail}
                onClose={() => setShowRegistration(false)}
              />
            )}

            {/* Company selection */}
            {companies.length === 0 ? (
              <div className="rounded-lg border bg-white p-6 text-center" style={{ borderColor: "var(--border)" }}>
                <h3 className="font-semibold mb-2" style={{ color: "var(--navy)" }}>
                  Ny kund?
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                  Vi hittade inget befintligt konto kopplat till din e-post.
                  Skapa ett nytt konto nedan — det tar bara någon minut.
                </p>
                <button
                  onClick={() => setShowRegistration(true)}
                  className="px-6 py-3 text-sm font-semibold tracking-wider
                    uppercase text-white rounded"
                  style={{ background: "var(--navy)" }}>
                  Skapa nytt konto
                </button>
                <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
                  Har du ett konto men med en annan e-post?{" "}
                  <a href="mailto:info@kylutbildningen.se"
                    className="underline" style={{ color: "#1A5EA8" }}>
                    Kontakta oss
                  </a>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                  Välj företag
                </h2>
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
                            {company.isContactPerson ? "Kontaktperson" : "Deltagare"}
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
                      personData ? "Gå vidare" : `Fortsätt med ${selected.customerName}`
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
