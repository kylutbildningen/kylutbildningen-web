import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const customerId = request.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId krävs" }, { status: 400 });
  }

  // Verify caller is admin for this company
  const { data: callerMembership } = await supabase
    .from("company_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("edu_customer_id", parseInt(customerId))
    .single();

  if (!callerMembership || callerMembership.role !== "company_admin") {
    return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  const { data: members } = await supabase
    .from("company_memberships")
    .select("*")
    .eq("edu_customer_id", parseInt(customerId))
    .order("created_at", { ascending: true });

  return NextResponse.json(members ?? []);
}
