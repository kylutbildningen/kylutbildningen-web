import Link from 'next/link'
import { EventCard } from './EventCard'
import type { CourseGroup as CourseGroupType } from '@/lib/groupEvents'

interface Props {
  group: CourseGroupType
  slugMap?: Record<number, string>
}

export function CourseGroup({ group, slugMap = {} }: Props) {
  const templateId = group.events[0]?.courseTemplateId
  const slug = templateId ? slugMap[templateId] : undefined

  return (
    <div>
      <h3 className="text-base font-semibold mb-3 flex items-center gap-3" style={{ color: 'var(--navy)' }}>
        <span className="block w-2 h-2 rounded-sm bg-[#1A5EA8]" />
        {slug ? (
          <Link href={`/kurser/${slug}`} className="hover:text-[#1A5EA8] transition-colors">
            {group.courseName}
          </Link>
        ) : (
          group.courseName
        )}
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
