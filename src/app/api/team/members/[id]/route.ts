import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { role } = await request.json();

  if (!["company_admin", "contact_person", "participant"].includes(role)) {
    return NextResponse.json({ error: "Ogiltig roll" }, { status: 400 });
  }

  // Get the target membership to find the company
  const { data: target } = await supabase
    .from("company_memberships")
    .select("edu_customer_id")
    .eq("id", id)
    .single();

  if (!target) {
    return NextResponse.json({ error: "Medlem hittades inte" }, { status: 404 });
  }

  // Verify caller is admin
  const { data: callerMembership } = await supabase
    .from("company_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("edu_customer_id", target.edu_customer_id)
    .single();

  if (!callerMembership || callerMembership.role !== "company_admin") {
    return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  const { error } = await supabase
    .from("company_memberships")
    .update({ role })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Uppdatering misslyckades" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  // Get target membership
  const { data: target } = await supabase
    .from("company_memberships")
    .select("edu_customer_id, user_id")
    .eq("id", id)
    .single();

  if (!target) {
    return NextResponse.json({ error: "Medlem hittades inte" }, { status: 404 });
  }

  // Verify caller is admin
  const { data: callerMembership } = await supabase
    .from("company_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("edu_customer_id", target.edu_customer_id)
    .single();

  if (!callerMembership || callerMembership.role !== "company_admin") {
    return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
  }

  // Don't allow removing yourself if you're the last admin
  if (target.user_id === user.id) {
    return NextResponse.json(
      { error: "Du kan inte ta bort dig själv som admin" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("company_memberships")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Borttagning misslyckades" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
