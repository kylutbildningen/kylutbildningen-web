import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { getEvent } from '@/lib/eduadmin'
import { formatCompactDateRange } from '@/lib/format'

const API_URL = process.env.EDUADMIN_API_BASE ?? 'https://api.eduadmin.se'
const API_USER = process.env.EDUADMIN_USERNAME ?? ''
const API_PASS = process.env.EDUADMIN_PASSWORD ?? ''

let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken
  const res = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: API_USER,
      password: API_PASS,
    }),
  })
  if (!res.ok) throw new Error(`EduAdmin auth failed: ${res.status}`)
  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 3600) * 1000
  return cachedToken!
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Stripe webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    const supabase = createSupabaseAdmin()

    const { data: ourSession } = await supabase
      .from('stripe_sessions')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    if (!ourSession) {
      console.error('Stripe webhook: session not found in DB', session.id)
      return NextResponse.json({ ok: true })
    }

    // Idempotency check
    if (ourSession.status === 'completed') {
      return NextResponse.json({ ok: true })
    }

    const formData = ourSession.form_data
    const isCompany = formData.customerType === 'company'
    const contactEmail = isCompany ? formData.company.contactEmail : formData.private.email
    const contactName = isCompany
      ? `${formData.company.contactFirstName} ${formData.company.contactLastName}`
      : `${formData.private.firstName} ${formData.private.lastName}`

    // Create booking in EduAdmin
    const eduBooking: Record<string, unknown> = {
      EventId: ourSession.event_id,
      PaymentMethodId: 2,
      Customer: isCompany
        ? {
            CustomerName: formData.company.companyName,
            OrganisationNumber: formData.company.organizationNumber,
            Address: formData.company.streetAddress,
            Zip: formData.company.postalCode,
            City: formData.company.city,
            Email: contactEmail,
          }
        : {
            CustomerName: `${formData.private.firstName} ${formData.private.lastName}`,
            Address: formData.private.streetAddress,
            Zip: formData.private.postalCode,
            City: formData.private.city,
            Email: formData.private.email,
          },
      ContactPerson: {
        FirstName: isCompany ? formData.company.contactFirstName : formData.private.firstName,
        LastName: isCompany ? formData.company.contactLastName : formData.private.lastName,
        Email: contactEmail,
        Phone: isCompany ? formData.company.contactPhone : formData.private.phone,
      },
      Participants: formData.participants.map((p: Record<string, string>) => ({
        FirstName: p.firstName,
        LastName: p.lastName,
        Email: p.email,
        Phone: p.phone,
        CivicRegistrationNumber: p.civicRegistrationNumber || '',
        ...(p.priceNameId ? { PriceNameId: p.priceNameId } : {}),
      })),
      SendConfirmationEmail: {
        SendToCustomerContact: true,
        SendToParticipants: true,
      },
    }

    try {
      const token = await getToken()
      const eduRes = await fetch(`${API_URL}/v1/Booking`, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eduBooking),
      })

      if (!eduRes.ok) {
        const errorText = await eduRes.text()
        console.error('EduAdmin booking failed in Stripe webhook:', eduRes.status, errorText)
        return NextResponse.json({ ok: true })
      }

      const eduResult = await eduRes.json()
      const bookingId = eduResult.BookingId
      console.log('Stripe webhook: EduAdmin booking created:', bookingId)

      // Mark booking as paid in EduAdmin
      if (bookingId) {
        const patchRes = await fetch(`${API_URL}/v1/Booking/${bookingId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ Paid: true }),
        })
        if (patchRes.ok) {
          console.log(`EduAdmin booking ${bookingId} marked as paid`)
        } else {
          console.error(`EduAdmin PATCH paid failed: ${patchRes.status}`, await patchRes.text())
        }
      }

      // Save booking to Supabase
      const eventData = await getEvent(ourSession.event_id)

      await supabase.from('bookings').insert({
        edu_customer_id: eduResult.CustomerId ?? 0,
        event_id: ourSession.event_id,
        course_name: eventData?.eventCard.courseName ?? '',
        event_date: eventData ? formatCompactDateRange(eventData.eventCard.startDate, eventData.eventCard.endDate) : '',
        event_city: eventData?.eventCard.city ?? '',
        customer_type: formData.customerType,
        company_name: isCompany ? formData.company.companyName : contactName,
        org_number: isCompany ? formData.company.organizationNumber : null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: isCompany ? formData.company.contactPhone : formData.private.phone,
        payment_method: 'card',
        participants: formData.participants,
        total_price_ex_vat: eduResult.TotalPriceExVat ?? 0,
        booking_number: String(bookingId),
        status: 'confirmed',
      })

      // Mark Stripe session as completed
      await supabase
        .from('stripe_sessions')
        .update({
          status: 'completed',
          booking_id: bookingId,
        })
        .eq('stripe_session_id', session.id)
    } catch (err) {
      console.error('Stripe webhook booking error:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
