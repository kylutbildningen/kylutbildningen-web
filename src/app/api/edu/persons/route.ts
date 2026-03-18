import { NextRequest, NextResponse } from "next/server";
import { getPersonsForCustomer, createPerson } from "@/lib/eduadmin/persons";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  try {
    const persons = await getPersonsForCustomer(parseInt(customerId));
    return NextResponse.json(persons);
  } catch (error) {
    console.error("Failed to fetch persons:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta personer" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const person = await createPerson(body);
    return NextResponse.json(person);
  } catch (error) {
    console.error("Failed to create person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte skapa person" },
      { status: 500 },
    );
  }
}
