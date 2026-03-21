import { NextResponse } from "next/server";
import { findCompaniesByEmail } from "@/lib/eduadmin/verify-contact";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "E-post krävs" }, { status: 400 });
  }

  try {
    const companies = await findCompaniesByEmail(email);
    return NextResponse.json(companies);
  } catch (error) {
    console.error("companies-by-email failed:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta företag" },
      { status: 500 },
    );
  }
}
