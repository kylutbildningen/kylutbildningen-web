import Link from 'next/link'
import Image from 'next/image'
import { HeroUpcomingPanel } from './HeroUpcomingPanel'
import { ScrollArrow } from './ScrollArrow'
import { urlFor } from '@/sanity/lib/image'
import type { EventCard } from '@/types/eduadmin'

interface SanityImage {
  asset: { _ref: string }
  alt?: string
}

interface Props {
  heading?: string
  subheading?: string
  ctaText?: string
  heroImage?: SanityImage | null
  events: EventCard[]
}

export function HeroSection({ heading, subheading, ctaText, heroImage, events }: Props) {
  return (
    <section className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden"
      style={{ background: 'var(--navy)' }}>

      {/* Bakgrundsbild från Sanity */}
      {heroImage?.asset && (
        <div className="absolute inset-0">
          <Image
            src={urlFor(heroImage).width(1920).url()}
            alt={heroImage.alt ?? ''}
            fill
            className="object-cover"
            priority
            style={{ opacity: 0.7 }}
          />
        </div>
      )}

      {/* Grid-lines bakgrund */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      {/* Vänster — text */}
      <div className="relative z-10 flex flex-col justify-center pt-20 pb-20 max-w-6xl mx-auto px-6">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-sm w-fit"
          style={{ background: 'rgba(0,196,255,0.1)', border: '1px solid rgba(0,196,255,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C4FF] animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#00C4FF]">
            INCERT-godkänt examinationscenter
          </span>
        </div>

        {/* Rubrik */}
        <h1 className="font-condensed font-extrabold uppercase leading-[0.95] tracking-tight text-white mb-6"
          style={{ fontSize: 'clamp(36px, 6vw, 80px)' }}>
          {heading ?? <>Certifiering<br />för <span className="text-[#00C4FF]">kyl</span><br />branschen</>}
        </h1>

        <p className="text-lg font-light leading-relaxed mb-12 max-w-sm"
          style={{ color: 'rgba(255,255,255,0.55)' }}>
          {subheading ?? 'Vi utbildar och examinerar kyltekniker inom alla F-gas-kategorier 1–5 i Göteborg.'}
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Link href="/kurser"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-[#1A5EA8] hover:bg-[#2A7DD4] text-white text-sm font-semibold tracking-wider uppercase rounded transition-all hover:-translate-y-px">
            {ctaText ?? 'Se alla kurser'}
            <ArrowIcon />
          </Link>
          <Link href="/om-oss"
            className="text-sm font-medium tracking-wider uppercase pb-0.5 transition-colors text-center sm:text-left"
            style={{ color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            Om oss
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-0 mt-16 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { num: '1–5', label: 'Alla kategorier' },
            { num: '100%', label: 'INCERT-certifierat' },
            { num: 'GBG', label: 'Göteborg' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 pr-8 mr-8"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="font-condensed font-bold text-4xl text-white leading-none tracking-tight">
                {stat.num}
              </div>
              <div className="text-xs font-medium tracking-widest uppercase mt-1"
                style={{ color: 'rgba(255,255,255,0.7)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Höger — live-panel */}
      <div className="relative z-10 flex items-center justify-center px-6 pb-16 lg:pt-20 lg:pb-20 lg:pr-16 lg:px-0">
        <HeroUpcomingPanel events={events} />
      </div>

      {/* Scroll-pil */}
      <ScrollArrow />
    </section>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}
