import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getEvent } from '@/lib/eduadmin'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { eventId, formData } = await req.json()

    const eventData = await getEvent(eventId)
    if (!eventData) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
    const isCompany = formData.customerType === 'company'
    const contactEmail = isCompany ? formData.company.contactEmail : formData.private.email
    const participantCount = formData.participants.length
    const unitPriceKr = eventData.eventCard.lowestPrice ?? 0

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: contactEmail,
      locale: 'sv',
      line_items: Array.from({ length: participantCount }, () => ({
        price_data: {
          currency: 'sek',
          product_data: {
            name: eventData.eventCard.courseName ?? 'Kursplats',
            description: `${eventData.eventCard.city ?? ''} — ${new Date(eventData.eventCard.startDate).toLocaleDateString('sv-SE')} – ${new Date(eventData.eventCard.endDate).toLocaleDateString('sv-SE')}`,
          },
          unit_amount: Math.round(unitPriceKr * 100),
        },
        quantity: 1,
      })),
      payment_intent_data: {
        receipt_email: contactEmail,
      },
      success_url: `${siteUrl}/boka/${eventId}/bekraftelse?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/boka/${eventId}`,
      metadata: {
        eventId: eventId.toString(),
      },
    })

    // Save session + full form data in Supabase
    const supabase = createSupabaseAdmin()
    await supabase.from('stripe_sessions').insert({
      stripe_session_id: session.id,
      event_id: eventId,
      form_data: formData,
      customer_email: contactEmail,
      status: 'pending',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe create checkout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create payment' },
      { status: 500 },
    )
  }
}
