"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { LoaderIcon } from "@/components/icons";

interface BookingEvent {
  id: string;
  edu_customer_id: number;
  booking_id: string;
  participant_id: number | null;
  edu_person_id: number | null;
  participant_name: string | null;
  action: string;
  from_event_id: number | null;
  to_event_id: number | null;
  actor_email: string | null;
  actor_user_id: string | null;
  created_at: string;
}

function actionLabel(action: string): string {
  switch (action) {
    case "cancelled_participant": return "Avbokad";
    case "moved_participant": return "Flyttad";
    case "added_participant": return "Tillagd";
    case "cancelled_booking": return "Bokning avbokad";
    default: return action;
  }
}

function actionColor(action: string): string {
  switch (action) {
    case "cancelled_participant": return "var(--danger)";
    case "cancelled_booking": return "var(--danger)";
    case "moved_participant": return "var(--warning)";
    case "added_participant": return "var(--success)";
    default: return "var(--slate-light)";
  }
}

function formatSwedishDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

export default function AktivitetsloggPage() {
  const router = useRouter();
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch(`/api/booking-events?customerId=${cid}`);
      if (res.ok) {
        setEvents(await res.json() as BookingEvent[]);
      } else {
        setError("Kunde inte hämta aktivitetsloggen");
      }
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
          Aktivitetslogg
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoaderIcon className="animate-spin" />
            <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>Hämtar aktiviteter...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center">
            <p style={{ color: "var(--slate-light)" }}>Inga aktiviteter loggade ännu.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {/* Table header */}
            <div
              className="grid grid-cols-[1fr_1fr_auto_1fr] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: "var(--warm-white)", color: "var(--slate-light)", borderBottom: "1px solid var(--border)" }}
            >
              <span>Tidpunkt</span>
              <span>Person</span>
              <span>Händelse</span>
              <span>Utförd av</span>
            </div>

            {events.map((evt, i) => (
              <div key={evt.id}>
                {i > 0 && <div className="h-px" style={{ backgroundColor: "var(--border)" }} />}
                <div className="grid grid-cols-[1fr_1fr_auto_1fr] gap-4 px-5 py-3.5 text-sm items-start">
                  <span style={{ color: "var(--slate-light)" }}>
                    {formatSwedishDateTime(evt.created_at)}
                  </span>
                  <div>
                    <span style={{ color: "var(--slate-deep)" }}>
                      {evt.participant_name ?? "—"}
                    </span>
                    {evt.booking_id && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--slate-light)" }}>
                        Bokning: {evt.booking_id}
                      </div>
                    )}
                    {(evt.from_event_id || evt.to_event_id) && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--slate-light)" }}>
                        {evt.from_event_id && `Från event ${evt.from_event_id}`}
                        {evt.from_event_id && evt.to_event_id && " → "}
                        {evt.to_event_id && `Till event ${evt.to_event_id}`}
                      </div>
                    )}
                  </div>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
                    style={{ color: actionColor(evt.action), backgroundColor: actionColor(evt.action) + "18" }}
                  >
                    {actionLabel(evt.action)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--slate-light)" }}>
                    {evt.actor_email ?? "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
