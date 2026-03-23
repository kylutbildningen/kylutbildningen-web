import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { eduAdminFetch } from '@/lib/eduadmin/client'
import { createPerson } from '@/lib/eduadmin/persons'
import { syncPersonsFromEduAdmin } from '@/lib/supabase-persons'

interface ODataResponse<T> {
  value: T[]
}

interface EduAdminCustomer {
  CustomerId: number
  CustomerName: string
  OrganisationNumber: string
}

interface EduAdminNewCustomer {
  CustomerId: number
}

export async function POST(req: NextRequest) {
  try {
    const {
      email, firstName, lastName, phone,
      companyName, orgNumber, address, zipCode, city,
      invoiceEmail, reference,
    } = await req.json()

    if (!email || !firstName || !lastName || !companyName || !orgNumber) {
      return NextResponse.json(
        { error: 'Obligatoriska fält saknas' },
        { status: 400 },
      )
    }

    // Get the authenticated user from Supabase
    const supabase = createSupabaseAdmin()

    // Look up user by email
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const authUser = users.find(u => u.email === email)
    if (!authUser) {
      return NextResponse.json({ error: 'Ingen inloggad användare hittades' }, { status: 401 })
    }

    // 1. Check if customer already exists by org number
    const clean = orgNumber.replace(/\D/g, '')
    const withDash = clean.length === 10
      ? `${clean.slice(0, 6)}-${clean.slice(6)}`
      : orgNumber

    const existingCustomers = await eduAdminFetch<ODataResponse<EduAdminCustomer>>(
      '/v1/odata/Customers',
      {
        $filter: `OrganisationNumber eq '${withDash}' or OrganisationNumber eq '${clean}'`,
        $top: '1',
      },
    )

    let customerId: number

    if (existingCustomers.value.length > 0) {
      customerId = existingCustomers.value[0].CustomerId
    } else {
      // 2. Create new customer in EduAdmin
      const newCustomer = await eduAdminFetch<EduAdminNewCustomer>('/v1/Customer', {
        __method: 'POST',
        __body: JSON.stringify({
          CustomerName: companyName,
          OrganisationNumber: withDash,
          Address: address || '',
          Zip: zipCode || '',
          City: city || '',
          Country: 'Sverige',
          Email: invoiceEmail || email,
        }),
      })
      customerId = newCustomer.CustomerId
    }

    // 3. Create contact person in EduAdmin
    const newPerson = await createPerson({
      customerId,
      firstName,
      lastName,
      email,
      phone,
      isContactPerson: true,
    })

    // 4. Create profile in Supabase
    await supabase.from('profiles').upsert({
      id: authUser.id,
      full_name: `${firstName} ${lastName}`,
      phone,
      updated_at: new Date().toISOString(),
    })

    // 5. Create company_membership in Supabase
    const { error: membershipError } = await supabase
      .from('company_memberships')
      .upsert(
        {
          user_id: authUser.id,
          edu_customer_id: customerId,
          edu_contact_id: newPerson.PersonId,
          company_name: companyName,
          org_number: withDash,
          role: 'company_admin',
          is_contact_person: true,
        },
        { onConflict: 'user_id,edu_customer_id' },
      )

    if (membershipError) {
      console.error('Membership creation failed:', membershipError)
      return NextResponse.json(
        { error: 'Kunde inte skapa koppling: ' + membershipError.message },
        { status: 500 },
      )
    }

    // 6. Sync persons in background
    syncPersonsFromEduAdmin(customerId).catch(err =>
      console.error('Person sync failed:', err),
    )

    return NextResponse.json({
      ok: true,
      customerId,
      contactId: newPerson.PersonId,
    })
  } catch (err: unknown) {
    console.error('create-customer error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunde inte skapa konto' },
      { status: 500 },
    )
  }
}
