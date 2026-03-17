/**
 * Fortnox preflight — validate/create customer before invoice booking.
 */

const FORTNOX_BASE = "https://api.fortnox.se";
const FORTNOX_TOKEN = process.env.FORTNOX_ACCESS_TOKEN ?? "";

async function fortnoxFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${FORTNOX_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${FORTNOX_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fortnox ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

interface FortnoxCustomer {
  CustomerNumber: string;
  OrganisationNumber: string;
  Name: string;
  Address1?: string;
  Address2?: string;
  ZipCode?: string;
  City?: string;
  Email?: string;
  Phone1?: string;
  Phone2?: string;
  YourReference?: string;
  OurReference?: string;
  WWW?: string;
}

export interface CompanyLookupResult {
  found: boolean;
  source: "fortnox" | "external";
  companyName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone: string;
}

/**
 * Look up a company by organisation number in Fortnox.
 * Returns company details if found, null otherwise.
 */
export async function lookupCompany(
  organizationNumber: string,
): Promise<CompanyLookupResult | null> {
  if (!FORTNOX_TOKEN) {
    return null;
  }

  try {
    const search = await fortnoxFetch(
      `/3/customers?organisationnumber=${encodeURIComponent(organizationNumber)}`,
    );
    const customers: FortnoxCustomer[] = search.Customers ?? [];

    if (customers.length === 0) return null;

    const c = customers[0];
    // Split name for contact if possible (last word = last name)
    const nameParts = (c.YourReference || c.Name || "").trim().split(/\s+/);
    const contactLast = nameParts.length > 1 ? nameParts.pop()! : "";
    const contactFirst = nameParts.join(" ");

    return {
      found: true,
      source: "fortnox",
      companyName: c.Name || "",
      streetAddress: c.Address1 || "",
      postalCode: c.ZipCode || "",
      city: c.City || "",
      email: c.Email || "",
      phone: c.Phone1 || "",
      contactFirstName: contactFirst,
      contactLastName: contactLast,
      contactEmail: c.Email || "",
      contactPhone: c.Phone1 || "",
    };
  } catch {
    return null;
  }
}

/**
 * Preflight: ensure customer exists in Fortnox, return customer number.
 */
export async function fortnoxPreflight(params: {
  organizationNumber: string;
  companyName: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  email: string;
}): Promise<string> {
  if (!FORTNOX_TOKEN) {
    console.warn("Fortnox token not configured, skipping preflight");
    return "MOCK-CUSTOMER";
  }

  // 1. Search for existing customer
  try {
    const search = await fortnoxFetch(
      `/3/customers?organisationnumber=${encodeURIComponent(params.organizationNumber)}`,
    );
    const customers: FortnoxCustomer[] = search.Customers ?? [];

    if (customers.length > 0) {
      const existing = customers[0];
      // Update if needed
      if (
        existing.Name !== params.companyName ||
        existing.Address1 !== params.streetAddress
      ) {
        await fortnoxFetch(`/3/customers/${existing.CustomerNumber}`, {
          method: "PUT",
          body: JSON.stringify({
            Customer: {
              Name: params.companyName,
              Address1: params.streetAddress,
              ZipCode: params.postalCode,
              City: params.city,
              Email: params.email,
            },
          }),
        });
      }
      return existing.CustomerNumber;
    }
  } catch {
    // Customer not found, create new
  }

  // 2. Create new customer
  const created = await fortnoxFetch("/3/customers", {
    method: "POST",
    body: JSON.stringify({
      Customer: {
        Name: params.companyName,
        OrganisationNumber: params.organizationNumber,
        Address1: params.streetAddress,
        ZipCode: params.postalCode,
        City: params.city,
        Email: params.email,
      },
    }),
  });

  return created.Customer.CustomerNumber;
}
