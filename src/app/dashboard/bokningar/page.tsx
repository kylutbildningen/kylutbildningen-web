"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/format";
import { CalendarIcon, MapPinIcon, UsersIcon, LoaderIcon } from "@/components/icons";

interface Booking {
  BookingId: number;
  EventId: number;
  NumberOfParticipants: number;
  TotalPriceExVat: number;
  TotalPriceIncVat: number;
  Created: string;
  Paid: boolean;
  Preliminary: boolean;
  Invoiced: boolean;
  PaymentMethodId: number;
  Notes: string;
  CourseName: string;
  Event: {
    StartDate: string;
    EndDate: string;
    City: string;
    CourseTemplateId: number;
  } | null;
  ContactPerson: { FirstName: string; LastName: string; Email: string } | null;
  Participants: Array<{
    ParticipantId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Canceled: boolean;
  }>;
}

type Tab = "aktuella" | "avslutade" | "avbokade";

function classifyBooking(b: Booking): Tab {
  const activeParticipants = b.Participants.filter(p => !p.Canceled);
  if (activeParticipants.length === 0) return "avbokade";
  const isPast = b.Event?.StartDate && new Date(b.Event.StartDate) < new Date();
  return isPast ? "avslutade" : "aktuella";
}

export default function BookingsPageWrapper() {
  return (
    <Suspense>
      <BookingsPage />
    </Suspense>
  );
}

function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("aktuella");

  useEffect(() => {
    async function load() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/logga-in"); return; }

      const stored = sessionStorage.getItem("selected_company");
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("edu_customer_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const cid = stored ? parseInt(stored) : membership?.edu_customer_id;
      if (!cid) { router.replace("/dashboard"); return; }

      const res = await fetch(`/api/edu/bookings?customerId=${cid}`);
      if (res.ok) setBookings(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "aktuella", label: "Aktuella" },
    { key: "avslutade", label: "Avslutade" },
    { key: "avbokade", label: "Avbokade" },
  ];

  const counts = {
    aktuella: bookings.filter(b => classifyBooking(b) === "aktuella").length,
    avslutade: bookings.filter(b => classifyBooking(b) === "avslutade").length,
    avbokade: bookings.filter(b => classifyBooking(b) === "avbokade").length,
  };

  const visible = bookings.filter(b => classifyBooking(b) === tab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <a href="/dashboard" className="mb-4 inline-block text-sm font-medium" style={{ color: "var(--frost)" }}>
          ← Dashboard
        </a>
        <h1 className="mb-6 text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
          Bokningar
        </h1>

        {sessionId && (
          <div className="mb-6 p-4 rounded-lg flex items-center gap-3"
            style={{ background: '#F0F5FF', border: '1px solid #1A5EA8' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#1A5EA8" strokeWidth="2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>
                Bokning bekräftad!
              </p>
              <p className="text-xs" style={{ color: '#1A5EA8' }}>
                Kvitto har skickats till din e-postadress.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border p-1" style={{ borderColor: "var(--border)", backgroundColor: "#fff" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? "var(--frost-light)" : "transparent",
                color: tab === t.key ? "var(--frost-dark)" : "var(--slate-light)",
              }}
            >
              {t.label}
              {counts[t.key] > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: tab === t.key ? "var(--frost)" : "var(--border)",
                    color: tab === t.key ? "#fff" : "var(--slate-light)",
                  }}
                >
                  {counts[t.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderIcon className="animate-spin" />
            <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>Hämtar bokningar från EduAdmin...</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ color: "var(--slate-light)" }}>
              {tab === "aktuella" ? "Inga aktiva bokningar." : tab === "avbokade" ? "Inga avbokade bokningar." : "Inga avslutade kurser."}
            </p>
            {tab === "aktuella" && (
              <Link href="/kurser" className="mt-4 inline-block text-sm font-medium underline" style={{ color: "var(--frost)" }}>
                Boka en kurs
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((b) => {
              const startDate = b.Event?.StartDate
                ? new Date(b.Event.StartDate).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const activeParticipants = b.Participants.filter(p => !p.Canceled);
              const isPast = b.Event?.StartDate && new Date(b.Event.StartDate) < new Date();
              const isCancelled = activeParticipants.length === 0;

              return (
                <Link
                  key={b.BookingId}
                  href={`/dashboard/bokningar/${b.BookingId}`}
                  className="block rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: "var(--border)", opacity: (isPast || isCancelled) ? 0.75 : 1 }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-medium" style={{ color: "var(--slate-deep)" }}>
                        {b.CourseName}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm" style={{ color: "var(--slate-light)" }}>
                        <span className="flex items-center gap-1.5"><CalendarIcon />{startDate}</span>
                        {b.Event?.City && <span className="flex items-center gap-1.5"><MapPinIcon />{b.Event.City.trim()}</span>}
                        <span className="flex items-center gap-1.5"><UsersIcon />{activeParticipants.length} deltagare</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {b.TotalPriceExVat > 0 && (
                        <span className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                          {formatPrice(b.TotalPriceExVat)}
                        </span>
                      )}
                      <div className="mt-1 flex flex-wrap justify-end gap-1.5">
                        {isCancelled && <span className="badge" style={{ backgroundColor: "#fef2f2", color: "var(--danger)" }}>Avbokad</span>}
                        {!isCancelled && isPast && <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "var(--slate-light)" }}>Avslutad</span>}
                        {!isCancelled && b.Paid && <span className="badge badge-available">Betald</span>}
                        {!isCancelled && b.Invoiced && <span className="badge badge-few">Fakturerad</span>}
                        {!isCancelled && b.Preliminary && <span className="badge badge-few">Preliminär</span>}
                        {!isCancelled && !b.Paid && !b.Invoiced && !b.Preliminary && !isPast && (
                          <span className="badge badge-available">Bekräftad</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
