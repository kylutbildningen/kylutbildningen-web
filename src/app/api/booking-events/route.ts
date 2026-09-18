import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { requireMembership, STAFF_ROLES } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) return NextResponse.json({ error: "customerId krävs" }, { status: 400 });

  const guard = await requireMembership(customerId, STAFF_ROLES);
  if ("error" in guard) return guard.error;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("booking_events")
    .select("*")
    .eq("edu_customer_id", guard.customerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
