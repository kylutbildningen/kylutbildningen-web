/**
 * EduAdmin Persons — read via OData, write via REST API.
 *
 * OData: GET /v1/odata/Persons (read)
 * REST:  POST /v1/Person (create), PATCH /v1/Person/{id} (update)
 */

import { eduAdminFetch } from "./client";

interface ODataResponse<T> {
  value: T[];
}

export interface EduAdminPerson {
  PersonId: number;
  CustomerId: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Mobile: string;
  Address: string;
  Address2: string;
  Zip: string;
  City: string;
  JobTitle: string;
  CivicRegistrationNumber: string;
  Birthdate: string;
  EmployeeNumber: string;
  IsContactPerson: boolean;
  CanLogin: boolean;
  Created: string;
  Modified: string;
}

export async function getPersonsForCustomer(
  customerId: number,
): Promise<EduAdminPerson[]> {
  const data = await eduAdminFetch<ODataResponse<EduAdminPerson>>(
    "/v1/odata/Persons",
    {
      $filter: `CustomerId eq ${customerId}`,
      $orderby: "LastName asc,FirstName asc",
    },
  );
  return data.value;
}

export async function getPerson(personId: number): Promise<EduAdminPerson> {
  return eduAdminFetch<EduAdminPerson>(`/v1/odata/Persons(${personId})`);
}

/**
 * Create person via REST API: POST /v1/Person
 */
export async function createPerson(person: {
  customerId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  civicRegistrationNumber?: string;
  isContactPerson?: boolean;
}): Promise<EduAdminPerson> {
  return eduAdminFetch<EduAdminPerson>("/v1/Person", {
    __method: "POST",
    __body: JSON.stringify({
      CustomerId: person.customerId,
      FirstName: person.firstName,
      LastName: person.lastName || "",
      Email: person.email || "",
      Phone: person.phone || "",
      Mobile: person.mobile || "",
      JobTitle: person.jobTitle || "",
      CivicRegistrationNumber: person.civicRegistrationNumber || "",
      CreateContactPerson: person.isContactPerson ?? false,
    }),
  });
}

/**
 * Update person via REST API: PATCH /v1/Person/{personId}
 */
export async function updatePerson(
  personId: number,
  updates: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    mobile: string;
    jobTitle: string;
    civicRegistrationNumber: string;
    isContactPerson: boolean;
  }>,
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (updates.firstName !== undefined) body.FirstName = updates.firstName;
  if (updates.lastName !== undefined) body.LastName = updates.lastName;
  if (updates.email !== undefined) body.Email = updates.email;
  if (updates.phone !== undefined) body.Phone = updates.phone;
  if (updates.mobile !== undefined) body.Mobile = updates.mobile;
  if (updates.jobTitle !== undefined) body.JobTitle = updates.jobTitle;
  if (updates.civicRegistrationNumber !== undefined) body.CivicRegistrationNumber = updates.civicRegistrationNumber;
  if (updates.isContactPerson !== undefined) body.CreateContactPerson = updates.isContactPerson;

  await eduAdminFetch(`/v1/Person/${personId}`, {
    __method: "PATCH",
    __body: JSON.stringify(body),
  });
}

/**
 * Delete person — EduAdmin REST API doesn't have a DELETE endpoint for persons.
 * We can only remove them from being a contact person.
 */
export async function deletePerson(personId: number): Promise<void> {
  // Try OData DELETE as fallback (might work for some accounts)
  await eduAdminFetch(`/v1/odata/Persons(${personId})`, {
    __method: "DELETE",
  });
}
