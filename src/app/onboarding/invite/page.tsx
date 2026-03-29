"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<{
    email: string;
    edu_customer_id: number;
    role: string;
  } | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [inviterName, setInviterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError("Ogiltig inbjudningslänk");
        setLoading(false);
        return;
      }

      const supabase = createSupabaseBrowser();

      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (fetchError || !data) {
        setError("Inbjudan har gått ut eller redan använts");
        setLoading(false);
        return;
      }

      setInvitation(data);

      // Get inviter name
      const { data: inviterProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.invited_by)
        .single();
      setInviterName(inviterProfile?.full_name ?? "");

      // Get company name from membership
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("company_name")
        .eq("edu_customer_id", data.edu_customer_id)
        .limit(1)
        .single();
      setCompanyName(membership?.company_name ?? "");

      setLoading(false);
    }

    loadInvitation();
  }, [token]);

  async function handleAccept() {
    if (!invitation) return;
    setAccepting(true);

    try {
      const supabase = createSupabaseBrowser();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?invite=${token}`,
        },
      });

      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte skicka länk");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex-grow flex flex-col" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32 flex-grow">
          <span className="text-sm" style={{ color: "var(--slate-light)" }}>
            Laddar inbjudan...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex-grow flex flex-col"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <SiteHeader />

      <div className="mx-auto max-w-md px-6 py-16 text-center flex-grow">
        {error ? (
          <>
            <h1
              className="mb-3 text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Ogiltig inbjudan
            </h1>
            <p className="mb-6" style={{ color: "var(--slate-light)" }}>
              {error}
            </p>
            <a
              href="/onboarding"
              className="inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--frost)" }}
            >
              Registrera dig istället
            </a>
          </>
        ) : sent ? (
          <>
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
            <p style={{ color: "var(--slate-light)" }}>
              Vi har skickat en inloggningslänk till{" "}
              <strong style={{ color: "var(--slate-deep)" }}>
                {invitation?.email}
              </strong>
              . Klicka på länken för att slutföra.
            </p>
          </>
        ) : (
          <>
            <h1
              className="mb-3 text-2xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--slate-deep)",
              }}
            >
              Du har blivit inbjuden
            </h1>
            <p
              className="mb-8 leading-relaxed"
              style={{ color: "var(--slate-light)" }}
            >
              {inviterName && (
                <>
                  <strong style={{ color: "var(--slate-deep)" }}>
                    {inviterName}
                  </strong>{" "}
                  har bjudit in dig att{" "}
                </>
              )}
              hantera bokningar för{" "}
              <strong style={{ color: "var(--slate-deep)" }}>
                {companyName}
              </strong>
              .
            </p>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="rounded-lg px-8 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, var(--frost) 0%, var(--frost-dark) 100%)",
              }}
            >
              {accepting ? "Skickar..." : "Acceptera inbjudan"}
            </button>
          </>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}
