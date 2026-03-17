import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { verifyEmailOnCustomer } from "@/lib/eduadmin/verify-contact";
import { getCustomerWithContacts } from "@/lib/eduadmin/customers";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Kundnummer krävs" },
        { status: 400 },
      );
    }

    // Re-verify server-side (never trust client alone)
    const verification = await verifyEmailOnCustomer(user.email!, customerId);

    if (!verification.verified || !verification.isContactPerson) {
      return NextResponse.json(
        { error: "Din e-post kunde inte verifieras som kontaktperson" },
        { status: 403 },
      );
    }

    // Get company details
    const customer = await getCustomerWithContacts(customerId);

    // Determine role: first admin for this company becomes company_admin
    const { data: existingAdmin } = await supabase
      .from("company_memberships")
      .select("id")
      .eq("edu_customer_id", customerId)
      .eq("role", "company_admin")
      .limit(1)
      .single();

    const role = existingAdmin ? "contact_person" : "company_admin";

    // Upsert membership
    const { data: membership, error } = await supabase
      .from("company_memberships")
      .upsert(
        {
          user_id: user.id,
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
        { error: "Kunde inte skapa koppling" },
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
