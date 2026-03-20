import type { EventCard } from '@/types/eduadmin'

export interface CourseGroup {
  courseName: string
  events: EventCard[]
}

export interface CategoryGroup {
  categoryName: string
  courses: CourseGroup[]
}

const CATEGORY_ORDER = [
  'Kategori I&II',
  'Kategori V',
  'Omprov',
  'Utbildningsintyg',
  'Utbildningar',
]

export function groupEventsByCategoryAndCourse(events: EventCard[]): CategoryGroup[] {
  const active = events.filter(e => !e.cancelled)

  const map = new Map<string, Map<string, EventCard[]>>()

  for (const event of active) {
    const cat = event.categoryName?.trim() || 'Övrigt'
    const course = event.courseName?.trim() || 'Okänd kurs'

    if (!map.has(cat)) map.set(cat, new Map())
    const courseMap = map.get(cat)!
    if (!courseMap.has(course)) courseMap.set(course, [])
    courseMap.get(course)!.push(event)
  }

  const result: CategoryGroup[] = []

  for (const [categoryName, courseMap] of map) {
    const courses: CourseGroup[] = []
    for (const [courseName, evts] of courseMap) {
      evts.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      courses.push({ courseName, events: evts })
    }
    courses.sort((a, b) => a.courseName.localeCompare(b.courseName, 'sv'))
    result.push({ categoryName, courses })
  }

  result.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.categoryName)
    const bi = CATEGORY_ORDER.indexOf(b.categoryName)
    if (ai === -1 && bi === -1) return a.categoryName.localeCompare(b.categoryName, 'sv')
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  return result
}
