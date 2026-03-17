import { NextResponse } from "next/server";
import { verifyEmailOnCustomer } from "@/lib/eduadmin/verify-contact";

export async function POST(request: Request) {
  try {
    const { email, customerId } = await request.json();

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
