import Link from 'next/link'
import { formatDateRange, formatPrice } from '@/lib/format'
import type { EventCard as EventCardType } from '@/types/eduadmin'

export function EventCard({ event }: { event: EventCardType }) {
  const { eventId, startDate, endDate, startTime, endTime, city, spotsLeft, isFullyBooked, lowestPrice } = event

  const spotsBadge = isFullyBooked ? (
    <span className="text-xs font-bold uppercase tracking-wider text-red-600">Fullbokad</span>
  ) : spotsLeft <= 3 ? (
    <span className="text-xs font-semibold text-amber-600">{spotsLeft} plats{spotsLeft !== 1 ? 'er' : ''} kvar</span>
  ) : (
    <span className="text-xs font-semibold" style={{ color: '#1a9e6a' }}>{spotsLeft} platser kvar</span>
  )

  const bookButton = isFullyBooked ? (
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
  )

  return (
    <div
      className={`px-4 py-4 md:px-5 rounded-md border transition-colors ${
        isFullyBooked ? 'opacity-60' : 'hover:border-[#1A5EA8] hover:bg-[#f5f8fc]'
      }`}
      style={{ background: 'white', borderColor: '#DDE4ED' }}
    >
      {/* Mobil layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <div className="font-condensed font-bold text-[15px] tracking-wide" style={{ color: '#1A5EA8' }}>
            {formatDateRange(startDate, endDate)}
          </div>
          {spotsBadge}
        </div>
        <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          {startTime}–{endTime}
          {city && <span className="mx-1.5">·</span>}
          {city?.trim()}
        </div>
        <div className="mb-3">
          {lowestPrice ? (
            <>
              <span className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>fr. {formatPrice(lowestPrice)} kr</span>
              <span className="text-[11px] ml-1" style={{ color: 'var(--muted)' }}>exkl. moms</span>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
          )}
        </div>
        <div className="[&>a]:block [&>a]:w-full [&>a]:text-center [&>span]:block [&>span]:w-full [&>span]:text-center">
          {bookButton}
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4">
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
          {spotsBadge}
        </div>

        {/* Pris */}
        <div className="min-w-[130px] text-right">
          {lowestPrice ? (
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                fr. {formatPrice(lowestPrice)}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--muted)' }}>exkl. moms</div>
            </div>
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted)' }}>—</span>
          )}
        </div>

        {/* Boka-knapp */}
        <div className="ml-2">
          {bookButton}
        </div>
      </div>
    </div>
  )
}
