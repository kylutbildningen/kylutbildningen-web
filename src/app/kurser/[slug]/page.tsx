import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { COURSE_PAGE_QUERY, ALL_COURSE_SLUGS_QUERY } from '@/sanity/lib/queries'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { EventCard } from '@/components/kurser/EventCard'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'

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
    title: `${course.title} — Kylutbildningen`,
    description: course.shortDescription ?? undefined,
  }
}

export default async function CourseSlugPage({ params }: PageProps) {
  const { slug } = await params
  const [course, allEvents] = await Promise.all([
    client.fetch(COURSE_PAGE_QUERY, { slug }),
    getUpcomingEvents().catch(() => []),
  ])

  if (!course) notFound()

  const events = allEvents
    .filter(e => e.courseTemplateId === course.eduAdminCourseTemplateId && !e.cancelled)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      {/* Header */}
      <div className="pt-16 pb-12 px-18" style={{ background: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto">
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

      <div className="max-w-4xl mx-auto px-18 py-12 space-y-12">

        {/* Snabbfakta */}
        {(course.antalDagar || course.targetGroup || course.prerequisites || course.certifiering) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-lg overflow-hidden" style={{ background: '#DDE4ED', border: '1px solid #DDE4ED' }}>
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
            {course.certifiering && (
              <div className="bg-white p-6">
                <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: 'var(--muted)' }}>Certifiering</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)' }}>{course.certifiering}</p>
              </div>
            )}
          </div>
        )}

        {/* Beskrivning (PortableText) */}
        {course.description && (
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
              Beskrivning
            </h2>
            <div className="text-[15px] leading-relaxed prose prose-sm" style={{ color: 'var(--muted)' }}>
              <PortableText value={course.description} />
            </div>
          </div>
        )}

        {/* Om utbildningen */}
        {course.omUtbildningen && (
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
              Om utbildningen
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {course.omUtbildningen}
            </p>
          </div>
        )}

        {/* Innehåll */}
        {course.innehall && course.innehall.length > 0 && (
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
              Innehåll — vad vi går igenom
            </h2>
            <ul className="space-y-2">
              {course.innehall.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--blue)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upplägg */}
        {((course.upplagg && course.upplagg.length > 0) || course.upplaggText) && (
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
              Upplägg — dag för dag
            </h2>
            {course.upplagg && course.upplagg.length > 0 && (
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
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                {course.upplaggText}
              </p>
            )}
          </div>
        )}

        {/* Lödprov */}
        {course.lodprov && (
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-4" style={{ color: 'var(--navy)' }}>
              Lödprov
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {course.lodprov}
            </p>
          </div>
        )}

        {/* Kommande tillfällen */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-condensed font-bold uppercase text-2xl" style={{ color: 'var(--navy)' }}>
              Kommande tillfällen
            </h2>
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

      </div>

      <SiteFooter />
    </div>
  )
}
