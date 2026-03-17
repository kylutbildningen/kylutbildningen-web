import { NextRequest, NextResponse } from "next/server";
import { lookupCustomerByOrgNr } from "@/lib/eduadmin";
import { lookupCompany } from "@/lib/fortnox";

export async function GET(request: NextRequest) {
  const orgNr = request.nextUrl.searchParams.get("orgNr");

  if (!orgNr || orgNr.replace(/\D/g, "").length < 10) {
    return NextResponse.json(
      { error: "Ange ett giltigt organisationsnummer" },
      { status: 400 },
    );
  }

  try {
    // 1. Check EduAdmin first (with persons/contacts)
    const eduCustomer = await lookupCustomerByOrgNr(orgNr);

    if (eduCustomer) {
      const contact = eduCustomer.Persons?.find((p) => p.IsContactPerson) ??
        eduCustomer.Persons?.[0];

      return NextResponse.json({
        found: true,
        source: "eduadmin",
        companyName: eduCustomer.CustomerName || "",
        organizationNumber: eduCustomer.OrganisationNumber || "",
        streetAddress: eduCustomer.Address || "",
        postalCode: eduCustomer.Zip || "",
        city: eduCustomer.City || "",
        email: eduCustomer.Email || contact?.Email || "",
        phone: eduCustomer.Phone || contact?.Phone || "",
        contactFirstName: contact?.FirstName || "",
        contactLastName: contact?.LastName || "",
        contactEmail: contact?.Email || eduCustomer.Email || "",
        contactPhone: contact?.Phone || contact?.Mobile || eduCustomer.Phone || "",
      });
    }

    // 2. Fall back to Fortnox
    const fortnoxResult = await lookupCompany(orgNr);

    if (fortnoxResult) {
      return NextResponse.json(fortnoxResult);
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error("Company lookup failed:", error);
    return NextResponse.json({ found: false });
  }
}
