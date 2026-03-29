import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { sanityFetch } from '@/sanity/lib/live'
import { COURSE_PAGE_QUERY, ALL_COURSE_SLUGS_QUERY } from '@/sanity/lib/queries'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { EventCard } from '@/components/kurser/EventCard'
import { DaySchedule } from '@/components/kurser/DaySchedule'
import { InfoTabs } from '@/components/kurser/InfoTabs'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import { CourseSectionNav } from '@/components/kurser/CourseSectionNav'
import type { EventCard as EventCardType } from '@/types/eduadmin'

export const revalidate = 60

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await client.fetch(ALL_COURSE_SLUGS_QUERY)
  return slugs.map((s: { slug: string }) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = await client.fetch(COURSE_PAGE_QUERY, { slug })
  if (!course) return {}
  return {
    title: `${course.title} — F-gas certifiering Göteborg`,
    description: course.shortDescription || `Boka ${course.title} i Göteborg. INCERT-godkänd examinering.`,
    alternates: { canonical: `https://kylutbildningen.se/kurser/${slug}` },
    openGraph: {
      title: course.title,
      description: course.shortDescription || `Boka ${course.title} i Göteborg.`,
      url: `https://kylutbildningen.se/kurser/${slug}`,
      siteName: 'Kylutbildningen i Göteborg AB',
      locale: 'sv_SE',
      type: 'website',
    },
  }
}

// Default section order when no layout is defined in Sanity
const DEFAULT_LAYOUT = [
  { sectionType: 'snabbfakta', visible: false },
  { sectionType: 'beskrivning', visible: true },
  { sectionType: 'omUtbildningen', visible: true },
  { sectionType: 'innehall', visible: true },
  { sectionType: 'upplagg', visible: true },
  { sectionType: 'certifiering', visible: true },
  { sectionType: 'lodprov', visible: true },
  { sectionType: 'dagSchema', visible: true },
  { sectionType: 'infoFlikar', visible: true },
  { sectionType: 'kommandeTillfallen', visible: true },
]

