import { NextRequest, NextResponse } from "next/server";
import { syncPersonsFromEduAdmin } from "@/lib/supabase-persons";
import { requireMembership, STAFF_ROLES } from "@/lib/auth/api-guard";

export async function POST(request: NextRequest) {
  const { customerId } = await request.json();
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  const guard = await requireMembership(customerId, STAFF_ROLES);
  if ("error" in guard) return guard.error;

  try {
    const count = await syncPersonsFromEduAdmin(guard.customerId);
    return NextResponse.json({ success: true, synced: count });
  } catch (error) {
    console.error("Person sync failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Synk misslyckades" },
      { status: 500 },
    );
  }
}
