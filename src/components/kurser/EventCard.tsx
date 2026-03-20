import Link from 'next/link'
import { formatDateRange, formatPrice } from '@/lib/format'
import type { EventCard as EventCardType } from '@/types/eduadmin'

export function EventCard({ event }: { event: EventCardType }) {
  const { eventId, startDate, endDate, startTime, endTime, city, spotsLeft, isFullyBooked, lowestPrice } = event

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-md border transition-colors ${
        isFullyBooked ? 'opacity-60' : 'hover:border-[#1A5EA8] hover:bg-[#f5f8fc]'
      }`}
      style={{ background: 'white', borderColor: '#DDE4ED' }}
    >
      {/* Datum */}
      <div className="min-w-[130px]">
        <div className="font-condensed font-bold text-[15px] tracking-wide" style={{ color: '#1A5EA8' }}>
          {formatDateRange(startDate, endDate)}
        </div>
      </div>

      {/* Tid + ort */}
      <div className="flex-1 text-sm" style={{ color: 'var(--muted)' }}>
        {startTime}–{endTime}
        {city && <span className="mx-1.5">·</span>}
        {city?.trim()}
      </div>

      {/* Platser */}
      <div className="min-w-[110px] text-right">
        {isFullyBooked ? (
          <span className="text-xs font-bold uppercase tracking-wider text-red-600">Fullbokad</span>
        ) : spotsLeft <= 3 ? (
          <span className="text-xs font-semibold text-amber-600">{spotsLeft} plats{spotsLeft !== 1 ? 'er' : ''} kvar</span>
        ) : (
          <span className="text-xs font-semibold" style={{ color: '#1a9e6a' }}>{spotsLeft} platser kvar</span>
        )}
      </div>

      {/* Pris */}
      <div className="min-w-[130px] text-right">
        {lowestPrice ? (
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
              fr. {formatPrice(lowestPrice)} kr
            </div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>exkl. moms</div>
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
        )}
      </div>

      {/* Boka-knapp */}
      <div className="ml-2">
        {isFullyBooked ? (
          <span className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider text-white" style={{ background: '#B0BAC5' }}>
            Fullbokad
          </span>
        ) : (
          <Link
            href={`/boka/${eventId}`}
            className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-[#1A5EA8]"
            style={{ background: 'var(--navy)' }}
          >
            Boka
          </Link>
        )}
      </div>
    </div>
  )
}
