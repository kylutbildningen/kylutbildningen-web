/**
 * Verify that an email address is registered as a contact
 * on a specific customer account in EduAdmin.
 */

import { eduAdminFetch } from "./client";

interface CustomerContact {
  ContactId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  ContactPerson: boolean;
  LoginAccount: boolean;
  Phone: string;
  Mobile: string;
}

interface CustomerWithContacts {
  CustomerId: number;
  CustomerName: string;
  OrganisationNumber: string;
  CustomerContacts: CustomerContact[];
}

export interface VerifyResult {
  verified: boolean;
  isContactPerson: boolean;
  contactId?: number;
  contactName?: string;
  companyName?: string;
}

/**
 * Check if the given email exists as a contact on the given EduAdmin customer.
 */
export async function verifyEmailOnCustomer(
  email: string,
  customerId: number,
): Promise<VerifyResult> {
  const customer = await eduAdminFetch<CustomerWithContacts>(
    `/v1/odata/Customers(${customerId})`,
    {
      $expand:
        "CustomerContacts($select=ContactId,FirstName,LastName,Email,ContactPerson)",
      $select: "CustomerId,CustomerName,OrganisationNumber",
    },
  );

  const contact = customer.CustomerContacts?.find(
    (c) => c.Email?.toLowerCase() === email.toLowerCase(),
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
    isContactPerson: contact.ContactPerson === true,
    contactId: contact.ContactId,
    contactName: `${contact.FirstName} ${contact.LastName}`.trim(),
    companyName: customer.CustomerName,
  };
}
