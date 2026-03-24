import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { groupEventsByCategoryAndCourse } from '@/lib/groupEvents'
import { CategorySection } from '@/components/kurser/CategorySection'
import { CourseFilter } from '@/components/kurser/CourseFilter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import type { EventCard } from '@/types/eduadmin'

export const metadata: Metadata = {
  title: 'Kommande kurser — Kylutbildningen',
  description: 'Se alla tillgängliga kylutbildningar. Certifieringar, F-gas, köldmediehantering och mer. Boka online.',
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
  const events = await getUpcomingEvents().catch(() => [])

  const categories = [...new Set(events.map(e => e.categoryName).filter(Boolean))].sort()
  const cities = [...new Set(events.map(e => e.city).filter(Boolean))].sort()

  const filtered = filterEvents(events, params)
  const grouped = groupEventsByCategoryAndCourse(filtered)

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
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
              <CategorySection key={category.categoryName} category={category} />
            ))
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
