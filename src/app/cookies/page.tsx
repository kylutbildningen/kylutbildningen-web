import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Cookiepolicy — Kylutbildningen',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <h1 className="font-condensed font-bold uppercase text-white"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
            Cookiepolicy
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <section>
          <h2 className="font-condensed font-bold uppercase text-xl mb-3"
            style={{ color: 'var(--navy)' }}>
            Vad är cookies?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Cookies är små textfiler som lagras i din webbläsare när du besöker en webbplats.
            De används för att webbplatsen ska fungera korrekt och för att förbättra
            din upplevelse.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold uppercase text-xl mb-3"
            style={{ color: 'var(--navy)' }}>
            Vilka cookies använder vi?
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
            Vi använder enbart nödvändiga cookies som krävs för att siten ska fungera:
          </p>
          <div className="rounded-lg overflow-hidden border"
            style={{ borderColor: '#DDE4ED' }}>
            <div className="grid grid-cols-3 gap-px bg-gray-200">
              {[
                ['Namn', 'Syfte', 'Varaktighet'],
                ['cookie-consent', 'Sparar ditt val om cookies', '1 år'],
                ['sb-access-token', 'Inloggningssession (Supabase)', 'Session'],
                ['sb-refresh-token', 'Förnyar inloggning (Supabase)', '7 dagar'],
              ].map((row, i) => (
                row.map((cell, j) => (
                  <div key={`${i}-${j}`}
                    className={`px-4 py-3 text-xs ${i === 0
                      ? 'font-bold uppercase tracking-wider bg-gray-50'
                      : 'bg-white'}`}
                    style={{ color: i === 0 ? '#1A5EA8' : 'var(--muted)' }}>
                    {cell}
                  </div>
                ))
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-condensed font-bold uppercase text-xl mb-3"
            style={{ color: 'var(--navy)' }}>
            Hur hanterar du cookies?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Du kan när som helst radera cookies i din webbläsares inställningar.
            Observera att vissa funktioner på siten kan sluta fungera om du
            inaktiverar nödvändiga cookies.
          </p>
        </section>

        <section>
          <h2 className="font-condensed font-bold uppercase text-xl mb-3"
            style={{ color: 'var(--navy)' }}>
            Kontakt
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Har du frågor om vår cookiepolicy? Kontakta oss på{' '}
            <a href="mailto:info@kylutbildningen.se"
              className="text-[#1A5EA8] hover:underline">
              info@kylutbildningen.se
            </a>
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  )
}
