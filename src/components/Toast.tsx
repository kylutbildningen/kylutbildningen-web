"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastData {
  id: number;
  message: string;
  type: "error" | "success";
}

let toastId = 0;

export function showToast(message: string, type: "error" | "success" = "error") {
  window.dispatchEvent(
    new CustomEvent("show-toast", { detail: { id: ++toastId, message, type } })
  );
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const handleToast = useCallback((e: Event) => {
    const { id, message, type } = (e as CustomEvent).detail;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, [handleToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2" style={{ maxWidth: "360px" }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium animate-slide-in"
          style={{
            background: t.type === "error" ? "#fee2e2" : "#ecfdf5",
            color: t.type === "error" ? "#991b1b" : "#065f46",
            border: `1px solid ${t.type === "error" ? "#fca5a5" : "#6ee7b7"}`,
          }}
          onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            {t.type === "error" ? (
              <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
            ) : (
              <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
            )}
          </svg>
          {t.message}
        </div>
      ))}
    </div>
  );
}
