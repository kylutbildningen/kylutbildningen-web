"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <a href="/dashboard" className="mb-4 inline-block text-sm font-medium" style={{ color: "var(--frost)" }}>
          ← Dashboard
        </a>
        <h1 className="mb-8 text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
          Bokningar
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderIcon className="animate-spin" />
            <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>Hämtar bokningar från EduAdmin...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ color: "var(--slate-light)" }}>Inga bokningar hittades.</p>
            <Link href="/kurser" className="mt-4 inline-block text-sm font-medium underline" style={{ color: "var(--frost)" }}>
              Boka en kurs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const startDate = b.Event?.StartDate
                ? new Date(b.Event.StartDate).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })
                : "—";
              const activeParticipants = b.Participants.filter(p => !p.Canceled);
              const isPast = b.Event?.StartDate && new Date(b.Event.StartDate) < new Date();

              return (
                <Link
                  key={b.BookingId}
                  href={`/dashboard/bokningar/${b.BookingId}`}
                  className="block rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: "var(--border)", opacity: isPast ? 0.7 : 1 }}
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
                      <span className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                        {formatPrice(b.TotalPriceExVat)}
                      </span>
                      <div className="mt-1 flex gap-1.5">
                        {isPast && <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "var(--slate-light)" }}>Avslutad</span>}
                        {b.Paid && <span className="badge badge-available">Betald</span>}
                        {b.Invoiced && <span className="badge badge-few">Fakturerad</span>}
                        {b.Preliminary && <span className="badge badge-few">Preliminär</span>}
                        {!b.Paid && !b.Invoiced && !b.Preliminary && !isPast && (
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
