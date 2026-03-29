import type { Metadata } from 'next'
import { ContactForm } from '@/components/kontakt/ContactForm'
import { CallbackForm } from '@/components/kontakt/CallbackForm'

export const metadata: Metadata = {
  title: 'Kontakta Kylutbildningen — Frågor om kurser och certifiering',
  description: 'Kontakta Kylutbildningen i Göteborg AB med frågor om F-gas certifiering, kursbokningar och examineringsprov.',
  alternates: { canonical: 'https://kylutbildningen.com/kontakt' },
  openGraph: {
    title: 'Kontakta Kylutbildningen',
    description: 'Frågor om F-gas certifiering och kursbokningar.',
    url: 'https://kylutbildningen.com/kontakt',
    siteName: 'Kylutbildningen i Göteborg AB',
    locale: 'sv_SE',
    type: 'website',
  },
}

export default function KontaktPage() {
  return (
    <main className="flex-grow flex flex-col">
      {/* Hero */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-2.5 text-[11px] font-bold
            tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Kontakt
          </div>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(28px, 5vw, 64px)' }}>
            Hur kan vi hjälpa dig?
          </h1>
          <p className="mt-4 text-lg font-light max-w-xl"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Skicka ett meddelande eller lämna ditt nummer så
            återkommer vi inom en arbetsdag.
          </p>
        </div>
      </div>

      {/* Tvåkolumns-layout */}
      <div className="max-w-6xl mx-auto px-6 py-16 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* VÄNSTER — Skicka meddelande */}
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-2"
              style={{ color: 'var(--navy)' }}>
              Skicka ett meddelande
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Fyll i formuläret så återkommer vi inom en arbetsdag.
            </p>
            <ContactForm />
          </div>

          {/* HÖGER — Ring mig upp */}
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-2"
              style={{ color: 'var(--navy)' }}>
              Vill du bli uppringd?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Lämna ditt nummer så ringer vi upp dig inom samma arbetsdag.
            </p>
            <CallbackForm />
          </div>

        </div>

        {/* Kontaktinfo */}
        <div className="mt-16 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>E-post</div>
            <a href="mailto:info@kylutbildningen.se"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--navy)' }}>
              info@kylutbildningen.se
            </a>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>Telefon</div>
            <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
              031-795 32 00
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>Adress</div>
            <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
              Göteborg
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
