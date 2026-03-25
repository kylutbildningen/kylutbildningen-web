import Link from 'next/link'
import { formatDateRange, formatPrice } from '@/lib/format'
import type { EventCard } from '@/types/eduadmin'

interface Props {
  heading?: string
  events: EventCard[]
  templateSlugMap?: Record<number, string>
}

export function UpcomingCourses({ heading, events, templateSlugMap = {} }: Props) {
  return (
    <section id="kommande-kurser" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#1A5EA8] mb-3">
          <span className="block w-6 h-0.5 bg-[#1A5EA8]" />
          Aktuellt
        </div>
        <h2 className="font-condensed font-bold uppercase leading-none tracking-tight mb-12"
          style={{ fontSize: 'clamp(28px, 4vw, 52px)', color: 'var(--navy)' }}>
          {heading ?? 'Kommande kurser'}
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px mb-8"
          style={{ background: '#DDE4ED', border: '1px solid #DDE4ED', borderRadius: '6px', overflow: 'hidden' }}>
          {events.slice(0, 6).map(event => {
            const full = event.isFullyBooked
            const infoHref = templateSlugMap[event.courseTemplateId]
              ? `/kurser/${templateSlugMap[event.courseTemplateId]}`
              : `/kurser?category=${encodeURIComponent(event.categoryName)}`
            return (
              <div key={event.eventId}
                className={`bg-white p-7 flex flex-col gap-3 transition-colors ${!full ? 'hover:bg-[#f5f8fc] cursor-pointer' : 'opacity-60'}`}>
                <div className="font-condensed font-bold text-[13px] tracking-widest uppercase text-[#1A5EA8]">
                  {formatDateRange(event.startDate, event.endDate)}
                </div>
                <div className="text-[15px] font-semibold leading-snug"
                  style={{ color: 'var(--navy)' }}>
                  {event.courseName}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {event.startTime ? `${event.startTime}–${event.endTime}` : '09:00–16:30'}
                  {event.city ? ` · ${event.city}` : ''}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid #EEF1F5' }}>
                  <div>
                    {event.lowestPriceIncVat && event.lowestPriceIncVat > 0 && (
                      <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                        fr. {formatPrice(event.lowestPriceIncVat)}
                      </div>
                    )}
                    {full
                      ? <div className="text-[11px] font-bold tracking-wider uppercase text-red-600">● Fullbokad</div>
                      : event.spotsLeft <= 3
                        ? <div className="text-[11px] font-semibold text-amber-600">{event.spotsLeft} platser kvar</div>
                        : <div className="text-[11px] font-semibold text-emerald-600">{event.spotsLeft} platser kvar</div>
                    }
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={infoHref}
                      className="text-xs font-medium hover:text-[#1A5EA8] transition-colors"
                      style={{ color: 'var(--muted)' }}>
                      Info
                    </Link>
                    {!full && (
                      <Link href={`/boka/${event.eventId}`}
                        className="px-4 py-1.5 text-white text-xs font-semibold tracking-wider uppercase rounded-sm transition-colors hover:bg-[#1A5EA8]"
                        style={{ background: 'var(--navy)' }}>
                        Boka
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end">
          <Link href="/kurser"
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wider uppercase text-[#1A5EA8] hover:underline">
            Se alla kommande kurser
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
