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

    // 2. Reflect change in Supabase — only update fields that were sent
    if (body.customerId) {
      const supabaseUpdates: Record<string, unknown> = {
        synced_at: new Date().toISOString(),
      };
      if (body.firstName !== undefined) supabaseUpdates.first_name = body.firstName;
      if (body.lastName !== undefined) supabaseUpdates.last_name = body.lastName;
      if (body.email !== undefined) supabaseUpdates.email = body.email || null;
      if (body.phone !== undefined) supabaseUpdates.phone = body.phone || null;
      if (body.mobile !== undefined) supabaseUpdates.mobile = body.mobile || null;
      if (body.civicRegistrationNumber !== undefined) supabaseUpdates.civic_registration_number = body.civicRegistrationNumber || null;
      if (body.jobTitle !== undefined) supabaseUpdates.job_title = body.jobTitle || null;
      if (body.isContactPerson !== undefined) supabaseUpdates.is_contact_person = body.isContactPerson;

      const { createSupabaseAdmin } = await import("@/lib/supabase-admin");
      const supabase = createSupabaseAdmin();
      await supabase
        .from("persons")
        .update(supabaseUpdates)
        .eq("edu_person_id", personId)
        .eq("edu_customer_id", body.customerId);
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
