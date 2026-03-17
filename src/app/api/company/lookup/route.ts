import { NextRequest, NextResponse } from "next/server";
import { lookupCompany } from "@/lib/fortnox";

export async function GET(request: NextRequest) {
  const orgNr = request.nextUrl.searchParams.get("orgNr");

  if (!orgNr || orgNr.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "Ange ett giltigt organisationsnummer" },
      { status: 400 },
    );
  }

  try {
    // Look up in Fortnox first
    const result = await lookupCompany(orgNr);

    if (result) {
      return NextResponse.json(result);
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("Company lookup failed:", error);
    return NextResponse.json({ found: false });
  }
}
