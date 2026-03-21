/**
 * EduAdmin customer search and lookup.
 */

import { eduAdminFetch } from "./client";

interface ODataResponse<T> {
  value: T[];
}

export interface CustomerSearchResult {
  CustomerId: number;
  CustomerName: string;
  OrganisationNumber: string;
}

export interface CustomerDetail {
  CustomerId: number;
  CustomerName: string;
  OrganisationNumber: string;
  Address: string;
  Zip: string;
  City: string;
  Phone: string;
  Email: string;
}

/**
 * Search customers by name (free text, min 2 chars).
 */
export async function searchCustomers(
  query: string,
): Promise<CustomerSearchResult[]> {
  if (query.length < 2) return [];

  const escaped = query.replace(/'/g, "''");

  const data = await eduAdminFetch<ODataResponse<CustomerSearchResult>>(
    "/v1/odata/Customers",
    {
      $filter: `contains(CustomerName, '${escaped}')`,
      $select: "CustomerId,CustomerName,OrganisationNumber",
      $top: "10",
      $orderby: "CustomerName asc",
    },
  );

  return data.value;
}

/**
 * Update customer via REST API: PATCH /v1/Customer/{customerId}
 */
export async function updateCustomer(
  customerId: number,
  updates: Partial<{
    customerName: string;
    email: string;
    phone: string;
    mobile: string;
    web: string;
    address: string;
    address2: string;
    zip: string;
    city: string;
    country: string;
  }>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.customerName !== undefined) body.CustomerName = updates.customerName;
  if (updates.email !== undefined) body.Email = updates.email;
  if (updates.phone !== undefined) body.Phone = updates.phone;
  if (updates.mobile !== undefined) body.Mobile = updates.mobile;
  if (updates.web !== undefined) body.Web = updates.web;
  if (updates.address !== undefined) body.Address = updates.address;
  if (updates.address2 !== undefined) body.Address2 = updates.address2;
  if (updates.zip !== undefined) body.Zip = updates.zip;
  if (updates.city !== undefined) body.City = updates.city;
  if (updates.country !== undefined) body.Country = updates.country;

  await eduAdminFetch(`/v1/Customer/${customerId}`, {
    __method: "PATCH",
    __body: JSON.stringify(body),
  });
}

/**
 * Get a single customer by ID.
 */
export async function getCustomerWithContacts(
  customerId: number,
): Promise<CustomerDetail> {
  return eduAdminFetch<CustomerDetail>(
    `/v1/odata/Customers(${customerId})`,
    {
      $select:
        "CustomerId,CustomerName,OrganisationNumber,Address,Zip,City,Phone,Email",
    },
  );
}
