import { NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";
import { updateCustomer } from "@/lib/eduadmin/customers";
import { requireMembership, STAFF_ROLES } from "@/lib/auth/api-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireMembership(id, STAFF_ROLES);
  if ("error" in guard) return guard.error;
  const { customerId } = guard;

  try {
    const customer = await eduAdminFetch(
      `/v1/odata/Customers(${customerId})`,
      { $expand: "BillingInfo" },
    );
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kunddata" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const guard = await requireMembership(id, STAFF_ROLES);
  if ("error" in guard) return guard.error;
  const { customerId } = guard;

  try {
    const body = await request.json();
    await updateCustomer(customerId, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunde inte uppdatera" },
      { status: 500 },
    );
  }
}
