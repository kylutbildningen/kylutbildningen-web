import { NextResponse } from "next/server";
import { findCompaniesByEmail } from "@/lib/eduadmin/verify-contact";
import { requireUser } from "@/lib/auth/api-guard";

// Only looks up the logged-in user's own email — the query param is ignored.
export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const email = auth.user.email;
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
