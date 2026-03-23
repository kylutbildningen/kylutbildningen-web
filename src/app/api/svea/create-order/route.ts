import { NextRequest, NextResponse } from 'next/server'
import { createSveaOrder } from '@/lib/svea'
import { getEvent } from '@/lib/eduadmin'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { eventId, formData } = await req.json()

    // Fetch event from EduAdmin
    const eventData = await getEvent(eventId)
    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
    const clientOrderNumber = `KYL-${eventId}-${Date.now()}`
    const isCompany = formData.customerType === 'company'
    const contactEmail = isCompany ? formData.company.contactEmail : formData.private.email
    const contactPhone = isCompany ? formData.company.contactPhone : formData.private.phone
    const participantCount = formData.participants.length
    const unitPriceKr = eventData.eventCard.lowestPrice ?? 0

    const orderData = {
      countryCode: 'SE',
      currency: 'SEK',
      locale: 'sv-se',
      clientOrderNumber,
      merchantSettings: {
        PushUri: `${siteUrl}/api/svea/callback/{checkout.order.uri}`,
        TermsUri: `${siteUrl}/villkor`,
        CheckoutUri: `${siteUrl}/boka/${eventId}`,
        ConfirmationUri: `${siteUrl}/boka/${eventId}/bekraftelse?order={checkout.order.uri}`,
      },
      cart: {
        Items: Array.from({ length: participantCount }, (_, i) => ({
          ArticleNumber: `KURS-${eventId}-${i + 1}`,
          Name: eventData.eventCard.courseName ?? 'Kursplats',
          Quantity: 100,
          UnitPrice: unitPriceKr * 100,
          DiscountPercent: 0,
          VatPercent: 2500,
          Unit: 'st',
        })),
      },
      presetValues: [
        { key: 'emailAddress', value: contactEmail, isReadonly: false },
        ...(contactPhone ? [{ key: 'phoneNumber', value: contactPhone, isReadonly: false }] : []),
      ],
    }

    console.log('Svea order request:', JSON.stringify(orderData, null, 2))
    const sveaOrder = await createSveaOrder(orderData)

    // Save order mapping in Supabase
    const supabase = createSupabaseAdmin()
    await supabase.from('svea_orders').insert({
      client_order_number: clientOrderNumber,
      svea_order_id: sveaOrder.orderId,
      event_id: eventId,
      form_data: formData,
      customer_email: contactEmail,
      status: 'pending',
    })

    return NextResponse.json({
      orderId: sveaOrder.orderId,
      snippet: sveaOrder.gui.snippet,
      clientOrderNumber,
    })
  } catch (err) {
    console.error('Svea create order error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create payment' },
      { status: 500 },
    )
  }
}
