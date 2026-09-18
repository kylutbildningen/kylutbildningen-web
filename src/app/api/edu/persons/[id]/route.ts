import { NextResponse } from "next/server";
import { updatePerson, deletePerson } from "@/lib/eduadmin/persons";
import { removePersonFromSupabase } from "@/lib/supabase-persons";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireMembership, STAFF_ROLES } from "@/lib/auth/api-guard";
import { isParticipant } from "@/lib/auth/permissions";

/** Check that the person belongs to the given customer. */
async function personBelongsToCustomer(personId: number, customerId: number) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("persons")
    .select("edu_person_id")
    .eq("edu_person_id", personId)
    .eq("edu_customer_id", customerId)
    .maybeSingle();
  return !!data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const personId = parseInt(id);

  try {
    const body = await request.json();

    const guard = await requireMembership(body.customerId);
    if ("error" in guard) return guard.error;
    const { customerId, membership } = guard;

    if (isParticipant(membership.role)) {
      // Participants may only edit themselves, and not their contact-person status
      if (personId !== membership.edu_contact_id) {
        return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
      }
      delete body.isContactPerson;
    } else if (!(await personBelongsToCustomer(personId, customerId))) {
      return NextResponse.json({ error: "Personen hittades inte" }, { status: 404 });
    }

    // 1. Update in EduAdmin
    await updatePerson(personId, body);

    // 2. Reflect change in Supabase — only update fields that were sent
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

    const supabase = createSupabaseAdmin();
    await supabase
      .from("persons")
      .update(supabaseUpdates)
      .eq("edu_person_id", personId)
      .eq("edu_customer_id", customerId);

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

  const { searchParams } = new URL(request.url);
  const guard = await requireMembership(searchParams.get("customerId"), STAFF_ROLES);
  if ("error" in guard) return guard.error;
  const { customerId } = guard;

  if (!(await personBelongsToCustomer(personId, customerId))) {
    return NextResponse.json({ error: "Personen hittades inte" }, { status: 404 });
  }

  try {
    await deletePerson(personId);
    return NextResponse.json({ success: true });
  } catch (error) {
    // EduAdmin doesn't support DELETE — still remove from Supabase
    await removePersonFromSupabase(personId, customerId).catch(() => {});

    console.error("Failed to delete person:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte ta bort" },
      { status: 500 },
    );
  }
}
