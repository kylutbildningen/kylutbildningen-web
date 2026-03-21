/**
 * Persons sync — Supabase as cache/primary, EduAdmin as source of truth.
 *
 * - syncPersonsFromEduAdmin: fetches all persons for a customer from EduAdmin
 *   and upserts them into the Supabase persons table.
 * - getPersonsFromSupabase: reads persons for a customer from Supabase.
 * - upsertPerson: write a single person to Supabase (after creating in EduAdmin).
 */

import { createSupabaseAdmin } from "./supabase-admin";
import { getPersonsForCustomer } from "./eduadmin/persons";

export interface SupabasePerson {
  id: string;
  edu_person_id: number;
  edu_customer_id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  civic_registration_number: string | null;
  job_title: string | null;
  is_contact_person: boolean;
  can_login: boolean;
  synced_at: string;
  created_at: string;
}

/**
 * Fetch all persons for a customer from EduAdmin and upsert into Supabase.
 * Returns the number of persons synced.
 */
export async function syncPersonsFromEduAdmin(
  customerId: number,
): Promise<number> {
  const persons = await getPersonsForCustomer(customerId);
  if (persons.length === 0) return 0;

  const supabase = createSupabaseAdmin();

  const rows = persons.map((p) => ({
    edu_person_id: p.PersonId,
    edu_customer_id: p.CustomerId || customerId,
    first_name: p.FirstName?.trim() || "",
    last_name: p.LastName?.trim() || "",
    email: p.Email || null,
    phone: p.Phone || null,
    mobile: p.Mobile || null,
    civic_registration_number: p.CivicRegistrationNumber || null,
    job_title: p.JobTitle || null,
    is_contact_person: p.IsContactPerson ?? false,
    can_login: p.CanLogin ?? false,
    synced_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("persons")
    .upsert(rows, { onConflict: "edu_person_id,edu_customer_id" });

  if (error) throw new Error(`Supabase persons upsert failed: ${error.message}`);

  // Remove persons that no longer exist in EduAdmin
  const eduPersonIds = rows.map((r) => r.edu_person_id);
  const { data: existing } = await supabase
    .from("persons")
    .select("edu_person_id")
    .eq("edu_customer_id", customerId);

  if (existing) {
    const toDelete = existing.filter((e) => !eduPersonIds.includes(e.edu_person_id));
    if (toDelete.length > 0) {
      await supabase
        .from("persons")
        .delete()
        .eq("edu_customer_id", customerId)
        .in("edu_person_id", toDelete.map((d) => d.edu_person_id));
    }
  }

  return rows.length;
}

/**
 * Get all persons for a customer from Supabase.
 */
export async function getPersonsFromSupabase(
  customerId: number,
): Promise<SupabasePerson[]> {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("edu_customer_id", customerId)
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) throw new Error(`Supabase persons fetch failed: ${error.message}`);
  return data ?? [];
}

/**
 * Upsert a single person into Supabase (call after creating in EduAdmin).
 */
export async function upsertPerson(person: {
  eduPersonId: number;
  eduCustomerId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  civicRegistrationNumber?: string;
  jobTitle?: string;
  isContactPerson?: boolean;
  canLogin?: boolean;
}): Promise<void> {
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("persons").upsert(
    {
      edu_person_id: person.eduPersonId,
      edu_customer_id: person.eduCustomerId,
      first_name: person.firstName,
      last_name: person.lastName,
      email: person.email || null,
      phone: person.phone || null,
      mobile: person.mobile || null,
      civic_registration_number: person.civicRegistrationNumber || null,
      job_title: person.jobTitle || null,
      is_contact_person: person.isContactPerson ?? false,
      can_login: person.canLogin ?? false,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "edu_person_id,edu_customer_id" },
  );

  if (error) throw new Error(`Supabase person upsert failed: ${error.message}`);
}

/**
 * Remove a person from Supabase by EduAdmin PersonId.
 */
export async function removePersonFromSupabase(
  eduPersonId: number,
  eduCustomerId: number,
): Promise<void> {
  const supabase = createSupabaseAdmin();
  await supabase
    .from("persons")
    .delete()
    .eq("edu_person_id", eduPersonId)
    .eq("edu_customer_id", eduCustomerId);
}
