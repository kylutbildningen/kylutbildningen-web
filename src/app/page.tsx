import { client } from '@/sanity/lib/client'
import { HOME_PAGE_QUERY, SITE_SETTINGS_QUERY, COURSE_TEMPLATE_SLUG_MAP_QUERY } from '@/sanity/lib/queries'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HeroSection } from '@/components/home/HeroSection'
import { UpcomingCourses } from '@/components/home/UpcomingCourses'
import { CourseCategories } from '@/components/home/CourseCategories'
import { UspBar } from '@/components/home/UspBar'
import { ContactTeaser } from '@/components/home/ContactTeaser'

export default async function HomePage() {
  const [homeData, siteSettings, events, courseSlugList] = await Promise.all([
    client.fetch(HOME_PAGE_QUERY, {}, { next: { tags: ['homePage'], revalidate: 0 } }).catch(() => null),
    client.fetch(SITE_SETTINGS_QUERY, {}, { next: { tags: ['siteSettings'], revalidate: 0 } }).catch(() => null),
    getUpcomingEvents().catch(() => []),
    client.fetch(COURSE_TEMPLATE_SLUG_MAP_QUERY, {}, { next: { tags: ['coursePage'], revalidate: 3600 } }).catch(() => []),
  ])

  const templateSlugMap: Record<number, string> = {}
  for (const c of (courseSlugList ?? [])) {
    if (c.eduAdminCourseTemplateId) templateSlugMap[c.eduAdminCourseTemplateId] = c.slug
  }

  // USP: från Sanity om de finns, annars fallback
  const uspItems = homeData?.uspItems?.length
    ? homeData.uspItems
    : [
        { label: 'INCERT-godkänt examinationscenter', icon: 'certificate' },
        { label: 'Alla F-gas-kategorier 1–5', icon: 'shield' },
        { label: 'Göteborg — flexibla datum', icon: 'calendar' },
      ]

  // Kurskategorier: från Sanity om de finns, annars från EduAdmin
  const sanityCategories = homeData?.courseCategories?.map((cat: any) => {
    const templateId = cat.coursePage?.eduAdminCourseTemplateId ?? cat.eduAdminCourseTemplateId ?? 0
    const name = cat.coursePage?.title ?? ''
    const slug = cat.coursePage?.slug?.current ?? null
    const description = cat.tagline ?? cat.coursePage?.shortDescription ?? ''
    return { name, courseTemplateId: templateId, description, slug }
  }).filter((c: any) => c.name && c.courseTemplateId)

  const eduAdminCategories = (() => {
    const map = new Map<string, number>()
    events.forEach(e => {
      if (e.categoryName && !map.has(e.categoryName)) map.set(e.categoryName, e.courseTemplateId)
    })
    return Array.from(map.entries()).map(([name, courseTemplateId]) => ({ name, courseTemplateId, slug: null }))
  })()

  const categories = sanityCategories?.length ? sanityCategories : eduAdminCategories


  return (
    <div className="min-h-screen">
      <SiteHeader />
      <HeroSection
        heading={homeData?.heroHeading}
        subheading={homeData?.heroSubheading}
        ctaText={homeData?.heroCtaText}
        heroImage={homeData?.heroImage}
        events={events}
      />
      <UspBar items={uspItems} />
      <UpcomingCourses
        heading={homeData?.upcomingCoursesHeading}
        events={events}
        templateSlugMap={templateSlugMap}
      />
      <CourseCategories
        heading={homeData?.courseCategoryHeading}
        categories={categories}
      />
      <ContactTeaser
        heading={homeData?.contactHeading}
        text={homeData?.contactText}
        contactEmail={siteSettings?.contactEmail ?? 'info@kylutbildningen.se'}
        contactPhone={siteSettings?.contactPhone ?? '031-000 00 00'}
      />
      <SiteFooter />
    </div>
  )
}
