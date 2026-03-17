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
