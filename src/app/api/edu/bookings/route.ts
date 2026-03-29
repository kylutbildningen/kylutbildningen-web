import { NextRequest, NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";

interface ODataResponse<T> { value: T[] }

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  try {
    const cid = parseInt(customerId);

    // Fetch bookings filtered by customer ID
    const data = await eduAdminFetch<ODataResponse<Record<string, unknown>>>(
      "/v1/odata/Bookings",
      {
        $filter: `CustomerId eq ${cid}`,
        $expand: [
          "Customer($select=CustomerId,CustomerName)",
          "ContactPerson($select=PersonId,FirstName,LastName,Email,Phone)",
          "Participants($select=ParticipantId,PersonId,FirstName,LastName,Email,CivicRegistrationNumber,Canceled,PriceNameId)",
        ].join(","),
        $select: "BookingId,EventId,CustomerId,TotalPriceExVat,TotalPriceIncVat,NumberOfParticipants,Created,Paid,Preliminary,PaymentMethodId,Invoiced,Notes,Reference,Canceled",
        $orderby: "Created desc",
        $top: "500",
      },
    );

    const bookings = data.value || [];

    // Enrich with event/course info (batch-style)
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        try {
          const event = await eduAdminFetch<Record<string, unknown>>(
            `/v1/odata/Events(${b.EventId})`,
            { $select: "EventId,CourseTemplateId,StartDate,EndDate,City,MaxParticipantNumber,NumberOfBookedParticipants" },
          );
          const courseTemplate = await eduAdminFetch<Record<string, unknown>>(
            `/v1/odata/CourseTemplates(${event.CourseTemplateId})`,
            { $select: "CourseTemplateId,CourseName" },
          );
          return { ...b, Event: event, CourseName: courseTemplate.CourseName };
        } catch {
          return { ...b, Event: null, CourseName: "Okänd kurs" };
        }
      }),
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json({ error: "Kunde inte hämta bokningar" }, { status: 500 });
  }
}
