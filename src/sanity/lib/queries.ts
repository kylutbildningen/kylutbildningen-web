import { groq } from 'next-sanity'

export const HOME_PAGE_QUERY = groq`
  *[_type == "homePage"][0] {
    heroHeading,
    heroSubheading,
    heroCtaText,
    heroImage,
    uspItems,
    aboutHeading,
    aboutText,
    aboutImage { asset->, alt },
    courseCategoryHeading,
    courseCategories[] {
      tagline,
      eduAdminCourseTemplateId,
      coursePage-> {
        title,
        slug,
        eduAdminCourseTemplateId,
        shortDescription
      }
    },
    upcomingCoursesHeading,
    upcomingCoursesSubtext,
    contactHeading,
    contactText
  }
`

export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    contactEmail,
    contactPhone,
    address
  }
`
