import { NextRequest, NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";

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
  Participants?: Array<{
    ParticipantId: number;
    PersonId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Canceled: boolean;
  }>;
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!personId || !customerId || customerId === "null" || personId === "null") {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    const pid = parseInt(personId);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Fetch only future bookings for this customer with both Event and Participants
    // Date-filtering server-side keeps the result set small
    const data = await eduAdminFetch<{ value: EduAdminBooking[] }>("/v1/odata/Bookings", {
      $filter: `CustomerId eq ${customerId} and Event/StartDate ge ${today}`,
      $expand: "Event,Participants",
      $top: "50",
    });

    // Filter client-side to bookings where this person is an active participant
    const bookings = (data.value ?? []).filter((b) =>
      (b.Participants ?? []).some((p) => p.PersonId === pid && !p.Canceled),
    );

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: `Kunde inte hämta dina kurser: ${String(error)}` }, { status: 500 });
  }
}
