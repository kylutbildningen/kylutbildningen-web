import { NextRequest, NextResponse } from "next/server";
import { searchCustomers } from "@/lib/eduadmin/customers";

export async function GET(request: NextRequest) {
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
