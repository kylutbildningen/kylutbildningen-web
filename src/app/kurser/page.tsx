import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { groupEventsByCategoryAndCourse } from '@/lib/groupEvents'
import { CategorySection } from '@/components/kurser/CategorySection'
import { CourseFilter } from '@/components/kurser/CourseFilter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { client } from '@/sanity/lib/client'
import { COURSE_TEMPLATE_SLUG_MAP_QUERY } from '@/sanity/lib/queries'
import type { EventCard } from '@/types/eduadmin'

export const metadata: Metadata = {
  title: 'Kommande kylkurser i Göteborg — Boka F-gas certifiering online',
  description: 'Se alla tillgängliga kylkurser i Göteborg. Nyexaminering och omexaminering Kategori I, II och V. Boka din plats direkt online.',
  alternates: { canonical: 'https://kylutbildningen.com/kurser' },
  openGraph: {
    title: 'Kommande kylkurser i Göteborg',
    description: 'Nyexaminering och omexaminering Kategori I, II och V. Boka online.',
    url: 'https://kylutbildningen.com/kurser',
    siteName: 'Kylutbildningen i Göteborg AB',
    locale: 'sv_SE',
    type: 'website',
  },
}

export const revalidate = 60

function filterEvents(
  events: EventCard[],
  params: { category?: string; city?: string; q?: string; from?: string; to?: string }
): EventCard[] {
  let filtered = events

  if (params.category) {
    filtered = filtered.filter(e => e.categoryName.toLowerCase() === params.category!.toLowerCase())
  }
  if (params.city) {
    filtered = filtered.filter(e => e.city.toLowerCase() === params.city!.toLowerCase())
  }
  if (params.q) {
    const q = params.q.toLowerCase()
    filtered = filtered.filter(e => e.courseName.toLowerCase().includes(q))
  }
  if (params.from) {
    filtered = filtered.filter(e => e.startDate >= params.from!)
  }
  if (params.to) {
    filtered = filtered.filter(e => e.startDate <= params.to!)
  }

  return filtered
}

interface PageProps {
  searchParams: Promise<{ category?: string; city?: string; q?: string; from?: string; to?: string }>
}

export default async function KurserPage({ searchParams }: PageProps) {
  const params = await searchParams
  const [events, slugMapRaw] = await Promise.all([
    getUpcomingEvents().catch(() => []),
    client.fetch(COURSE_TEMPLATE_SLUG_MAP_QUERY, {}, { next: { revalidate: 3600 } }),
  ])

  const slugMap: Record<number, string> = {}
  for (const item of slugMapRaw) {
    slugMap[item.eduAdminCourseTemplateId] = item.slug
  }

  const categories = [...new Set(events.map(e => e.categoryName).filter(Boolean))].sort()
  const cities = [...new Set(events.map(e => e.city).filter(Boolean))].sort()

  const filtered = filterEvents(events, params)
  const grouped = groupEventsByCategoryAndCourse(filtered)

  return (
    <div className="min-h-screen flex-grow flex flex-col" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      {/* Page header */}
      <div className="pt-16 pb-12" style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Kursutbud
          </div>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(28px, 5vw, 64px)' }}>
            Kommande kurser
          </h1>
          <p className="mt-4 text-base font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Alla tillfällen i Göteborg. Boka din plats direkt.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 flex-grow">
        {/* Filterrad */}
        <Suspense fallback={null}>
          <CourseFilter categories={categories} cities={cities} />
        </Suspense>

        {/* Grupperade kategorier */}
        <div className="space-y-16">
          {grouped.length === 0 ? (
            <p className="text-center py-24" style={{ color: 'var(--muted)' }}>
              Inga kurser matchar ditt filter.
            </p>
          ) : (
            grouped.map(category => (
              <CategorySection key={category.categoryName} category={category} slugMap={slugMap} />
            ))
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
