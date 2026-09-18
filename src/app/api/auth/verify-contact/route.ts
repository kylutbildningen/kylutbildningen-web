import { NextResponse } from "next/server";
import { verifyEmailOnCustomer } from "@/lib/eduadmin/verify-contact";
import { requireUser } from "@/lib/auth/api-guard";

// Verifies the logged-in user's own email — any email in the body is ignored.
export async function POST(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  try {
    const { customerId } = await request.json();
    const email = auth.user.email;

    if (!email || !customerId) {
      return NextResponse.json(
        { error: "E-post och kundnummer krävs" },
        { status: 400 },
      );
    }

    const result = await verifyEmailOnCustomer(email, customerId);

    return NextResponse.json({
      verified: result.verified,
      isContactPerson: result.isContactPerson,
      contactId: result.contactId,
      contactName: result.contactName,
      companyName: result.companyName,
    });
  } catch (error) {
    console.error("Verify contact failed:", error);
    return NextResponse.json(
      { error: "Kunde inte verifiera kontakt. Försök igen." },
      { status: 500 },
    );
  }
}
