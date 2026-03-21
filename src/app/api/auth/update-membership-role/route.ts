import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

    const { targetUserId, eduCustomerId, role } = await request.json();
    if (!targetUserId || !eduCustomerId || !role) {
      return NextResponse.json({ error: "targetUserId, eduCustomerId och role krävs" }, { status: 400 });
    }

    const validRoles = ["company_admin", "contact_person", "participant"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Verify the caller is an admin for this company
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) return NextResponse.json({ error: "Ogiltig session" }, { status: 401 });

    const { data: callerMembership } = await supabaseAdmin
      .from("company_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("edu_customer_id", eduCustomerId)
      .single();

    if (callerMembership?.role !== "company_admin") {
      return NextResponse.json({ error: "Åtkomst nekad" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("company_memberships")
      .update({
        role,
        is_contact_person: role !== "participant",
      })
      .eq("user_id", targetUserId)
      .eq("edu_customer_id", eduCustomerId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
