"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
    setTimeout(() => {
      window.dispatchEvent(new Event("open-dashboard-modal"));
    }, 100);
  }, [router]);
  return null;
}
