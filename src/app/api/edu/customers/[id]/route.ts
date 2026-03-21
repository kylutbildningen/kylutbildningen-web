import { NextResponse } from "next/server";
import { eduAdminFetch } from "@/lib/eduadmin/client";
import { updateCustomer } from "@/lib/eduadmin/customers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Ogiltigt kund-ID" }, { status: 400 });
  }

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
  const customerId = parseInt(id, 10);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "Ogiltigt kund-ID" }, { status: 400 });
  }

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
