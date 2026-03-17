import { NextResponse } from "next/server";
import { getEvent } from "@/lib/eduadmin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const eventId = parseInt(id, 10);

  if (isNaN(eventId)) {
    return NextResponse.json({ error: "Ogiltigt event-ID" }, { status: 400 });
  }

  try {
    const result = await getEvent(eventId);
    if (!result) {
      return NextResponse.json(
        { error: "Event hittades inte" },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta event. Försök igen senare." },
      { status: 500 },
    );
  }
}
