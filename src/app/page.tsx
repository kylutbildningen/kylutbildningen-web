import { getUpcomingEvents } from '@/lib/eduadmin'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HeroSection } from '@/components/home/HeroSection'
import { UpcomingCourses } from '@/components/home/UpcomingCourses'
import { CourseCategories } from '@/components/home/CourseCategories'
import { UspBar } from '@/components/home/UspBar'
import { ContactTeaser } from '@/components/home/ContactTeaser'

const USP_ITEMS = [
  { label: 'INCERT-godkänt examinationscenter', icon: 'certificate' },
  { label: 'Alla F-gas-kategorier 1–5', icon: 'shield' },
  { label: 'Små grupper, hög kvalitet', icon: 'people' },
  { label: 'Göteborg — flexibla datum', icon: 'calendar' },
]

export default async function HomePage() {
  const events = await getUpcomingEvents().catch(() => [])

  // Derive unique categories from events
  const categoryMap = new Map<string, number>()
  events.forEach(e => {
    if (e.categoryName && !categoryMap.has(e.categoryName)) {
      categoryMap.set(e.categoryName, e.courseTemplateId)
    }
  })
  const categories = Array.from(categoryMap.entries()).map(([name, courseTemplateId]) => ({
    name,
    courseTemplateId,
  }))

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <HeroSection events={events} />
      <UspBar items={USP_ITEMS} />
      <UpcomingCourses events={events} />
      <CourseCategories categories={categories} />
      <ContactTeaser
        contactEmail="info@kylutbildningen.se"
        contactPhone="031-000 00 00"
      />
      <SiteFooter />
    </div>
  )
}