export default async function CourseSlugPage({ params }: PageProps) {
  const { slug } = await params
  const [courseResult, allEvents] = await Promise.all([
    sanityFetch({ query: COURSE_PAGE_QUERY, params: { slug } }),
    getUpcomingEvents().catch(() => []),
  ])

  const course = courseResult.data
  if (!course) notFound()

  const events = allEvents
    .filter(e => e.courseTemplateId === course.eduAdminCourseTemplateId && !e.cancelled)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  const layout = course.layout?.length ? course.layout : DEFAULT_LAYOUT

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription || `${course.title} — INCERT-godkänd examinering i Göteborg.`,
    provider: {
      '@type': 'Organization',
      name: 'Kylutbildningen i Göteborg AB',
      url: 'https://kylutbildningen.se',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'A Odhners gata 7',
        postalCode: '421 30',
        addressLocality: 'Västra Frölunda',
        addressCountry: 'SE',
      },
    },
    offers: events.map(e => ({
      '@type': 'Offer',
      price: e.lowestPrice,
      priceCurrency: 'SEK',
      availability: e.isFullyBooked
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      validFrom: e.startDate,
      url: `https://kylutbildningen.se/boka/${e.eventId}`,
    })),
    hasCourseInstance: events.map(e => ({
      '@type': 'CourseInstance',
      courseMode: 'onsite',
      location: {
        '@type': 'Place',
        name: 'Kylutbildningen Göteborg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'A Odhners gata 7',
          postalCode: '421 30',
          addressLocality: 'Västra Frölunda',
          addressCountry: 'SE',
        },
      },
      startDate: e.startDate,
      endDate: e.endDate,
      instructor: {
        '@type': 'Organization',
        name: 'Kylutbildningen i Göteborg AB',
      },
    })),
  }

  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ background: '#FAFBFC' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <SiteHeader />

      {/* Header */}
      <div className="pt-16 pb-12" style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <Link href="/kurser" className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.45)' }}>
            ← Alla kurser
          </Link>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
            {course.title}
          </h1>
          {course.shortDescription && (
            <p className="mt-4 text-base font-light max-w-2xl" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {course.shortDescription}
            </p>
          )}
        </div>
      </div>

      <CourseSectionNav sectionTypes={layout.filter((s: { visible: boolean }) => s.visible !== false).map((s: { sectionType: string }) => s.sectionType)} />

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12 flex-grow">
        {(() => {
          const twoColTypes = new Set(['upplagg', 'innehall'])
          const visibleSections = layout.filter(
            (s: { sectionType: string; visible: boolean }) => s.visible !== false
          )

          // Check if the two-column sections have content
          const showUpplagg = visibleSections.some((s: { sectionType: string }) => s.sectionType === 'upplagg') && (course.upplagg?.length > 0 || course.upplaggText)
          const showInnehall = visibleSections.some((s: { sectionType: string }) => s.sectionType === 'innehall') && course.innehall?.length > 0
          const showTwoCol = showUpplagg && showInnehall

          const elements: React.ReactNode[] = []
          let twoColRendered = false

          for (let i = 0; i < visibleSections.length; i++) {
            const section = visibleSections[i]

            // When we hit the first two-col section, render the grid
            if (twoColTypes.has(section.sectionType) && !twoColRendered) {
              twoColRendered = true
              if (showTwoCol) {
                elements.push(
                  <div key="two-col" className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                    <div>
                      <InnehallSection course={course} />
                    </div>
                    <div>
                      <UpplaggSection course={course} />
                    </div>
                  </div>
                )
              } else {
                // Not enough content for two columns — render individually
                elements.push(<UpplaggSection key="upplagg" course={course} />)
                elements.push(<InnehallSection key="innehall" course={course} />)
              }
              continue
            }

            // Skip remaining two-col types (already rendered above)
            if (twoColTypes.has(section.sectionType)) continue

            switch (section.sectionType) {
              case 'snabbfakta':
                elements.push(<SnabbfaktaSection key={i} course={course} />)
                break
              case 'beskrivning':
                elements.push(<BeskrivningSection key={i} course={course} />)
                break
              case 'omUtbildningen':
                elements.push(<OmUtbildningenSection key={i} course={course} />)
                break
              case 'dagSchema':
                elements.push(<DagSchemaSection key={i} course={course} />)
                break
              case 'certifiering':
                elements.push(<CertifieringSection key={i} course={course} />)
                break
              case 'lodprov':
                elements.push(<LodprovSection key={i} course={course} />)
                break
              case 'infoFlikar':
                elements.push(<InfoFlikarSection key={i} course={course} />)
                break
              case 'kommandeTillfallen':
                elements.push(<KommandeTillfallenSection key={i} events={events} />)
                break
            }
          }

          return elements
        })()}
      </div>

      <SiteFooter />
    </div>
  )
}

/* ---------- Section components ---------- */

function SnabbfaktaSection({ course }: { course: any }) {
  if (!course.antalDagar && !course.targetGroup && !course.prerequisites) return null
  return (
    <div id="section-snabbfakta" className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden" style={{ background: '#DDE4ED', border: '1px solid #DDE4ED' }}>
      {course.antalDagar && (
        <div className="bg-white p-6">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'var(--muted)' }}>Antal dagar</div>
          <div className="font-condensed font-bold text-2xl" style={{ color: 'var(--navy)' }}>{course.antalDagar}</div>
        </div>
      )}
      {course.targetGroup && (
        <div className="bg-white p-6">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'var(--muted)' }}>Målgrupp</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)' }}>{course.targetGroup}</p>
        </div>
      )}
      {course.prerequisites && (
        <div className="bg-white p-6">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'var(--muted)' }}>Förkunskaper</div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)' }}>{course.prerequisites}</p>
        </div>
      )}
      {course.certifiering?.text && (
        <div className="bg-white p-6">
          <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'var(--muted)' }}>Certifiering</div>
          <div className="text-sm leading-relaxed prose prose-sm" style={{ color: 'var(--navy)' }}>
            <PortableText value={course.certifiering.text} />
          </div>
        </div>
      )}
    </div>
  )
}

