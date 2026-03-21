import { NextRequest, NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";

interface ODataResponse<T> { value: T[] }

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId");
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!personId || !customerId || customerId === "null" || personId === "null") {
    return NextResponse.json({ error: "personId och customerId krävs" }, { status: 400 });
  }

  try {
    const pid = parseInt(personId);
    const cid = parseInt(customerId);

    // Use same approach as admin bookings: no OData filter (CustomerId is not
    // a filterable property), expand Customer + Participants, filter client-side
    const data = await eduAdminFetch<ODataResponse<Record<string, unknown>>>(
      "/v1/odata/Bookings",
      {
        $expand: [
          "Customer($select=CustomerId,CustomerName)",
          "Participants($select=ParticipantId,PersonId,FirstName,LastName,Email,Canceled)",
        ].join(","),
        $select: "BookingId,EventId,PaymentMethodId",
        $orderby: "Created desc",
        $top: "200",
      },
    );

    // Filter to this customer + this person as active participant
    const matched = (data.value ?? []).filter((b) => {
      const bCustomerId = (b.Customer as { CustomerId?: number })?.CustomerId;
      if (bCustomerId !== cid) return false;
      const participants = (b.Participants ?? []) as Array<{ PersonId: number; Canceled: boolean }>;
      return participants.some((p) => p.PersonId === pid && !p.Canceled);
    });

    // Enrich with Event + CourseName (only for matched bookings — few results)
    const now = new Date();
    const enriched = await Promise.all(
      matched.map(async (b) => {
        try {
          const event = await eduAdminFetch<Record<string, unknown>>(
            `/v1/odata/Events(${b.EventId})`,
            { $select: "EventId,CourseTemplateId,StartDate,EndDate,City" },
          );
          // Skip past events
          const startDate = event.StartDate as string;
          if (startDate && new Date(startDate) < now) return null;

          const courseTemplate = await eduAdminFetch<Record<string, unknown>>(
            `/v1/odata/CourseTemplates(${event.CourseTemplateId})`,
            { $select: "CourseTemplateId,CourseName" },
          );
          return {
            ...b,
            Event: event,
            CourseName: courseTemplate.CourseName ?? "Okänd kurs",
          };
        } catch {
          return null;
        }
      }),
    );

    return NextResponse.json(enriched.filter(Boolean));
  } catch (error) {
    console.error("Failed to fetch participant bookings:", error);
    return NextResponse.json({ error: `Kunde inte hämta dina kurser: ${String(error)}` }, { status: 500 });
  }
}
