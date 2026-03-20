import Link from 'next/link'
import { formatDateRange } from '@/lib/format'
import type { EventCard } from '@/types/eduadmin'

interface Props { events: EventCard[] }

export function HeroUpcomingPanel({ events }: Props) {
  return (
    <div className="w-full max-w-[440px] rounded-lg overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>

      {/* Titelrad */}
      <div className="flex items-center gap-2 px-5 py-4"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="ml-2 text-[11px] font-bold tracking-widest uppercase"
          style={{ color: '#8BA3BE' }}>Kommande tillfällen</span>
      </div>

      {/* Kurslista */}
      <div>
        {events.slice(0, 5).map(event => (
          <div key={event.eventId}
            className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/5 cursor-pointer"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="font-condensed font-bold text-[13px] tracking-wider text-[#00C4FF] min-w-[90px]">
              {formatDateRange(event.startDate, event.endDate)}
            </div>
            <div className="flex-1 px-4 text-[13px] font-normal truncate"
              style={{ color: 'rgba(255,255,255,0.8)' }}>
              {event.courseName}
            </div>
            <SeatsBadge seats={event.spotsLeft} full={event.isFullyBooked} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(26,94,168,0.15)', borderTop: '1px solid rgba(26,94,168,0.2)' }}>
        <span className="text-xs" style={{ color: '#8BA3BE' }}>Uppdaterat live från EduAdmin</span>
        <Link href="/kurser" className="text-xs font-medium text-[#00C4FF] hover:underline">
          Se alla →
        </Link>
      </div>
    </div>
  )
}

function SeatsBadge({ seats, full }: { seats: number; full: boolean }) {
  if (full)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm whitespace-nowrap"
      style={{ background: 'rgba(255,80,80,0.12)', color: '#ff6060' }}>Fullbokad</span>
  if (seats <= 3)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm whitespace-nowrap"
      style={{ background: 'rgba(255,160,0,0.12)', color: '#ffaa00' }}>{seats} platser</span>
  return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm whitespace-nowrap"
    style={{ background: 'rgba(0,196,255,0.12)', color: '#00C4FF' }}>{seats} platser</span>
}
