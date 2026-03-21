"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { formatCompactDateRange } from "@/lib/format";
import { CalendarIcon, MapPinIcon, LoaderIcon, ArrowRightIcon, XIcon } from "@/components/icons";

interface MyBooking {
  BookingId: number;
  EventId: number;
  CourseName: string;
  Event?: {
    EventId: number;
    StartDate: string;
    EndDate: string;
    City: string;
    CourseTemplateId: number;
  };
  Participants?: Array<{
    ParticipantId: number;
    PersonId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Canceled: boolean;
  }>;
  Customer?: { CustomerId: number; CustomerName: string };
  ContactPerson?: { PersonId: number };
  PaymentMethodId: number;
}

interface AvailableEvent {
  EventId: number;
  StartDate: string;
  EndDate: string;
  City: string;
  MaxParticipantNumber: number;
  NumberOfBookedParticipants: number;
}

interface PersonRecord {
  edu_person_id: number;
  edu_customer_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  civic_registration_number: string | null;
}

export default function MinaKurserPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [person, setPerson] = useState<PersonRecord | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobile: "",
    civicRegistrationNumber: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Move state
  const [movingBooking, setMovingBooking] = useState<MyBooking | null>(null);
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const loadBookings = useCallback(async (personRecord: PersonRecord) => {
    const res = await fetch(
      `/api/edu/bookings/mine?personId=${personRecord.edu_person_id}&customerId=${personRecord.edu_customer_id}`,
    );
    if (res.ok) {
      const data = await res.json() as MyBooking[];
      setBookings(data);
    } else {
      setError("Kunde inte hämta dina kurser");
    }
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/logga-in"); return; }
      setUserEmail(user.email ?? "");

      const { data: personData } = await supabase
        .from("persons")
        .select("edu_person_id,edu_customer_id,first_name,last_name,email,phone,mobile,civic_registration_number")
        .eq("email", user.email)
        .limit(1)
        .single();

      if (!personData) {
        setError("Du är inte registrerad som deltagare hos något företag");
        setLoading(false);
        return;
      }

      const typedPerson = personData as PersonRecord;
      setPerson(typedPerson);

      // Pre-fill profile form from person record
      setProfileForm({
        firstName: typedPerson.first_name || "",
        lastName: typedPerson.last_name || "",
        email: typedPerson.email || "",
        phone: typedPerson.phone || "",
        mobile: typedPerson.mobile || "",
        civicRegistrationNumber: typedPerson.civic_registration_number || "",
      });

      await loadBookings(typedPerson);
      setLoading(false);
    }
    init();
  }, [router, loadBookings]);

  async function handleSaveProfile() {
    if (!person) return;
    setSavingProfile(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/persons/${person.edu_person_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileForm,
          customerId: person.edu_customer_id,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      // Update local person record with new values
      setPerson((prev) =>
        prev
          ? {
              ...prev,
              first_name: profileForm.firstName,
              last_name: profileForm.lastName,
              phone: profileForm.phone || null,
              mobile: profileForm.mobile || null,
              civic_registration_number: profileForm.civicRegistrationNumber || null,
            }
          : prev,
      );
      setSuccess("Dina uppgifter har uppdaterats");
      setEditingProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte spara");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCancelParticipant(booking: MyBooking, participantId: number, participantName: string) {
    if (!confirm(`Vill du avboka dig från ${booking.CourseName}?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/bookings/${booking.BookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancelParticipant",
          participantId,
          participantName,
          customerId: booking.Customer?.CustomerId,
          fromEventId: booking.EventId,
          actorEmail: userEmail,
        }),
      });
      const data = await res.json() as { error?: string; bookingDeleted?: boolean };
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Du har avbokats från ${booking.CourseName}`);
      if (person) await loadBookings(person);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte avboka");
    } finally {
      setActionLoading(false);
    }
  }

  async function startMove(booking: MyBooking) {
    if (!booking.Event?.CourseTemplateId) return;
    setMovingBooking(booking);
    setLoadingEvents(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/events?courseTemplateId=${booking.Event.CourseTemplateId}`);
      if (res.ok) {
        const events = await res.json() as AvailableEvent[];
        setAvailableEvents(
          events.filter(e =>
            e.EventId !== booking.EventId &&
            new Date(e.StartDate) > new Date() &&
            e.NumberOfBookedParticipants < e.MaxParticipantNumber,
          ),
        );
      }
    } catch { /* ignore */ }
    setLoadingEvents(false);
  }

  async function handleMove(newEventId: number) {
    if (!movingBooking || !person) return;
    const myParticipant = (movingBooking.Participants ?? []).find(
      p => p.PersonId === person.edu_person_id && !p.Canceled,
    );
    if (!myParticipant) return;

    const participantName = `${myParticipant.FirstName} ${myParticipant.LastName}`;
    if (!confirm(`Flytta dig till nytt kurstillfälle? Bekräftelsemejl skickas automatiskt.`)) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/edu/bookings/${movingBooking.BookingId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moveParticipant",
          participantId: myParticipant.ParticipantId,
          personId: myParticipant.PersonId,
          newEventId,
          customerId: movingBooking.Customer?.CustomerId,
          contactPersonId: movingBooking.ContactPerson?.PersonId,
          paymentMethodId: movingBooking.PaymentMethodId,
          participantName,
          fromEventId: movingBooking.EventId,
          actorEmail: userEmail,
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Du har flyttats till nytt kurstillfälle. Bekräftelsemejl skickat.`);
      setMovingBooking(null);
      await loadBookings(person);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte flytta");
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
          <span className="ml-3 text-sm" style={{ color: "var(--slate-light)" }}>Hämtar dina kurser...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--warm-white)" }}>
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a href="/dashboard" className="mb-4 inline-block text-sm font-medium" style={{ color: "var(--frost)" }}>
          ← Dashboard
        </a>
        <h1 className="mb-8 text-2xl" style={{ fontFamily: "var(--font-serif)", color: "var(--slate-deep)" }}>
          Mina kurser
        </h1>

        {/* Profile edit card */}
        {person && (
          <div className="mb-8 rounded-xl border bg-white p-5" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--slate-deep)" }}>
                Mina uppgifter
              </h2>
              {!editingProfile && (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ borderColor: "var(--frost)", color: "var(--frost)" }}
                >
                  Redigera
                </button>
              )}
            </div>

            {!editingProfile ? (
              <div className="space-y-1 text-sm" style={{ color: "var(--slate-light)" }}>
                <p>
                  <span className="font-medium" style={{ color: "var(--slate-deep)" }}>
                    {person.first_name} {person.last_name}
                  </span>
                </p>
                {person.email && <p>{person.email}</p>}
                {(person.phone || person.mobile) && (
                  <p>{person.phone || person.mobile}</p>
                )}
                {person.civic_registration_number && (
                  <p>Personnummer: {person.civic_registration_number}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      Förnamn
                    </label>
                    <input
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                      className="form-input"
                      placeholder="Anna"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      Efternamn
                    </label>
                    <input
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="form-input"
                      placeholder="Svensson"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      E-post (kan ej ändras)
                    </label>
                    <input
                      value={profileForm.email}
                      readOnly
                      className="form-input opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      Telefon
                    </label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      className="form-input"
                      placeholder="070-123 45 67"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      Mobiltelefon
                    </label>
                    <input
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm((f) => ({ ...f, mobile: e.target.value }))}
                      className="form-input"
                      placeholder="070-123 45 67"
                      type="tel"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--slate-light)" }}>
                      Personnummer
                    </label>
                    <input
                      value={profileForm.civicRegistrationNumber}
                      onChange={(e) => setProfileForm((f) => ({ ...f, civicRegistrationNumber: e.target.value }))}
                      className="form-input"
                      placeholder="ÅÅMMDD-XXXX"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    style={{ borderColor: "var(--border)", color: "var(--slate-light)" }}
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--frost)" }}
                  >
                    {savingProfile ? <><LoaderIcon className="animate-spin" /> Sparar...</> : "Spara"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--danger)", backgroundColor: "#fef2f2", color: "var(--danger)" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--success)", backgroundColor: "#ecfdf5", color: "var(--success)" }}>
            {success}
          </div>
        )}

        {bookings.length === 0 && !error ? (
          <div className="py-16 text-center">
            <p style={{ color: "var(--slate-light)" }}>Du har inga kommande kurser.</p>
            <a href="/kurser" className="mt-4 inline-block text-sm font-medium underline" style={{ color: "var(--frost)" }}>
              Se alla kurser
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const myParticipant = (b.Participants ?? []).find(
                p => person && p.PersonId === person.edu_person_id && !p.Canceled,
              );
              const dateStr = b.Event?.StartDate && b.Event?.EndDate
                ? formatCompactDateRange(b.Event.StartDate, b.Event.EndDate)
                : "—";
              const isMoving = movingBooking?.BookingId === b.BookingId;

              return (
                <div
                  key={b.BookingId}
                  className="rounded-xl border bg-white p-5"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium" style={{ color: "var(--slate-deep)" }}>
                        {b.CourseName}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm" style={{ color: "var(--slate-light)" }}>
                        <span className="flex items-center gap-1.5"><CalendarIcon />{dateStr}</span>
                        {b.Event?.City && (
                          <span className="flex items-center gap-1.5"><MapPinIcon />{b.Event.City.trim()}</span>
                        )}
                      </div>
                      {myParticipant && (
                        <p className="mt-1 text-xs" style={{ color: "var(--slate-light)" }}>
                          {myParticipant.FirstName} {myParticipant.LastName}
                        </p>
                      )}
                    </div>
                    {myParticipant && (
                      <div className="ml-4 flex shrink-0 gap-2">
                        <button
                          onClick={() => startMove(b)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ borderColor: "var(--frost)", color: "var(--frost)" }}
                        >
                          <ArrowRightIcon /> Flytta
                        </button>
                        <button
                          onClick={() => handleCancelParticipant(
                            b,
                            myParticipant.ParticipantId,
                            `${myParticipant.FirstName} ${myParticipant.LastName}`,
                          )}
                          disabled={actionLoading}
                          className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                          style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
                        >
                          <XIcon /> Avboka
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Move panel */}
                  {isMoving && (
                    <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--frost)", backgroundColor: "var(--frost-light)" }}>
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold" style={{ color: "var(--frost-dark)" }}>
                          Välj nytt kurstillfälle
                        </h4>
                        <button onClick={() => setMovingBooking(null)} className="p-1" style={{ color: "var(--slate-light)" }}>
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
                                onClick={() => handleMove(e.EventId)}
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
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