function BeskrivningSection({ course }: { course: any }) {
  if (!course.description) return null
  return (
    <div id="section-beskrivning">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Beskrivning</h2>
      <div className="text-[15px] leading-relaxed prose prose-sm" style={{ color: 'var(--muted)' }}>
        <PortableText value={course.description} />
      </div>
    </div>
  )
}

function OmUtbildningenSection({ course }: { course: any }) {
  if (!course.omUtbildningen?.length) return null
  return (
    <div id="section-omUtbildningen">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Om utbildningen</h2>
      <div className="text-[15px] leading-relaxed prose prose-sm" style={{ color: 'var(--muted)' }}>
        <PortableText value={course.omUtbildningen} />
      </div>
    </div>
  )
}

function InnehallSection({ course }: { course: any }) {
  if (!course.innehall?.length) return null
  return (
    <div id="section-innehall">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Innehåll — vad vi går igenom</h2>
      <ul className="space-y-2">
        {course.innehall.map((item: string, i: number) => (
          <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--blue)' }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function UpplaggSection({ course }: { course: any }) {
  if (!course.upplagg?.length && !course.upplaggText) return null
  return (
    <div id="section-upplagg">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Upplägg — dag för dag</h2>
      {course.upplagg?.length > 0 && (
        <div className="space-y-3 mb-4">
          {course.upplagg.map((item: string, i: number) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg" style={{ background: 'var(--gray-bg)' }}>
              <span className="font-condensed font-bold text-lg flex-shrink-0" style={{ color: 'var(--blue)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{item}</span>
            </div>
          ))}
        </div>
      )}
      {course.upplaggText && (
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{course.upplaggText}</p>
      )}
    </div>
  )
}

function CertifieringSection({ course }: { course: any }) {
  if (!course.certifiering?.text && !course.certifiering?.highlightText) return null
  return (
    <div id="section-certifiering">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
        Certifiering
      </h2>

      {course.certifiering.text && (
        <div className="text-sm leading-relaxed prose prose-sm" style={{ color: 'var(--muted)' }}>
          <PortableText value={course.certifiering.text} />
        </div>
      )}

      {course.certifiering.highlightText && (
        <div className="mt-4 p-4 text-sm leading-relaxed rounded-r-md"
          style={{
            background: '#F0F5FF',
            borderLeft: '3px solid #1A5EA8',
            color: '#0C447C',
          }}>
          {course.certifiering.highlightText}
        </div>
      )}
    </div>
  )
}

function LodprovSection({ course }: { course: any }) {
  if (!course.lodprov) return null
  return (
    <div id="section-lodprov">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Lödprov</h2>
      <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>{course.lodprov}</p>
    </div>
  )
}

function DagSchemaSection({ course }: { course: any }) {
  if (!course.dagSchema?.length) return null
  return (
    <div id="section-dagSchema">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Schema</h2>
      <DaySchedule dagar={course.dagSchema} />
    </div>
  )
}

function InfoFlikarSection({ course }: { course: any }) {
  if (!course.infoFlikar?.length) return null
  return (
    <div id="section-infoFlikar">
      <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>Information</h2>
      <InfoTabs flikar={course.infoFlikar} />
    </div>
  )
}

function KommandeTillfallenSection({ events }: { events: EventCardType[] }) {
  return (
    <div id="section-kommandeTillfallen">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="font-condensed font-bold uppercase text-2xl" style={{ color: 'var(--navy)' }}>Kommande tillfällen</h2>
        <div className="flex-1 h-px" style={{ background: '#DDE4ED' }} />
      </div>
      {events.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>
          Inga kommande tillfällen just nu. Hör av dig till oss så löser vi det.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map(event => (
            <EventCard key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
