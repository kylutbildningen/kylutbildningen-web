import { NextRequest, NextResponse } from "next/server";
import { createPerson } from "@/lib/eduadmin/persons";
import { getPersonsFromSupabase, upsertPerson } from "@/lib/supabase-persons";
import { requireMembership, STAFF_ROLES } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  const guard = await requireMembership(customerId, STAFF_ROLES);
  if ("error" in guard) return guard.error;

  try {
    const persons = await getPersonsFromSupabase(guard.customerId);
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

    const guard = await requireMembership(body.customerId, STAFF_ROLES);
    if ("error" in guard) return guard.error;

    // 1. Create in EduAdmin — get back PersonId
    const created = await createPerson({ ...body, customerId: guard.customerId });

    // 2. Save to Supabase with EduAdmin's PersonId
    await upsertPerson({
      eduPersonId: created.PersonId,
      eduCustomerId: guard.customerId,
      firstName: created.FirstName?.trim() || "",
      lastName: created.LastName?.trim() || "",
      email: created.Email || undefined,
      phone: created.Phone || undefined,
      mobile: created.Mobile || undefined,
      civicRegistrationNumber: created.CivicRegistrationNumber || undefined,
      jobTitle: created.JobTitle || undefined,
      // Use what the user chose — EduAdmin may ignore CreateContactPerson in its response
      isContactPerson: body.isContactPerson ?? created.IsContactPerson ?? false,
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
