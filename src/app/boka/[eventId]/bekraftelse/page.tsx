import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { getStripe } from '@/lib/stripe'
import Link from 'next/link'
import { BookingConversionTracker } from './ConversionTracker'

export default async function BekraftelseSida({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  let customerEmail: string | null = null

  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id)
      customerEmail = session.customer_email ?? null
    } catch {
      // Session not found or expired — show page without email
    }
  }

  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <h1 className="font-condensed font-bold uppercase text-white"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
            Bokning bekräftad!
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center flex-grow">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: '#F0F5FF' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#1A5EA8" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <BookingConversionTracker />
        <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
          style={{ color: 'var(--navy)' }}>
          Tack för din bokning!
        </h2>

        {customerEmail && (
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            Kvitto skickat till <strong>{customerEmail}</strong>
          </p>
        )}

        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Du kommer att få en kursbekräftelse via e-post inom kort.
          Välkommen till oss!
        </p>

        <Link href="/kurser"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold
            tracking-wider uppercase text-white rounded transition-colors"
          style={{ background: 'var(--navy)' }}>
          Se fler kurser
        </Link>
      </div>

      <SiteFooter />
    </div>
  )
}
