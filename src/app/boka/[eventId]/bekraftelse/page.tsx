import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import Link from 'next/link'

export default function BekraftelseSida() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <h1 className="font-condensed font-bold uppercase text-white"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
            Bokning bekräftad!
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background: '#F0F5FF' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#1A5EA8" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
          style={{ color: 'var(--navy)' }}>
          Tack för din bokning!
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
          Du kommer att få en bekräftelse via e-post inom kort.
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
