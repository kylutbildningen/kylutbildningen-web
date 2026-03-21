import { NextResponse } from "next/server";
import { updatePerson, deletePerson } from "@/lib/eduadmin/persons";
import { upsertPerson, removePersonFromSupabase } from "@/lib/supabase-persons";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const personId = parseInt(id);

  try {
    const body = await request.json();

    // 1. Update in EduAdmin
    await updatePerson(personId, body);

    // 2. Reflect change in Supabase — customerId must be passed in body
    if (body.customerId) {
      await upsertPerson({
        eduPersonId: personId,
        eduCustomerId: body.customerId,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        mobile: body.mobile,
        civicRegistrationNumber: body.civicRegistrationNumber,
        jobTitle: body.jobTitle,
        isContactPerson: body.isContactPerson,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte uppdatera" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const personId = parseInt(id);

  try {
    await deletePerson(personId);
    return NextResponse.json({ success: true });
  } catch (error) {
    // EduAdmin doesn't support DELETE — still remove from Supabase if customerId given
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    if (customerId) {
      await removePersonFromSupabase(personId, parseInt(customerId)).catch(() => {});
    }

    console.error("Failed to delete person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte ta bort" },
      { status: 500 },
    );
  }
}
