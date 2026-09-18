import { NextResponse } from "next/server";
import { logBookingEvent } from "@/lib/booking-events";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireMembership, requireUser } from "@/lib/auth/api-guard";
import { canModifyBooking, canViewCompany } from "@/lib/auth/permissions";

const API_URL = process.env.EDUADMIN_API_BASE ?? "https://api.eduadmin.se";
const API_USER = process.env.EDUADMIN_USERNAME ?? "";
const API_PASS = process.env.EDUADMIN_PASSWORD ?? "";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "password", username: API_USER, password: API_PASS }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000;
  return cachedToken!;
}

interface EduBooking {
  PaymentMethodId: number;
  Customer?: { CustomerId: number };
  ContactPerson?: { PersonId: number };
  Participants?: Array<{ ParticipantId: number; PersonId: number; Canceled: boolean }>;
}

/**
 * Load the booking from EduAdmin and verify the logged-in user is a member
 * of the company that owns it. All actor/customer data comes from here —
 * never from the request body.
 */
async function authorizeBooking(id: string) {
  if (!/^\d+$/.test(id)) {
    return { error: NextResponse.json({ error: "Ogiltigt boknings-ID" }, { status: 400 }) };
  }
  // Reject anonymous callers before touching EduAdmin
  const auth = await requireUser();
  if ("error" in auth) return auth;

  const token = await getToken();
  const res = await fetch(
    `${API_URL}/v1/odata/Bookings(${id})?$expand=Customer,ContactPerson,Participants`,
    { headers: { Authorization: `bearer ${token}` } },
  );
  if (!res.ok) {
    return { error: NextResponse.json({ error: "Bokningen hittades inte" }, { status: 404 }) };
  }
  const booking = await res.json() as EduBooking;

  const guard = await requireMembership(booking.Customer?.CustomerId);
  if ("error" in guard) return guard;

  return {
    token,
    booking,
    customerId: guard.customerId,
    membership: guard.membership,
    actorEmail: guard.user.email,
    actorUserId: guard.user.id,
  };
}

function forbidden() {
  return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
}

