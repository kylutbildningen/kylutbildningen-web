import { NextRequest, NextResponse } from "next/server";
import { searchCustomers } from "@/lib/eduadmin/customers";
import { requireUser } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;

  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Sökterm måste vara minst 2 tecken" },
      { status: 400 },
    );
  }

  try {
    const results = await searchCustomers(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Customer search failed:", error);
    return NextResponse.json(
      { error: "Sökningen misslyckades. Försök igen." },
      { status: 500 },
    );
  }
}
