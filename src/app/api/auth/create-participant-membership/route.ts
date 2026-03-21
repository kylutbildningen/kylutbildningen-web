import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

/**
 * Auto-create a participant membership for a user whose email
 * matches a person record in the Supabase persons table.
 * Called from the auth callback when a user has no membership.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const { userId, email } = await request.json();
    if (!userId || !email) {
      return NextResponse.json({ error: "userId och email krävs" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the JWT
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Ogiltig session" }, { status: 401 });
    }

    // Find person record by email
    const { data: person } = await supabaseAdmin
      .from("persons")
      .select("edu_person_id, edu_customer_id")
      .eq("email", email.toLowerCase())
      .limit(1)
      .single();

    if (!person) {
      return NextResponse.json({ found: false });
    }

    // Get company name for the membership
    const { data: existingMembership } = await supabaseAdmin
      .from("company_memberships")
      .select("company_name, org_number")
      .eq("edu_customer_id", person.edu_customer_id)
      .limit(1)
      .single();

    const companyName = existingMembership?.company_name ?? `Kund ${person.edu_customer_id}`;

    // Create participant membership
    const { data: membership, error } = await supabaseAdmin
      .from("company_memberships")
      .upsert(
        {
          user_id: userId,
          edu_customer_id: person.edu_customer_id,
          edu_contact_id: person.edu_person_id,
          company_name: companyName,
          org_number: existingMembership?.org_number ?? null,
          role: "participant",
          is_contact_person: false,
        },
        { onConflict: "user_id,edu_customer_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ found: true, membership });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
