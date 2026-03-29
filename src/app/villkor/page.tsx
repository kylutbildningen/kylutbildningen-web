import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Villkor & personuppgiftspolicy — Kylutbildningen',
}

export default function VillkorPage() {
  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      {/* Hero */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-2.5 text-[11px] font-bold
            tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Juridiskt
          </div>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>
            Villkor & personuppgiftspolicy
          </h1>
          <p className="mt-4 text-sm font-light"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Senast uppdaterad: 2025-01-16
          </p>
        </div>
      </div>

      {/* Innehåll */}
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12 flex-grow">

        {/* Anmälan */}
        <section>
          <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
            style={{ color: 'var(--navy)' }}>
            Anmälan
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Skicka in din anmälan senast en vecka före kursstart. Antalet platser är
            begränsat och vi tar emot anmälningar så länge platser finns tillgängliga.
          </p>
        </section>

        {/* Avbokning */}
        <section>
          <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
            style={{ color: 'var(--navy)' }}>
            Avbokning
          </h2>
          <div className="space-y-3">
            {[
              'Avbokning mer än 14 dagar före kursstart är kostnadsfri.',
              'Avbokning senare än 14 dagar före kursstart debiteras full avgift.',
              'Du kan kostnadsfritt överlåta din plats till en annan person.',
              'Du kan flytta till ett annat kursdatum utan extra kostnad.',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: '#1A5EA8' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            Om för få deltagare anmält sig förbehåller vi oss rätten att ställa in
            utbildningen — i så fall återbetalas hela kursavgiften.
          </p>
        </section>

        {/* Betalning */}
        <section>
          <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
            style={{ color: 'var(--navy)' }}>
            Betalning
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
            Vi erbjuder betalning via Stripe med följande alternativ:
            kortbetalning (Visa, Mastercard) och Klarna (faktura/delbetalning).
            Betalningen hanteras säkert av Stripe och din kortinformation
            lagras aldrig hos oss. Läs mer i{' '}
            <a href="https://stripe.com/se/privacy"
              target="_blank" rel="noopener noreferrer"
              className="text-[#1A5EA8] hover:underline">
              Stripes integritetspolicy
            </a>.
          </p>
        </section>

        {/* Personuppgifter */}
        <section>
          <h2 className="font-condensed font-bold uppercase text-2xl mb-4"
            style={{ color: 'var(--navy)' }}>
            Hantering av personuppgifter
          </h2>
          <div className="space-y-4 text-sm leading-relaxed"
            style={{ color: 'var(--muted)' }}>
            <p>
              Kylutbildningen i Göteborg AB är personuppgiftsansvarig. Vi samlar
              endast in uppgifter som är nödvändiga — namn, adress, e-post, telefon
              och faktureringsuppgifter — för att fullfölja våra åtaganden mot dig
              och följa gällande lagar.
            </p>
            <p>
              Vi delar inte dina uppgifter med tredje part utan ditt samtycke och
              använder dem inte för direktmarknadsföring. Vi har tekniska
              säkerhetsåtgärder på plats för att skydda dina personuppgifter mot
              obehörig åtkomst.
            </p>
            <p>
              Har du frågor om hur vi hanterar dina personuppgifter?
              Kontakta oss på{' '}
              <a href="mailto:info@kylutbildningen.se"
                className="text-[#1A5EA8] hover:underline">
                info@kylutbildningen.se
              </a>
            </p>
          </div>
        </section>

      </div>

      <SiteFooter />
    </div>
  )
}
