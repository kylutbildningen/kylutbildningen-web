"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { formatPrice } from "@/lib/format";
import {
  CalendarIcon, MapPinIcon, UsersIcon, LoaderIcon, UserIcon,
  TrashIcon, PlusIcon, CheckIcon, XIcon, ArrowRightIcon,
} from "@/components/icons";

interface BookingDetail {
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
  Reference: string;
  CourseName: string;
  Event: {
    EventId: number;
    CourseTemplateId: number;
    StartDate: string;
    EndDate: string;
    City: string;
  } | null;
  Customer: { CustomerId: number; CustomerName: string } | null;
  ContactPerson: { PersonId: number; FirstName: string; LastName: string; Email: string; Phone: string } | null;
  Participants: Array<{
    ParticipantId: number;
    PersonId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    CivicRegistrationNumber: string;
    Canceled: boolean;
  }>;
}

interface AvailableEvent {
  EventId: number;
  StartDate: string;
  EndDate: string;
  City: string;
  MaxParticipantNumber: number;
  NumberOfBookedParticipants: number;
}

export default function BookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Move participant state
  const [movingParticipant, setMovingParticipant] = useState<BookingDetail["Participants"][0] | null>(null);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Add participant
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ firstName: "", lastName: "", email: "", phone: "", civicRegistrationNumber: "" });

  useEffect(() => { loadBooking(); }, [bookingId]);

  async function loadBooking() {
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/logga-in"); return; }

      const stored = sessionStorage.getItem("selected_company");
      const { data: membership } = await supabase
        .from("company_memberships")
        .select("edu_customer_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      const cid = stored ? parseInt(stored) : membership?.edu_customer_id;
      if (!cid) { router.replace("/dashboard"); return; }

      const res = await fetch(`/api/edu/bookings?customerId=${cid}`);
      if (!res.ok) throw new Error("Kunde inte hämta bokningar");
      const bookings: BookingDetail[] = await res.json();
      const found = bookings.find(b => b.BookingId === parseInt(bookingId));
      if (!found) throw new Error("Bokningen hittades inte");
      setBooking(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelParticipant(participant: BookingDetail["Participants"][0]) {
    const name = `${participant.FirstName} ${participant.LastName}`;
    if (!confirm(`Vill du avboka ${name} från denna kurs?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancelParticipant",
          participantId: participant.ParticipantId,
          participantName: `${participant.FirstName} ${participant.LastName}`,
          customerId: booking?.Customer?.CustomerId,
          fromEventId: booking?.EventId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess(`${name} har avbokats`);
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte avboka");
    } finally {
      setActionLoading(false);
    }
  }

  async function startMoveParticipant(participant: BookingDetail["Participants"][0]) {
    if (!booking?.Event?.CourseTemplateId) return;
    setMovingParticipant(participant);
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/events?courseTemplateId=${booking.Event.CourseTemplateId}`);
      if (res.ok) {
        const events: AvailableEvent[] = await res.json();
        setAvailableEvents(
          events.filter(e =>
            e.EventId !== booking.EventId &&
            new Date(e.StartDate) > new Date() &&
            e.NumberOfBookedParticipants < e.MaxParticipantNumber
          ),
        );
      }
    } catch { /* ignore */ }
    setLoadingEvents(false);
  }

  async function handleMoveParticipant(newEventId: number) {
    if (!movingParticipant || !booking) return;
    const name = `${movingParticipant.FirstName} ${movingParticipant.LastName}`;
    if (!confirm(`Flytta ${name} till nytt kurstillfälle? Bekräftelsemejl skickas automatiskt.`)) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moveParticipant",
          participantId: movingParticipant.ParticipantId,
          personId: movingParticipant.PersonId,
          newEventId,
          customerId: booking.Customer?.CustomerId,
          contactPersonId: booking.ContactPerson?.PersonId,
          paymentMethodId: booking.PaymentMethodId,
          participantName: `${movingParticipant.FirstName} ${movingParticipant.LastName}`,
          fromEventId: booking.EventId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`${name} har flyttats till nytt kurstillfälle. Bekräftelsemejl skickat.`);
      setMovingParticipant(null);
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte flytta");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteBooking() {
    if (!confirm("Vill du avboka hela bokningen? Detta kan inte ångras.")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/edu/bookings/${bookingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      router.replace("/dashboard/bokningar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte avboka");
      setActionLoading(false);
    }
  }

  async function handleAddParticipant() {
    if (!newParticipant.firstName || !newParticipant.lastName || !newParticipant.civicRegistrationNumber) {
      setError("Förnamn, efternamn och personnummer krävs");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/bookings/${bookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addParticipants",
          participants: [{
            FirstName: newParticipant.firstName,
            LastName: newParticipant.lastName,
            Email: newParticipant.email,
            Phone: newParticipant.phone,
            CivicRegistrationNumber: newParticipant.civicRegistrationNumber,
          }],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess("Deltagare tillagd");
      setNewParticipant({ firstName: "", lastName: "", email: "", phone: "", civicRegistrationNumber: "" });
      setShowAddParticipant(false);
      await loadBooking();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte lägga till");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <LoaderIcon className="animate-spin" />
          <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>Hämtar bokning...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p style={{ color: "var(--slate-light)" }}>{error || "Bokningen hittades inte"}</p>
          <a href="/dashboard/bokningar" className="mt-4 inline-block text-sm font-medium underline" style={{ color: "var(--frost)" }}>Alla bokningar</a>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const startDate = booking.Event?.StartDate
    ? new Date(booking.Event.StartDate).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";
  const isPast = booking.Event?.StartDate && new Date(booking.Event.StartDate) < new Date();
  const activeParticipants = booking.Participants.filter(p => !p.Canceled);
  const canceledParticipants = booking.Participants.filter(p => p.Canceled);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a href="/dashboard/bokningar" className="mb-4 inline-block text-sm font-medium" style={{ color: "var(--frost)" }}>← Alla bokningar</a>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>{booking.CourseName}</h1>
              <p className="mt-1 text-sm" style={{ color: "var(--slate-light)" }}>Boknings-ID: {booking.BookingId}</p>
            </div>
            <div className="flex gap-1.5">
              {isPast && <span className="badge" style={{ backgroundColor: "#f0f0f0", color: "var(--slate-light)" }}>Avslutad</span>}
              {booking.Paid && <span className="badge badge-available">Betald</span>}
              {booking.Invoiced && <span className="badge badge-few">Fakturerad</span>}
              {!isPast && !booking.Paid && !booking.Invoiced && <span className="badge badge-available">Bekräftad</span>}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>{error}</div>}
        {success && <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--success)", backgroundColor: "#ecfdf5", color: "var(--success)" }}>{success}</div>}

        {/* Event info */}
        <div className="mb-6 rounded-lg border bg-white p-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--slate-light)" }}>
            <span className="flex items-center gap-1.5"><CalendarIcon />{startDate}</span>
            {booking.Event?.City && <span className="flex items-center gap-1.5"><MapPinIcon />{booking.Event.City.trim()}</span>}
            <span className="flex items-center gap-1.5"><UsersIcon />{activeParticipants.length} deltagare</span>
          </div>
          <div className="mt-3 flex gap-6 text-sm">
            <span style={{ color: "var(--slate-light)" }}>Exkl. moms: <strong style={{ color: "var(--slate-deep)" }}>{formatPrice(booking.TotalPriceExVat)}</strong></span>
            <span style={{ color: "var(--slate-light)" }}>Inkl. moms: <strong style={{ color: "var(--slate-deep)" }}>{formatPrice(booking.TotalPriceIncVat)}</strong></span>
          </div>
          {booking.ContactPerson && (
            <div className="mt-3 text-sm" style={{ color: "var(--slate-light)" }}>
              Kontaktperson: <strong style={{ color: "var(--slate-deep)" }}>{booking.ContactPerson.FirstName} {booking.ContactPerson.LastName}</strong> ({booking.ContactPerson.Email})
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
              <UsersIcon /> Deltagare ({activeParticipants.length})
            </h2>
            {!isPast && (
              <button onClick={() => setShowAddParticipant(!showAddParticipant)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--frost)" }}>
                <PlusIcon /> Lägg till deltagare
              </button>
            )}
          </div>

          {/* Add participant form */}
          {showAddParticipant && (
            <div className="mb-3 rounded-lg border bg-white p-4" style={{ borderColor: "var(--border)" }}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <input type="text" value={newParticipant.firstName} onChange={e => setNewParticipant({ ...newParticipant, firstName: e.target.value })} placeholder="Förnamn *" className="form-input text-sm" autoFocus />
                <input type="text" value={newParticipant.lastName} onChange={e => setNewParticipant({ ...newParticipant, lastName: e.target.value })} placeholder="Efternamn *" className="form-input text-sm" />
                <input type="text" value={newParticipant.civicRegistrationNumber} onChange={e => setNewParticipant({ ...newParticipant, civicRegistrationNumber: e.target.value })} placeholder="Personnummer *" className="form-input text-sm" />
                <input type="email" value={newParticipant.email} onChange={e => setNewParticipant({ ...newParticipant, email: e.target.value })} placeholder="E-post" className="form-input text-sm" />
                <input type="tel" value={newParticipant.phone} onChange={e => setNewParticipant({ ...newParticipant, phone: e.target.value })} placeholder="Telefon" className="form-input text-sm" />
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={handleAddParticipant} disabled={actionLoading} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: "var(--frost)" }}>
                  <CheckIcon /> Lägg till
                </button>
                <button onClick={() => setShowAddParticipant(false)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs" style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}>
                  <XIcon /> Avbryt
                </button>
              </div>
            </div>
          )}

          {/* Participant list */}
          <div className="rounded-lg border bg-white" style={{ borderColor: "var(--border)" }}>
            {activeParticipants.map((p, i) => (
              <div key={p.ParticipantId}>
                {i > 0 && <div className="h-px" style={{ backgroundColor: "var(--border)" }} />}
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "var(--frost-light)", color: "var(--frost-dark)" }}>
                      <UserIcon />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium" style={{ color: "var(--slate-deep)" }}>{p.FirstName} {p.LastName}</span>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--slate-light)" }}>
                        {p.Email && <span>{p.Email}</span>}
                        {p.CivicRegistrationNumber && <span>{p.CivicRegistrationNumber}</span>}
                      </div>
                    </div>
                    {!isPast && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startMoveParticipant(p)}
                          disabled={actionLoading}
                          className="rounded px-2 py-1 text-[11px] font-medium transition-colors"
                          style={{ color: "var(--frost)" }}
                          title="Flytta till annat kurstillfälle"
                        >
                          Flytta
                        </button>
                        <button
                          onClick={() => handleCancelParticipant(p)}
                          disabled={actionLoading}
                          className="rounded p-1 transition-colors"
                          style={{ color: "var(--danger)" }}
                          title="Avboka deltagare"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Move panel for this participant */}
                  {movingParticipant?.ParticipantId === p.ParticipantId && (
                    <div className="mt-3 rounded-lg border p-4" style={{ borderColor: "var(--frost)", backgroundColor: "var(--frost-light)" }}>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold" style={{ color: "var(--frost-dark)" }}>
                          Flytta {p.FirstName} {p.LastName} till nytt datum
                        </h4>
                        <button onClick={() => setMovingParticipant(null)} className="p-1" style={{ color: "var(--slate-light)" }}>
                          <XIcon />
                        </button>
                      </div>

                      {loadingEvents ? (
                        <div className="flex items-center gap-2 py-2">
                          <LoaderIcon className="animate-spin" />
                          <span className="text-xs" style={{ color: "var(--slate-light)" }}>Hämtar lediga datum...</span>
                        </div>
                      ) : availableEvents.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--slate-light)" }}>Inga andra datum tillgängliga för denna kurs.</p>
                      ) : (
                        <div className="space-y-2">
                          {availableEvents.map(e => {
                            const date = new Date(e.StartDate).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" });
                            const spots = e.MaxParticipantNumber - e.NumberOfBookedParticipants;
                            return (
                              <button
                                key={e.EventId}
                                onClick={() => handleMoveParticipant(e.EventId)}
                                disabled={actionLoading}
                                className="flex w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm transition-all hover:shadow-sm"
                                style={{ borderColor: "var(--border)" }}
                              >
                                <span className="flex items-center gap-2" style={{ color: "var(--slate-deep)" }}>
                                  <CalendarIcon /> {date} — {e.City?.trim()}
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="text-xs" style={{ color: spots < 3 ? "var(--warning)" : "var(--success)" }}>
                                    {spots} platser
                                  </span>
                                  <ArrowRightIcon />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canceledParticipants.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium" style={{ color: "var(--slate-light)" }}>Avbokade:</p>
              {canceledParticipants.map(p => (
                <span key={p.ParticipantId} className="mr-3 text-xs line-through" style={{ color: "var(--slate-light)" }}>
                  {p.FirstName} {p.LastName}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Delete booking */}
        {!isPast && (
          <button
            onClick={handleDeleteBooking}
            disabled={actionLoading}
            className="w-full rounded-lg border px-5 py-3 text-left text-sm font-medium transition-all hover:bg-red-50"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
          >
            Avboka hela bokningen
          </button>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
