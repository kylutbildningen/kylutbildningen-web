import { NextRequest, NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";

interface EduAdminBooking {
  BookingId: number;
  EventId: number;
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
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!personId || !customerId || customerId === "null" || personId === "null") {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    const pid = parseInt(personId);

    // Fetch all bookings for this customer with participants expanded
    const data = await eduAdminFetch<{ value: EduAdminBooking[] }>("/v1/odata/Bookings", {
      $filter: `CustomerId eq ${customerId}`,
      $expand: "Event,Participants",
      $orderby: "Created desc",
      $top: "200",
    });

    // Filter client-side: only bookings where this person is an active participant
    const now = new Date();
    const bookings = (data.value || []).filter((b) => {
      const isParticipant = (b.Participants ?? []).some(
        (p) => p.PersonId === pid && !p.Canceled,
      );
      if (!isParticipant) return false;
      const eventStart = b.Event?.StartDate ? new Date(b.Event.StartDate) : null;
      return eventStart && eventStart > now;
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: "Kunde inte hämta dina kurser" }, { status: 500 });
  }
}
