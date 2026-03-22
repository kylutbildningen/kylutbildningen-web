import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { PAGE_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { PortableText } from '@portabletext/react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Om oss — Kylutbildningen',
}

const ICONS: Record<string, React.ReactNode> = {
  certificate: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  people: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
}

const usps = [
  { icon: 'certificate', text: 'INCERT-godkänt examinationscenter — alla kategorier 1–5' },
  { icon: 'calendar',    text: 'Utbildat yrkesverksamma sedan 1997' },
  { icon: 'location',    text: 'Preparandkurser och examinering på samma plats i Göteborg' },
  { icon: 'people',      text: 'Deltagare välkomna från hela Sverige — norr till söder' },
]

export default async function OmOssPage() {
  const [pageData, siteSettings] = await Promise.all([
    client.fetch(PAGE_QUERY, { slug: 'om-oss' }, { next: { revalidate: 3600 } }),
    client.fetch(SITE_SETTINGS_QUERY, {}, { next: { revalidate: 86400 } }),
  ])

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      {/* Hero */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-2.5 text-[11px] font-bold
            tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Om oss
          </div>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
            {pageData?.heroHeading ?? 'Om oss'}
          </h1>
          {pageData?.heroText && (
            <p className="mt-4 text-lg font-light max-w-2xl"
              style={{ color: 'rgba(255,255,255,0.55)' }}>
              {pageData.heroText}
            </p>
          )}
        </div>
      </div>

      {/* USP-rutor */}
      <div style={{ background: '#F0F3F7', borderBottom: '1px solid #DDE4ED' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {usps.map((usp, i) => (
              <div key={i} className="p-5 rounded-lg bg-white"
                style={{ border: '1px solid #DDE4ED' }}>
                <div className="w-8 h-8 mb-3 flex items-center justify-center rounded"
                  style={{ background: 'var(--navy)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[usp.icon]}
                  </svg>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {usp.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Innehåll */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Vänster — PortableText */}
          <div className="prose prose-sm max-w-none leading-relaxed"
            style={{ color: 'var(--muted)' }}>
            {pageData?.content && <PortableText value={pageData.content} />}
          </div>

          {/* Höger — Kontaktkort */}
          <div className="rounded-lg p-8"
            style={{ background: '#F0F3F7', border: '1px solid #DDE4ED' }}>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-6"
              style={{ color: '#1A5EA8' }}>
              Kontakt
            </div>
            {siteSettings?.contactEmail && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold tracking-wider uppercase mb-1"
                  style={{ color: 'var(--muted)' }}>E-post</div>
                <a href={`mailto:${siteSettings.contactEmail}`}
                  className="font-semibold text-[#1A5EA8] hover:underline">
                  {siteSettings.contactEmail}
                </a>
              </div>
            )}
            {siteSettings?.contactPhone && (
              <div className="mb-5">
                <div className="text-[11px] font-semibold tracking-wider uppercase mb-1"
                  style={{ color: 'var(--muted)' }}>Telefon</div>
                <p className="font-semibold" style={{ color: 'var(--navy)' }}>
                  {siteSettings.contactPhone}
                </p>
              </div>
            )}
            {siteSettings?.address && (
              <div>
                <div className="text-[11px] font-semibold tracking-wider uppercase mb-1"
                  style={{ color: 'var(--muted)' }}>Adress</div>
                <p className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: 'var(--muted)' }}>
                  {siteSettings.address}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
