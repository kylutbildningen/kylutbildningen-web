"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "var(--warm-white)" }}
        >
          <p className="text-sm" style={{ color: "var(--slate-light)" }}>
            Loggar in...
          </p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowser();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/logga-in");
        return;
      }

      // Handle invitation acceptance
      if (inviteToken) {
        const { data: invitation } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", inviteToken)
          .is("accepted_at", null)
          .single();

        if (invitation) {
          // Create membership
          await fetch("/api/auth/create-membership", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: invitation.edu_customer_id,
            }),
          });

          // Mark invitation as accepted
          await supabase
            .from("invitations")
            .update({ accepted_at: new Date().toISOString() })
            .eq("id", invitation.id);
        }
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        router.replace("/onboarding/profile");
        return;
      }

      // Check if user has any memberships
      const { data: memberships } = await supabase
        .from("company_memberships")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!memberships || memberships.length === 0) {
        router.replace("/onboarding/company");
        return;
      }

      // All good — go to dashboard
      router.replace("/dashboard");
    }

    handleCallback();
  }, [router, inviteToken]);

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--warm-white)" }}
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--frost)",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-sm" style={{ color: "var(--slate-light)" }}>
          Loggar in...
        </p>
      </div>
    </div>
  );
}
