import { NextResponse } from "next/server";
import { logBookingEvent } from "@/lib/booking-events";

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

// PATCH — update booking (notes, reference, payment method etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const token = await getToken();
    const res = await fetch(`${API_URL}/v1/Booking/${id}`, {
      method: "PATCH",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    const body = await request.json().catch(() => ({})) as {
      customerId?: number;
      actorEmail?: string;
      actorUserId?: string;
    };
    const token = await getToken();
    const res = await fetch(`${API_URL}/v1/Booking/${id}`, {
      method: "DELETE",
      headers: { Authorization: `bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }
    // Fire-and-forget logging
    if (body.customerId) {
      logBookingEvent({
        eduCustomerId: body.customerId,
        bookingId: id,
        action: "cancelled_booking",
        actorEmail: body.actorEmail,
        actorUserId: body.actorUserId,
      }).catch(() => {});
    }
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
    personId?: number;
    customerId?: number;
    contactPersonId?: number;
    paymentMethodId?: number;
    participantName?: string;
    fromEventId?: number;
    actorEmail?: string;
    actorUserId?: string;
  };

  try {
    const token = await getToken();

    // Cancel a participant
    if (body.action === "cancelParticipant" && body.participantId) {
      const res = await fetch(`${API_URL}/v1/Participant/${body.participantId}/Cancel`, {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: text }, { status: res.status });
      }
      // Fire-and-forget logging
      if (body.customerId) {
        logBookingEvent({
          eduCustomerId: body.customerId,
          bookingId: id,
          participantId: body.participantId,
          participantName: body.participantName,
          action: "cancelled_participant",
          fromEventId: body.fromEventId,
          actorEmail: body.actorEmail,
          actorUserId: body.actorUserId,
        }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    // Add participants
    if (body.action === "addParticipants" && body.participants) {
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
      if (body.customerId) {
        logBookingEvent({
          eduCustomerId: body.customerId,
          bookingId: id,
          participantName: body.participantName,
          action: "added_participant",
          actorEmail: body.actorEmail,
          actorUserId: body.actorUserId,
        }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    // Move single participant to a new event
    // 1. Cancel participant on current booking
    // 2. Create new booking on new event with just this participant
    if (body.action === "moveParticipant" && body.participantId && body.newEventId) {
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
        PaymentMethodId: body.paymentMethodId || 1,
        Customer: { CustomerId: body.customerId },
        ContactPerson: body.contactPersonId
          ? { PersonId: body.contactPersonId }
          : undefined,
        Participants: [{ PersonId: body.personId }],
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
      if (body.customerId) {
        logBookingEvent({
          eduCustomerId: body.customerId,
          bookingId: id,
          participantId: body.participantId,
          participantName: body.participantName,
          action: "moved_participant",
          fromEventId: body.fromEventId,
          toEventId: body.newEventId,
          actorEmail: body.actorEmail,
          actorUserId: body.actorUserId,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        newBookingId: newResult.BookingId,
      });
    }

    // Move entire booking (all participants) to a new event
    if (body.action === "move" && body.newEventId) {
      const detailRes = await fetch(`${API_URL}/v1/odata/Bookings(${id})?$expand=Customer,ContactPerson,Participants`, {
        headers: { Authorization: `bearer ${token}` },
      });
      if (!detailRes.ok) {
        return NextResponse.json({ error: "Kunde inte hämta bokning" }, { status: 500 });
      }
      const booking = await detailRes.json() as {
        PaymentMethodId: number;
        Customer?: { CustomerId: number };
        ContactPerson?: { PersonId: number };
        Participants?: Array<{ Canceled: boolean; PersonId: number }>;
      };

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
