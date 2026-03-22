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
    contactText,
    layout[] { sectionType, visible }
  }
`

export const COURSE_PAGE_QUERY = groq`
  *[_type == "coursePage" && slug.current == $slug][0] {
    title,
    slug,
    eduAdminCourseTemplateId,
    shortDescription,
    description,
    antalDagar,
    omUtbildningen,
    innehall,
    upplagg,
    upplaggText,
    dagSchema[] {
      dagTitel,
      dagSubtitel,
      slots[] {
        tid,
        typ,
        aktiviteter
      }
    },
    certifiering,
    lodprov,
    targetGroup,
    prerequisites,
    layout[] { sectionType, visible }
  }
`

export const ALL_COURSE_SLUGS_QUERY = groq`
  *[_type == "coursePage" && defined(slug.current)] {
    "slug": slug.current
  }
`

export const COURSE_TEMPLATE_SLUG_MAP_QUERY = groq`
  *[_type == "coursePage" && defined(slug.current) && defined(eduAdminCourseTemplateId)] {
    eduAdminCourseTemplateId,
    "slug": slug.current
  }
`

export const SITE_SETTINGS_QUERY = groq`
  *[_type == "siteSettings"][0] {
    contactEmail,
    contactPhone,
    address
  }
`
