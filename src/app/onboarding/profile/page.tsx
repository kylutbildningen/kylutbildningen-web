"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { CheckIcon } from "@/components/icons";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.dispatchEvent(new Event("open-auth-modal-onboarding"));
        router.replace("/");
        return;
      }

      if (user.email) {
        const { data: person } = await supabase
          .from("persons")
          .select("first_name,last_name,phone,mobile")
          .eq("email", user.email)
          .limit(1)
          .single();

        if (person) {
          const name = `${person.first_name || ""} ${person.last_name || ""}`.trim();
          if (name) setFullName(name);
          if (person.phone || person.mobile) setPhone(person.phone || person.mobile || "");
          return;
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) setFullName(profile.full_name);
      if (profile?.phone) setPhone(profile.phone);
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.dispatchEvent(new Event("open-auth-modal-onboarding"));
        router.replace("/");
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: fullName,
          phone,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara profil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(11,31,58,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="px-8 py-10">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {["E-post", "Verifiera", "Företag", "Profil"].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: i < 3 ? "var(--success)" : "var(--frost)",
                      color: "#fff",
                    }}
                  >
                    {i < 3 ? <CheckIcon /> : 4}
                  </div>
                  <span
                    className="hidden text-xs font-medium sm:inline"
                    style={{ color: i === 3 ? "var(--slate-deep)" : "var(--slate-light)" }}
                  >
                    {label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className="h-px w-6"
                    style={{ backgroundColor: i < 3 ? "var(--success)" : "var(--border)" }}
                  />
                )}
              </div>
            ))}
          </div>

          <h1
            className="mb-2 text-center text-2xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}
          >
            Din profil
          </h1>
          <p
            className="mb-8 text-center text-sm"
            style={{ color: "var(--slate-light)" }}
          >
            Kontrollera att uppgifterna stämmer, ändra vid behov och gå vidare.
          </p>

          {error && (
            <div
              className="mb-4 rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--slate-light)" }}
              >
                Namn <span style={{ color: "var(--frost)" }}>*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Anna Svensson"
                className="form-input"
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
                style={{ color: "var(--slate-light)" }}
              >
                Telefon
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070-123 45 67"
                className="form-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
            >
              {loading ? "Sparar..." : "Slutför och gå till dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
