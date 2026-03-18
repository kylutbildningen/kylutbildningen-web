import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/eduadmin";
import { eduAdminFetch } from "@/lib/eduadmin/client";

export const revalidate = 60;

interface ODataResponse<T> { value: T[] }

export async function GET(request: NextRequest) {
  const courseTemplateId = request.nextUrl.searchParams.get("courseTemplateId");

  // If courseTemplateId is provided, return raw events for that course
  if (courseTemplateId) {
    try {
      const data = await eduAdminFetch<ODataResponse<Record<string, unknown>>>(
        "/v1/odata/Events",
        {
          $filter: `CourseTemplateId eq ${courseTemplateId} and StartDate ge ${new Date().toISOString()}`,
          $select: "EventId,StartDate,EndDate,City,MaxParticipantNumber,NumberOfBookedParticipants",
          $orderby: "StartDate asc",
        },
      );
      return NextResponse.json(data.value);
    } catch (error) {
      console.error("Failed to fetch events for course:", error);
      return NextResponse.json([], { status: 200 });
    }
  }

  // Default: return all upcoming events as EventCard[]
  try {
    const events = await getUpcomingEvents();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kurser. Försök igen senare." },
      { status: 500 },
    );
  }
}
