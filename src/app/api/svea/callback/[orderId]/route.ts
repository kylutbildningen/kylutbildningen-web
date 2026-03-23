import { NextRequest, NextResponse } from 'next/server'
import { getSveaOrder } from '@/lib/svea'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { formatCompactDateRange } from '@/lib/format'
import { getEvent } from '@/lib/eduadmin'

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId: orderIdStr } = await params
  const orderId = parseInt(orderIdStr)

  try {
    // Verify order directly with Svea API
    const sveaOrder = await getSveaOrder(orderId)

    if (sveaOrder.Status !== 'Final') {
      return NextResponse.json({ ok: true })
    }

    const supabase = createSupabaseAdmin()

    // Idempotency check
    const { data: existing } = await supabase
      .from('svea_orders')
      .select('id')
      .eq('svea_order_id', orderId)
      .eq('status', 'completed')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ ok: true })
    }

    // Fetch our saved order data
    const { data: ourOrder } = await supabase
      .from('svea_orders')
      .select('*')
      .eq('svea_order_id', orderId)
      .single()

    if (!ourOrder) {
      console.error('Svea callback: order not found in DB', orderId)
      return NextResponse.json({ ok: true })
    }

    const formData = ourOrder.form_data
    const isCompany = formData.customerType === 'company'
    const contactEmail = isCompany ? formData.company.contactEmail : formData.private.email
    const contactName = isCompany
      ? `${formData.company.contactFirstName} ${formData.company.contactLastName}`
      : `${formData.private.firstName} ${formData.private.lastName}`

    // Create booking in EduAdmin
    const eduBooking: Record<string, unknown> = {
      EventId: ourOrder.event_id,
      PaymentMethodId: 2, // Card payment via Svea
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
      console.error('EduAdmin booking failed in Svea callback:', eduRes.status, errorText)
      // Don't return error — Svea will retry for 24h
      return NextResponse.json({ ok: true })
    }

    const eduResult = await eduRes.json()
    const bookingId = eduResult.BookingId
    console.log('Svea callback: EduAdmin booking created:', bookingId)

    // Mark booking as paid in EduAdmin
    if (bookingId) {
      const patchRes = await fetch(`${API_URL}/v1/Bookings(${bookingId})`, {
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

    // Save booking to Supabase bookings table
    const eventData = await getEvent(ourOrder.event_id)

    await supabase.from('bookings').insert({
      edu_customer_id: eduResult.CustomerId ?? 0,
      event_id: ourOrder.event_id,
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
      booking_number: String(eduResult.BookingId),
      status: 'confirmed',
    })

    // Mark Svea order as completed
    await supabase
      .from('svea_orders')
      .update({
        status: 'completed',
        booking_number: String(eduResult.BookingId),
      })
      .eq('svea_order_id', orderId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Svea callback error:', err)
    return NextResponse.json({ ok: true })
  }
}