// PATCH — update booking notes/reference
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await authorizeBooking(id);
    if ("error" in auth) return auth.error;
    if (!canViewCompany(auth.membership.role)) return forbidden();

    const body = await request.json() as { Notes?: string; Reference?: string };
    const updates: Record<string, unknown> = {};
    if (body.Notes !== undefined) updates.Notes = body.Notes;
    if (body.Reference !== undefined) updates.Reference = body.Reference;

    const res = await fetch(`${API_URL}/v1/Booking/${id}`, {
      method: "PATCH",
      headers: { Authorization: `bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE — cancel entire booking
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await authorizeBooking(id);
    if ("error" in auth) return auth.error;
    if (!canViewCompany(auth.membership.role)) return forbidden();

    const res = await fetch(`${API_URL}/v1/Booking/${id}`, {
      method: "DELETE",
      headers: { Authorization: `bearer ${auth.token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }
    // Mark as cancelled in Supabase
    const supabase = createSupabaseAdmin();
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("booking_number", id);

    // Fire-and-forget logging
    logBookingEvent({
      eduCustomerId: auth.customerId,
      bookingId: id,
      action: "cancelled_booking",
      actorEmail: auth.actorEmail,
      actorUserId: auth.actorUserId,
    }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST — add participants or cancel participant
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json() as {
    action: string;
    participantId?: number;
    participants?: unknown[];
    newEventId?: number;
    participantName?: string;
    fromEventId?: number;
  };

  try {
    const auth = await authorizeBooking(id);
    if ("error" in auth) return auth.error;
    const { token, booking, membership } = auth;
    const isStaff = canViewCompany(membership.role);

    // Participant being cancelled/moved must belong to this booking, and
    // non-staff may only act on themselves.
    const targetParticipant = body.participantId
      ? booking.Participants?.find((p) => p.ParticipantId === body.participantId)
      : undefined;
    if (body.participantId) {
      if (!targetParticipant) {
        return NextResponse.json({ error: "Deltagaren finns inte på bokningen" }, { status: 404 });
      }
      if (!canModifyBooking(membership.role, targetParticipant.PersonId === membership.edu_contact_id)) {
        return forbidden();
      }
    }

    // Cancel a participant
    if (body.action === "cancelParticipant" && targetParticipant) {
      const res = await fetch(`${API_URL}/v1/Participant/${body.participantId}/Cancel`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }

      // Check if any active participants remain — if not, delete the whole booking
      let bookingDeleted = false;
      try {
        const bookingRes = await fetch(
          `${API_URL}/v1/odata/Bookings(${id})?$expand=Participants`,
          { headers: { Authorization: `bearer ${token}` } },
        );
        if (bookingRes.ok) {
          const booking = await bookingRes.json();
          const activeLeft = (booking.Participants ?? []).filter(
            (p: { Canceled: boolean }) => !p.Canceled,
          ).length;
          if (activeLeft === 0) {
            await fetch(`${API_URL}/v1/Booking/${id}`, {
              method: "DELETE",
              headers: { Authorization: `bearer ${token}` },
            });
            // Mark as cancelled in Supabase
            const supabase = createSupabaseAdmin();
            await supabase
              .from("bookings")
              .update({ status: "cancelled" })
              .eq("booking_number", id);
            bookingDeleted = true;
          }
        }
      } catch { /* ignore — participant is already cancelled */ }

      // Fire-and-forget logging
      logBookingEvent({
        eduCustomerId: auth.customerId,
        bookingId: id,
        participantId: body.participantId,
        participantName: body.participantName,
        action: bookingDeleted ? "cancelled_booking" : "cancelled_participant",
        fromEventId: body.fromEventId,
        actorEmail: auth.actorEmail,
        actorUserId: auth.actorUserId,
      }).catch(() => {});
      return NextResponse.json({ success: true, bookingDeleted });
    }

    // Add participants
    if (body.action === "addParticipants" && body.participants) {
      if (!isStaff) return forbidden();
      const res = await fetch(`${API_URL}/v1/Booking/${id}/Participants`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ Participants: body.participants }),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }
      // Fire-and-forget logging
      logBookingEvent({
        eduCustomerId: auth.customerId,
        bookingId: id,
        participantName: body.participantName,
        action: "added_participant",
        actorEmail: auth.actorEmail,
        actorUserId: auth.actorUserId,
      }).catch(() => {});
      return NextResponse.json({ success: true });
    }

    // Move single participant to a new event
    // 1. Cancel participant on current booking
    // 2. Create new booking on new event with just this participant
    if (body.action === "moveParticipant" && targetParticipant && body.newEventId) {
      // Cancel participant from current booking
      const cancelRes = await fetch(`${API_URL}/v1/Participant/${body.participantId}/Cancel`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!cancelRes.ok) {
        const text = await cancelRes.text();
        return NextResponse.json({ error: `Kunde inte avboka deltagare: ${text}` }, { status: 500 });
      }

      // Create new booking on new event with this person
      const newBooking: Record<string, unknown> = {
        EventId: body.newEventId,
        PaymentMethodId: booking.PaymentMethodId || 1,
        Customer: { CustomerId: auth.customerId },
        ContactPerson: booking.ContactPerson?.PersonId
          ? { PersonId: booking.ContactPerson.PersonId }
          : undefined,
        Participants: [{ PersonId: targetParticipant.PersonId }],
        SendConfirmationEmail: {
          SendToCustomerContact: true,
          SendToParticipants: true,
        },
      };

      const createRes = await fetch(`${API_URL}/v1/Booking`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        return NextResponse.json({ error: `Kunde inte skapa ny bokning: ${text}` }, { status: 500 });
      }
      const newResult = await createRes.json() as { BookingId: number };

      // Fire-and-forget logging
      logBookingEvent({
        eduCustomerId: auth.customerId,
        bookingId: id,
        participantId: body.participantId,
        participantName: body.participantName,
        action: "moved_participant",
        fromEventId: body.fromEventId,
        toEventId: body.newEventId,
        actorEmail: auth.actorEmail,
        actorUserId: auth.actorUserId,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        newBookingId: newResult.BookingId,
      });
    }

    // Move entire booking (all participants) to a new event
    if (body.action === "move" && body.newEventId) {
      if (!isStaff) return forbidden();

      const newBooking = {
        EventId: body.newEventId,
        PaymentMethodId: booking.PaymentMethodId,
        Customer: { CustomerId: booking.Customer?.CustomerId },
        ContactPerson: { PersonId: booking.ContactPerson?.PersonId },
        Participants: (booking.Participants || [])
          .filter((p) => !p.Canceled)
          .map((p) => ({ PersonId: p.PersonId })),
        SendConfirmationEmail: {
          SendToCustomerContact: true,
          SendToParticipants: true,
        },
      };

      const createRes = await fetch(`${API_URL}/v1/Booking`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(newBooking),
      });
      if (!createRes.ok) {
        const text = await createRes.text();
        return NextResponse.json({ error: `Kunde inte skapa ny bokning: ${text}` }, { status: 500 });
      }
      const newResult = await createRes.json() as { BookingId: number };

      await fetch(`${API_URL}/v1/Booking/${id}`, {
        method: "DELETE",
        headers: { Authorization: `bearer ${token}` },
      });

      return NextResponse.json({
        success: true,
        newBookingId: newResult.BookingId,
      });
    }

    return NextResponse.json({ error: "Ogiltig åtgärd" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
