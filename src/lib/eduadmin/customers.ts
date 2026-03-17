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
  CustomerContacts: Array<{
    ContactId: number;
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
    Mobile: string;
    ContactPerson: boolean;
    LoginAccount: boolean;
  }>;
}

/**
 * Search customers by name (free text, min 2 chars).
 */
export async function searchCustomers(
  query: string,
): Promise<CustomerSearchResult[]> {
  if (query.length < 2) return [];

  // Escape single quotes in OData filter
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
 * Get a single customer with all contacts expanded.
 */
export async function getCustomerWithContacts(
  customerId: number,
): Promise<CustomerDetail> {
  return eduAdminFetch<CustomerDetail>(
    `/v1/odata/Customers(${customerId})`,
    {
      $expand:
        "CustomerContacts($select=ContactId,FirstName,LastName,Email,Phone,Mobile,ContactPerson,LoginAccount)",
      $select:
        "CustomerId,CustomerName,OrganisationNumber,Address,Zip,City,Phone,Email",
    },
  );
}
