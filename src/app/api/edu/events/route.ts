import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/eduadmin";

export const revalidate = 60;

export async function GET() {
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
