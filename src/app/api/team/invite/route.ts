import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { verifyEmailOnCustomer } from "@/lib/eduadmin/verify-contact";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { email, role, customerId } = await request.json();

  if (!email || !customerId) {
    return NextResponse.json(
      { error: "E-post och kundnummer krävs" },
      { status: 400 },
    );
  }

  // Verify caller is admin for this company
  const { data: callerMembership } = await supabase
    .from("company_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("edu_customer_id", customerId)
    .single();

  if (!callerMembership || callerMembership.role !== "company_admin") {
    return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  // Verify email exists in EduAdmin for this customer
  const verification = await verifyEmailOnCustomer(email, customerId);

  if (!verification.verified) {
    return NextResponse.json({
      error: `${email} finns inte registrerad som kontakt hos ${verification.companyName} i EduAdmin. Be dem kontakta oss för att läggas till.`,
    }, { status: 404 });
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      email,
      edu_customer_id: customerId,
      role: role || "contact_person",
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Invitation creation failed:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa inbjudan" },
      { status: 500 },
    );
  }

  // TODO: Send email via Resend with invitation link
  // const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/invite?token=${invitation.token}`;

  return NextResponse.json({
    success: true,
    invitation,
    contactName: verification.contactName,
  });
}
