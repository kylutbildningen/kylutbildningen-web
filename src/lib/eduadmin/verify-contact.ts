/**
 * Verify that an email address is registered as a contact
 * on a specific customer account in EduAdmin.
 *
 * Uses the Persons endpoint (not CustomerContacts — that doesn't exist).
 */

import { eduAdminFetch } from "./client";

interface ODataResponse<T> {
  value: T[];
}

interface EduAdminPerson {
  PersonId: number;
  CustomerId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
}

export interface VerifyResult {
  verified: boolean;
  isContactPerson: boolean;
  contactId?: number;
  contactName?: string;
  companyName?: string;
}

/**
 * Check if the given email exists as a person on the given EduAdmin customer.
 */
export async function verifyEmailOnCustomer(
  email: string,
  customerId: number,
): Promise<VerifyResult> {
  // Get customer name
  const customer = await eduAdminFetch<{
    CustomerId: number;
    CustomerName: string;
  }>(`/v1/odata/Customers(${customerId})`, {
    $select: "CustomerId,CustomerName",
  });

  // Get all persons for this customer
  const persons = await eduAdminFetch<ODataResponse<EduAdminPerson>>(
    "/v1/odata/Persons",
    {
      $filter: `CustomerId eq ${customerId}`,
      $select:
        "PersonId,FirstName,LastName,Email,IsContactPerson,CanLogin,CustomerId",
    },
  );

  const contact = persons.value.find(
    (p) => p.Email?.toLowerCase() === email.toLowerCase(),
  );

  if (!contact) {
    return {
      verified: false,
      isContactPerson: false,
      companyName: customer.CustomerName,
    };
  }

  return {
    verified: true,
    isContactPerson: contact.IsContactPerson === true,
    contactId: contact.PersonId,
    contactName: `${contact.FirstName} ${contact.LastName}`.trim(),
    companyName: customer.CustomerName,
  };
}

export interface CompanyMatch {
  customerId: number;
  customerName: string;
  organisationNumber: string;
  personId: number;
  personName: string;
  isContactPerson: boolean;
}

/**
 * Find all EduAdmin customers where the given email is registered as a person.
 */
export async function findCompaniesByEmail(email: string): Promise<CompanyMatch[]> {
  const persons = await eduAdminFetch<ODataResponse<EduAdminPerson>>(
    "/v1/odata/Persons",
    {
      $filter: `Email eq '${email.replace(/'/g, "''")}'`,
      $select: "PersonId,CustomerId,FirstName,LastName,Email,IsContactPerson",
    },
  );

  if (persons.value.length === 0) return [];

  // Fetch customer details for each unique customerId
  const uniqueCustomerIds = [...new Set(persons.value.map((p) => p.CustomerId))];

  const customers = await Promise.all(
    uniqueCustomerIds.map((cid) =>
      eduAdminFetch<{ CustomerId: number; CustomerName: string; OrganisationNumber: string }>(
        `/v1/odata/Customers(${cid})`,
        { $select: "CustomerId,CustomerName,OrganisationNumber" },
      ).catch(() => null),
    ),
  );

  const results: CompanyMatch[] = [];
  for (const customer of customers) {
    if (!customer) continue;
    const person = persons.value.find((p) => p.CustomerId === customer.CustomerId);
    if (!person) continue;
    results.push({
      customerId: customer.CustomerId,
      customerName: customer.CustomerName,
      organisationNumber: customer.OrganisationNumber || "",
      personId: person.PersonId,
      personName: `${person.FirstName} ${person.LastName}`.trim(),
      isContactPerson: person.IsContactPerson === true,
    });
  }

  return results;
}

/**
 * Get all persons for a customer (used for team management).
 */
export async function getPersonsForCustomer(customerId: number) {
  const persons = await eduAdminFetch<ODataResponse<EduAdminPerson>>(
    "/v1/odata/Persons",
    {
      $filter: `CustomerId eq ${customerId}`,
      $select:
        "PersonId,CustomerId,FirstName,LastName,Email,IsContactPerson,CanLogin",
      $orderby: "LastName asc",
    },
  );
  return persons.value;
}
