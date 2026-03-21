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
  Booking?: {
    BookingId: number;
    EventId: number;
    CustomerId: number;
    CourseName: string;
    PaymentMethodId: number;
    Event?: {
      EventId: number;
      StartDate: string;
      EndDate: string;
      City: string;
      CourseTemplateId: number;
    };
  };
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!personId || !customerId || customerId === "null" || personId === "null") {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();

    // Query participants by PersonId directly — much faster than fetching all customer bookings
    const data = await eduAdminFetch<{ value: EduAdminParticipant[] }>("/v1/odata/Participants", {
      $filter: `PersonId eq ${personId} and Canceled eq false`,
      $expand: "Booking($expand=Event)",
      $top: "50",
    });

    // Filter to future events only
    const bookings = (data.value || [])
      .filter((p) => {
        const start = p.Booking?.Event?.StartDate;
        return start && new Date(start) > new Date(now);
      })
      .map((p) => ({
        BookingId: p.Booking?.BookingId ?? p.BookingId,
        EventId: p.Booking?.EventId ?? 0,
        CourseName: p.Booking?.CourseName ?? "",
        PaymentMethodId: p.Booking?.PaymentMethodId ?? 0,
        Event: p.Booking?.Event ?? null,
        Participants: [{
          ParticipantId: p.ParticipantId,
          PersonId: p.PersonId,
          FirstName: p.FirstName,
          LastName: p.LastName,
          Email: p.Email,
          Canceled: p.Canceled,
        }],
      }));

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: `Kunde inte hämta dina kurser: ${String(error)}` }, { status: 500 });
  }
}
