import { NextRequest, NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";

interface EduAdminParticipant {
  ParticipantId: number;
  PersonId: number;
  BookingId: number;
  Canceled: boolean;
  FirstName: string;
  LastName: string;
  Email: string;
}

interface EduAdminBooking {
  BookingId: number;
  EventId: number;
  CourseName: string;
  PaymentMethodId: number;
  Event?: {
    EventId: number;
    StartDate: string;
    EndDate: string;
    City: string;
    CourseTemplateId: number;
  };
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!personId || !customerId || customerId === "null" || personId === "null") {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    // Step 1: Get this person's active participant records (no expand — fast)
    const participantData = await eduAdminFetch<{ value: EduAdminParticipant[] }>("/v1/odata/Participants", {
      $filter: `PersonId eq ${personId} and Canceled eq false`,
      $top: "50",
    });

    const participants = participantData.value ?? [];
    if (participants.length === 0) return NextResponse.json([]);

    // Step 2: Fetch those bookings with Event expanded, filtered to future only
    const bookingIdFilter = participants
      .map((p) => `BookingId eq ${p.BookingId}`)
      .join(" or ");

    const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const bookingData = await eduAdminFetch<{ value: EduAdminBooking[] }>("/v1/odata/Bookings", {
      $filter: `(${bookingIdFilter})`,
      $expand: "Event",
      $top: "50",
    });

    // Filter to future events client-side
    const futureBookings = (bookingData.value ?? []).filter((b) => {
      const start = b.Event?.StartDate;
      return start && start >= now;
    });

    // Attach participant info to each booking
    const result = futureBookings.map((b) => {
      const participant = participants.find((p) => p.BookingId === b.BookingId);
      return {
        ...b,
        Participants: participant ? [participant] : [],
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: `Kunde inte hämta dina kurser: ${String(error)}` }, { status: 500 });
  }
}
