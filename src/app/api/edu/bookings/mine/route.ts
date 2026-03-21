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
  if (!personId || !customerId) {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    // Get bookings for this customer, expand participants, filter by personId
    const data = await eduAdminFetch<{ value: EduAdminBooking[] }>("/v1/odata/Bookings", {
      $filter: `CustomerId eq ${customerId} and Participants/any(p: p/PersonId eq ${personId})`,
      $expand: "Event,Participants",
      $orderby: "Created desc",
      $top: "50",
    });

    // Only return future bookings where this person is an active participant
    const now = new Date();
    const bookings = (data.value || []).filter((b) => {
      const eventStart = b.Event?.StartDate ? new Date(b.Event.StartDate) : null;
      return eventStart && eventStart > now;
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: "Kunde inte hämta dina kurser" }, { status: 500 });
  }
}
