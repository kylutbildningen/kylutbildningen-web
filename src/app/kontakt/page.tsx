"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function KontaktPage() {
  const router = useRouter();

  useEffect(() => {
    // Contact is now handled by the chat widget — open it and go home
    window.dispatchEvent(new Event("open-chat-widget"));
    router.replace("/");
  }, [router]);

  return null;
}
