import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyEmailOnCustomer } from "@/lib/eduadmin/verify-contact";
import { getCustomerWithContacts } from "@/lib/eduadmin/customers";

export async function POST(request: Request) {
  try {
    const { customerId, userId, email } = await request.json();

    if (!customerId || !userId || !email) {
      return NextResponse.json(
        { error: "customerId, userId och email krävs" },
        { status: 400 },
      );
    }

    // Verify the user's token via Authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the JWT token is valid
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Ogiltig session" }, { status: 401 });
    }

    // Re-verify against EduAdmin server-side
    const verification = await verifyEmailOnCustomer(email, customerId);

    if (!verification.verified || !verification.isContactPerson) {
      return NextResponse.json(
        { error: "Din e-post kunde inte verifieras som kontaktperson" },
        { status: 403 },
      );
    }

    // Get company details
    const customer = await getCustomerWithContacts(customerId);

    // Determine role
    const { data: existingAdmin } = await supabaseAdmin
      .from("company_memberships")
      .select("id")
      .eq("edu_customer_id", customerId)
      .eq("role", "company_admin")
      .limit(1)
      .maybeSingle();

    const role = existingAdmin ? "contact_person" : "company_admin";

    // Insert with service_role (bypasses RLS)
    const { data: membership, error } = await supabaseAdmin
      .from("company_memberships")
      .upsert(
        {
          user_id: userId,
          edu_customer_id: customerId,
          edu_contact_id: verification.contactId,
          company_name: customer.CustomerName,
          org_number: customer.OrganisationNumber || null,
          role,
          is_contact_person: true,
        },
        { onConflict: "user_id,edu_customer_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("Membership creation failed:", error);
      return NextResponse.json(
        { error: "Kunde inte skapa koppling: " + error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      membership,
      contactName: verification.contactName,
      companyName: customer.CustomerName,
    });
  } catch (error) {
    console.error("Create membership failed:", error);
    return NextResponse.json(
      { error: "Något gick fel. Försök igen." },
      { status: 500 },
    );
  }
}
