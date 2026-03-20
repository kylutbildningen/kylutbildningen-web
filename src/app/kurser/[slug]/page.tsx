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

        {/* Beskrivning */}
        {(course.description || course.targetGroup || course.prerequisites) && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {course.description && (
              <div>
                <h2 className="font-condensed font-bold uppercase text-lg mb-3" style={{ color: 'var(--navy)' }}>
                  Om kursen
                </h2>
                <div className="text-sm leading-relaxed prose prose-sm" style={{ color: 'var(--muted)' }}>
                  <PortableText value={course.description} />
                </div>
              </div>
            )}
            <div className="space-y-6">
              {course.targetGroup && (
                <div>
                  <h2 className="font-condensed font-bold uppercase text-lg mb-2" style={{ color: 'var(--navy)' }}>
                    Målgrupp
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{course.targetGroup}</p>
                </div>
              )}
              {course.prerequisites && (
                <div>
                  <h2 className="font-condensed font-bold uppercase text-lg mb-2" style={{ color: 'var(--navy)' }}>
                    Förkunskaper
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{course.prerequisites}</p>
                </div>
              )}
            </div>
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
