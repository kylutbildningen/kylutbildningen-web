import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'

export const metadata: Metadata = {
  title: 'Kylutbildningar Göteborg — F-gas certifiering Kategori I, II & V | Kylutbildningen',
  description: 'INCERT-godkänt examinationscenter i Göteborg sedan 1997. Boka F-gas certifiering Kategori I, II och V online. Nästa kurs startar snart — platser begränsade.',
  alternates: { canonical: 'https://kylutbildningen.com' },
  openGraph: {
    title: 'Kylutbildningar Göteborg — F-gas certifiering',
    description: 'INCERT-godkänt examinationscenter i Göteborg. Boka F-gas certifiering online.',
    url: 'https://kylutbildningen.com',
    siteName: 'Kylutbildningen i Göteborg AB',
    locale: 'sv_SE',
    type: 'website',
  },
}
import { HOME_PAGE_QUERY, SITE_SETTINGS_QUERY, COURSE_TEMPLATE_SLUG_MAP_QUERY } from '@/sanity/lib/queries'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { HeroSection } from '@/components/home/HeroSection'
import { UpcomingCourses } from '@/components/home/UpcomingCourses'
import { CourseCategories } from '@/components/home/CourseCategories'
import { UspBar } from '@/components/home/UspBar'
import { ContactTeaser } from '@/components/home/ContactTeaser'

const DEFAULT_HOME_LAYOUT = [
  { sectionType: 'usp', visible: true },
  { sectionType: 'kommandeKurser', visible: true },
  { sectionType: 'utbildningsomraden', visible: true },
]

export default async function HomePage() {
  const [homeResult, settingsResult, events, slugResult] = await Promise.all([
    sanityFetch({ query: HOME_PAGE_QUERY }).catch(() => ({ data: null })),
    sanityFetch({ query: SITE_SETTINGS_QUERY }).catch(() => ({ data: null })),
    getUpcomingEvents().catch(() => []),
    sanityFetch({ query: COURSE_TEMPLATE_SLUG_MAP_QUERY }).catch(() => ({ data: [] })),
  ])

  const homeData = homeResult.data
  const siteSettings = settingsResult.data
  const courseSlugList = slugResult.data ?? []

  const templateSlugMap: Record<number, string> = {}
  for (const c of (courseSlugList ?? [])) {
    if (c.eduAdminCourseTemplateId) templateSlugMap[c.eduAdminCourseTemplateId] = c.slug
  }

  const uspItems = homeData?.uspItems?.length
    ? homeData.uspItems
    : [
        { label: 'INCERT-godkänt examinationscenter', icon: 'certificate' },
        { label: 'Alla F-gas-kategorier 1–5', icon: 'shield' },
        { label: 'Göteborg — flexibla datum', icon: 'calendar' },
      ]

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

  const layout = homeData?.layout?.length ? homeData.layout : DEFAULT_HOME_LAYOUT

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Kylutbildningen i Göteborg AB',
    url: 'https://kylutbildningen.com',
    description: 'INCERT-godkänt examinationscenter för F-gascertifiering i Göteborg sedan 1997.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'A Odhners gata 7',
      postalCode: '421 30',
      addressLocality: 'Västra Frölunda',
      addressCountry: 'SE',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+46-31-472636',
      email: 'info@kylutbildningen.se',
      contactType: 'customer service',
      availableLanguage: 'Swedish',
    },
    sameAs: [
      'https://kylutbildningen.se',
    ],
  }

  return (
    <div className="min-h-screen flex-grow flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <SiteHeader />
      <HeroSection
        heading={homeData?.heroHeading}
        subheading={homeData?.heroSubheading}
        ctaText={homeData?.heroCtaText}
        heroImage={homeData?.heroImage}
        events={events}
      />
      {layout.map((section: { sectionType: string; visible: boolean }, i: number) => {
        if (section.visible === false) return null

        switch (section.sectionType) {
          case 'usp':
            return <UspBar key={i} items={uspItems} />
          case 'kommandeKurser':
            return (
              <UpcomingCourses
                key={i}
                heading={homeData?.upcomingCoursesHeading}
                events={events}
                templateSlugMap={templateSlugMap}
              />
            )
          case 'utbildningsomraden':
            return (
              <CourseCategories
                key={i}
                heading={homeData?.courseCategoryHeading}
                categories={categories}
              />
            )
          case 'kontakt':
            return (
              <ContactTeaser
                key={i}
                heading={homeData?.contactHeading}
                text={homeData?.contactText}
                contactEmail={siteSettings?.contactEmail ?? 'info@kylutbildningen.se'}
                contactPhone={siteSettings?.contactPhone ?? '031-000 00 00'}
              />
            )
          default:
            return null
        }
      })}
      <SiteFooter />
    </div>
  )
}
