import { CourseGroup } from './CourseGroup'
import type { CategoryGroup } from '@/lib/groupEvents'

interface Props {
  category: CategoryGroup
  slugMap?: Record<number, string>
}

export function CategorySection({ category, slugMap = {} }: Props) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-8">
        <h2 className="font-condensed font-bold uppercase text-2xl" style={{ color: 'var(--navy)' }}>
          {category.categoryName}
        </h2>
        <div className="flex-1 h-px" style={{ background: '#DDE4ED' }} />
      </div>
      <div className="space-y-10">
        {category.courses.map(course => (
          <CourseGroup key={course.courseName} group={course} slugMap={slugMap} />
        ))}
      </div>
    </section>
  )
}
