import type { Metadata } from 'next'
import Link from 'next/link'
import { sanityFetch } from '@/sanity/lib/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { OpenChatButton } from '@/components/kontakt/OpenChatButton'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Kontakt — Kylutbildningen i Göteborg AB',
  description:
    'Kontakta Kylutbildningen i Göteborg AB. INCERT-godkänt examinationscenter på A Odhners gata 7, Västra Frölunda. Ring, mejla eller chatta med oss direkt.',
  alternates: { canonical: 'https://kylutbildningen.se/kontakt' },
  openGraph: {
    title: 'Kontakt — Kylutbildningen i Göteborg AB',
    description:
      'Kontakta oss. INCERT-godkänt examinationscenter i Göteborg sedan 1997.',
    url: 'https://kylutbildningen.se/kontakt',
    siteName: 'Kylutbildningen i Göteborg AB',
    locale: 'sv_SE',
    type: 'website',
  },
}

const ADDRESS = {
  street: 'A Odhners gata 7',
  postalCode: '421 30',
  city: 'Västra Frölunda',
  country: 'SE',
}

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=A+Odhners+gata+7,+421+30+V%C3%A4stra+Fr%C3%B6lunda'

const EMAIL = 'info@kylutbildningen.se'
const PHONE_DISPLAY = '031-47 26 36'
const PHONE_E164 = '+46314726 36'.replace(/\s+/g, '')

export default async function KontaktPage() {
  const settingsResult = await sanityFetch({ query: SITE_SETTINGS_QUERY }).catch(
    () => ({ data: null })
  )
  const settings = settingsResult.data
  const email: string = settings?.contactEmail ?? EMAIL
  const phoneDisplay: string = settings?.contactPhone ?? PHONE_DISPLAY
  const phoneE164: string = phoneDisplay.startsWith('+')
    ? phoneDisplay.replace(/\s+/g, '')
    : PHONE_E164

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Kylutbildningen i Göteborg AB',
    description:
      'INCERT-godkänt examinationscenter för F-gascertifiering i Göteborg sedan 1997.',
    url: 'https://kylutbildningen.se',
    email,
    telephone: phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ADDRESS.street,
      postalCode: ADDRESS.postalCode,
      addressLocality: ADDRESS.city,
      addressCountry: ADDRESS.country,
    },
    areaServed: 'SE',
    foundingDate: '1997',
  }

  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ background: '#FAFBFC' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <SiteHeader />

      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Kontakt
          </div>
          <h1
            className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}
          >
            Hör av dig
          </h1>
          <p className="mt-4 text-base font-light max-w-2xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
            INCERT-godkänt examinationscenter i Göteborg. Ring, mejla, eller chatta med oss direkt
            på sajten.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg p-8" style={{ border: '1px solid #DDE4ED' }}>
            <h2
              className="font-condensed font-bold uppercase text-2xl mb-6"
              style={{ color: 'var(--navy)' }}
            >
              Kontaktuppgifter
            </h2>

            <div className="space-y-5">
              <div>
                <div
                  className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1"
                  style={{ color: 'var(--muted)' }}
                >
                  E-post
                </div>
                <a
                  href={`mailto:${email}`}
                  className="text-[15px] hover:underline"
                  style={{ color: 'var(--navy)' }}
                >
                  {email}
                </a>
              </div>

              <div>
                <div
                  className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1"
                  style={{ color: 'var(--muted)' }}
                >
                  Telefon
                </div>
                <a
                  href={`tel:${phoneE164}`}
                  className="text-[15px] hover:underline"
                  style={{ color: 'var(--navy)' }}
                >
                  {phoneDisplay}
                </a>
              </div>

              <div>
                <div
                  className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1"
                  style={{ color: 'var(--muted)' }}
                >
                  Besöksadress
                </div>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] hover:underline"
                  style={{ color: 'var(--navy)' }}
                >
                  {ADDRESS.street}
                  <br />
                  {ADDRESS.postalCode} {ADDRESS.city}
                </a>
              </div>

              <div className="pt-4">
                <OpenChatButton />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8" style={{ border: '1px solid #DDE4ED' }}>
            <h2
              className="font-condensed font-bold uppercase text-2xl mb-6"
              style={{ color: 'var(--navy)' }}
            >
              Om oss
            </h2>
            <p className="text-[15px] leading-relaxed mb-4" style={{ color: 'var(--muted)' }}>
              Kylutbildningen i Göteborg AB är ett INCERT-godkänt examinationscenter för
              F-gascertifiering. Vi erbjuder utbildning och certifiering i alla kategorier 1–5,
              både för nyexaminering och omexaminering.
            </p>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: 'var(--muted)' }}>
              Vi har bedrivit kylutbildning sedan 1997 och hjälpt tusentals kyltekniker att få sin
              certifiering.
            </p>
            <Link
              href="/om-oss"
              className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              style={{ color: 'var(--blue)' }}
            >
              Läs mer om oss →
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
