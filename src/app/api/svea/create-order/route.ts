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
      CountryCode: 'SE',
      Currency: 'SEK',
      Locale: 'sv-se',
      ClientOrderNumber: clientOrderNumber,
      MerchantSettings: {
        PushUri: `${siteUrl}/api/svea/callback/{checkout.order.uri}`,
        TermsUri: `${siteUrl}/villkor`,
        CheckoutUri: `${siteUrl}/boka/${eventId}`,
        ConfirmationUri: `${siteUrl}/boka/${eventId}/bekraftelse?order={checkout.order.uri}`,
      },
      Cart: {
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
        { typeName: 'EmailAddress', value: contactEmail, isReadonly: false },
        ...(contactPhone ? [{ typeName: 'PhoneNumber', value: contactPhone, isReadonly: false }] : []),
      ],
    }

    const sveaOrder = await createSveaOrder(orderData)

    // Save order mapping in Supabase
    const supabase = createSupabaseAdmin()
    await supabase.from('svea_orders').insert({
      client_order_number: clientOrderNumber,
      svea_order_id: sveaOrder.OrderId,
      event_id: eventId,
      form_data: formData,
      customer_email: contactEmail,
      status: 'pending',
    })

    return NextResponse.json({
      orderId: sveaOrder.OrderId,
      snippet: sveaOrder.Gui.Snippet,
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
