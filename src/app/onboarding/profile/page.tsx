"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ProfilePage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  useEffect(() => {
    async function check() {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/onboarding");
        return;
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (profile?.full_name) {
        setFullName(profile.full_name);
      }
      if (profile?.phone) {
        setPhone(profile.phone);
      }
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/onboarding");
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
      setError(
        err instanceof Error ? err.message : "Kunde inte spara profil",
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

      <div
        className="border-b bg-white py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto max-w-2xl px-6">
          <StepIndicator currentStep={4} />
        </div>
      </div>

      <div className="mx-auto max-w-md px-6 py-16">
        <h1
          className="mb-2 text-center text-2xl"
          style={{
            fontFamily: "var(--font-serif)",
            color: "var(--slate-deep)",
          }}
        >
          Din profil
        </h1>
        <p
          className="mb-8 text-center text-sm"
          style={{ color: "var(--slate-light)" }}
        >
          Fyll i dina uppgifter för att slutföra registreringen.
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
              background:
                "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
            }}
          >
            {loading ? "Sparar..." : "Slutför och gå till dashboard"}
          </button>
        </form>
      </div>

      <SiteFooter />
    </div>
  );
}
