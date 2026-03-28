import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { PAGE_QUERY } from '@/sanity/lib/queries'
import { PortableText } from '@portabletext/react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Om oss — Kylutbildningen',
}

const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=A+Odhners+gata+7,+421+30+V%C3%A4stra+Fr%C3%B6lunda'

const usps = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    title: 'INCERT-godkänt',
    text: 'Examinationscenter för alla kategorier 1–5',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Sedan 1997',
    text: 'Utbildat yrkesverksamma i nästan 30 år',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: 'Allt på samma plats',
    text: 'Preparandkurser och examinering i Göteborg',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: 'Hela Sverige',
    text: 'Deltagare välkomna från norr till söder',
  },
]

export default async function OmOssPage() {
  const pageData = await client.fetch(PAGE_QUERY, { slug: 'om-oss' }, { next: { revalidate: 3600 } })

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
            style={{ fontSize: 'clamp(28px, 5vw, 64px)' }}>
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
                <div className="w-9 h-9 mb-3 flex items-center justify-center rounded-lg"
                  style={{ background: 'var(--navy)' }}>
                  {usp.icon}
                </div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--navy)' }}>
                  {usp.title}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {usp.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Innehåll */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-start">

          {/* Vänster — PortableText (2/3) */}
          <div className="md:col-span-2 prose prose-sm max-w-none leading-relaxed"
            style={{ color: 'var(--muted)' }}>
            {pageData?.content && <PortableText value={pageData.content} />}
          </div>

          {/* Höger — Kontakt + karta (1/3) */}
          <div className="space-y-4">
            {/* Kontaktkort */}
            <div className="rounded-lg overflow-hidden"
              style={{ border: '1px solid #DDE4ED' }}>
              <div className="px-6 py-4" style={{ background: 'var(--navy)' }}>
                <p className="text-[11px] font-bold tracking-widest uppercase text-[#00C4FF]">
                  Kontakt & besök
                </p>
              </div>
              <div className="p-6 space-y-5 bg-white">
                {/* Adress */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#F0F3F7' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A5EA8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider uppercase mb-1" style={{ color: 'var(--muted)' }}>
                      Adress
                    </p>
                    <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                      Kylutbildningen i Göteborg AB
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      A Odhners gata 7
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      421 30 Västra Frölunda
                    </p>
                  </div>
                </div>

                {/* CTA — kontakta via assistenten */}
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Kontakta oss via vår kursassistent — klicka på chatikonen i hörnet.
                </p>
              </div>
            </div>

            {/* Hitta hit — Google Maps-länk */}
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer"
              className="group block rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ border: '1px solid #DDE4ED' }}>
              <div className="relative h-40 bg-[#E8F1FB] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--navy)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                    A Odhners gata 7, Västra Frölunda
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 bg-white flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: '#1A5EA8' }}>
                  Öppna i Google Maps
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#1A5EA8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
