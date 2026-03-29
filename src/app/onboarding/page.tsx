"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    window.dispatchEvent(new Event("open-auth-modal-onboarding"));
    router.replace("/");
  }, [router]);

  return null;
}
