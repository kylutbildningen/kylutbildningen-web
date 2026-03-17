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
  ZipCode?: string;
  City?: string;
  Email?: string;
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
