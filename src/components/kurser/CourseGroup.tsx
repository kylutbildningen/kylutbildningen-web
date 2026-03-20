import { EventCard } from './EventCard'
import type { CourseGroup as CourseGroupType } from '@/lib/groupEvents'

export function CourseGroup({ group }: { group: CourseGroupType }) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-3 flex items-center gap-3" style={{ color: 'var(--navy)' }}>
        <span className="block w-2 h-2 rounded-sm bg-[#1A5EA8]" />
        {group.courseName}
        <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>
          {group.events.length} tillfälle{group.events.length !== 1 ? 'n' : ''}
        </span>
      </h3>
      <div className="space-y-2">
        {group.events.map(event => (
          <EventCard key={event.eventId} event={event} />
        ))}
      </div>
    </div>
  )
}
