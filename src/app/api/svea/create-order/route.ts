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
      currency: 'SEK' as const,
      locale: 'sv-SE' as const,
      countryCode: 'SE' as const,
      clientOrderNumber,
      merchantSettings: {
        pushUri: `${siteUrl}/api/svea/callback/{checkout.order.uri}`,
        termsUri: `${siteUrl}/villkor`,
        checkoutUri: `${siteUrl}/boka/${eventId}`,
        confirmationUri: `${siteUrl}/boka/${eventId}/bekraftelse?order={checkout.order.uri}`,
      },
      cart: {
        items: Array.from({ length: participantCount }, (_, i) => ({
          articleNumber: `KURS-${eventId}-${i + 1}`,
          name: eventData.eventCard.courseName ?? 'Kursplats',
          quantity: 100,
          unitPrice: unitPriceKr * 100,
          discountPercent: 0,
          vatPercent: 2500,
          unit: 'st' as const,
        })),
      },
      presetValues: [
        { key: 'emailAddress', value: contactEmail, isReadonly: false },
        ...(contactPhone ? [{ key: 'phoneNumber', value: contactPhone, isReadonly: false }] : []),
      ],
    }

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
