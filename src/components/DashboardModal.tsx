"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { canViewCompany, isParticipant } from "@/lib/auth/permissions";
import { LoaderIcon } from "@/components/icons";

interface Membership {
  id: string;
  edu_customer_id: number;
  company_name: string;
  org_number: string | null;
  role: string;
  is_contact_person: boolean;
}

export function DashboardModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<number>(0);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setLoading(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    const onOpen = () => handleOpen();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("open-dashboard-modal", onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("open-dashboard-modal", onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleOpen, handleClose, open]);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOpen(false);
        window.dispatchEvent(new Event("open-auth-modal"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      setUserName(profile?.full_name ?? user.email ?? "");

      const { data: mems } = await supabase
        .from("company_memberships")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!mems || mems.length === 0) {
        setOpen(false);
        router.push("/onboarding/company");
        return;
      }

      setMemberships(mems);
      const stored = sessionStorage.getItem("selected_company");
      setSelectedCompany(stored ? parseInt(stored) : mems[0].edu_customer_id);
      setLoading(false);
    }
    load();
  }, [open, router]);

  function handleCompanySelect(cid: number) {
    setSelectedCompany(cid);
    sessionStorage.setItem("selected_company", String(cid));
  }

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  }

  if (!open) return null;

  const current = memberships.find(m => m.edu_customer_id === selectedCompany);
  const role = current?.role ?? "";

  const actions = [
    {
      label: "Bokningar",
      desc: "Se, ändra och flytta era bokningar",
      href: isParticipant(role) ? "/dashboard/mina-kurser" : "/dashboard/bokningar",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      show: true,
    },
    {
      label: "Boka kurs",
      desc: "Se kurstillfällen och boka platser",
      href: "/kurser",
      icon: "M12 6v6m0 0v6m0-6h6m-6 0H6",
      show: true,
    },
    {
      label: "Företag & team",
      desc: "Uppgifter, personer och behörigheter",
      href: "/dashboard/team",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      show: canViewCompany(role),
    },
    {
      label: "Lägg till företag",
      desc: "Koppla ytterligare ett företag",
      href: "/onboarding/company",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      show: canViewCompany(role),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:pt-24"
      style={{ background: "rgba(11,31,58,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden" style={{ background: "var(--warm-white)" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-5" style={{ background: "var(--navy)" }}>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LoaderIcon className="animate-spin text-white" />
            </div>
          ) : (
            <>
              <h2 className="font-condensed font-bold uppercase text-white text-xl leading-none">
                Hej, {userName.split(" ")[0]}
              </h2>
              {current && (
                <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {current.company_name}
                </p>
              )}
              {memberships.length > 1 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {memberships.map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleCompanySelect(m.edu_customer_id)}
                      className="rounded-md px-2.5 py-1 text-[11px] font-medium transition-all"
                      style={{
                        background: m.edu_customer_id === selectedCompany ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                        color: m.edu_customer_id === selectedCompany ? "#fff" : "rgba(255,255,255,0.5)",
                        border: m.edu_customer_id === selectedCompany ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                      }}
                    >
                      {m.company_name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        {!loading && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2.5">
              {actions.filter(a => a.show).map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.href)}
                  className="flex flex-col items-start rounded-lg border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: "var(--border)" }}
                >
                  <svg
                    className="h-5 w-5 mb-2.5"
                    style={{ color: "var(--frost)" }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
                  </svg>
                  <span className="text-sm font-semibold block" style={{ color: "var(--slate-deep)" }}>
                    {action.label}
                  </span>
                  <span className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--slate-light)" }}>
                    {action.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg border px-4 py-2.5 text-xs font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}
            >
              Logga ut
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
