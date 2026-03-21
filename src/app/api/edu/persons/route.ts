import { NextRequest, NextResponse } from "next/server";
import { createPerson } from "@/lib/eduadmin/persons";
import { getPersonsFromSupabase, upsertPerson } from "@/lib/supabase-persons";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  try {
    const persons = await getPersonsFromSupabase(parseInt(customerId));
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

    // 1. Create in EduAdmin — get back PersonId
    const created = await createPerson(body);

    // 2. Save to Supabase with EduAdmin's PersonId
    await upsertPerson({
      eduPersonId: created.PersonId,
      eduCustomerId: created.CustomerId || body.customerId,
      firstName: created.FirstName?.trim() || "",
      lastName: created.LastName?.trim() || "",
      email: created.Email || undefined,
      phone: created.Phone || undefined,
      mobile: created.Mobile || undefined,
      civicRegistrationNumber: created.CivicRegistrationNumber || undefined,
      jobTitle: created.JobTitle || undefined,
      isContactPerson: created.IsContactPerson ?? false,
      canLogin: created.CanLogin ?? false,
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Failed to create person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte skapa person" },
      { status: 500 },
    );
  }
}
