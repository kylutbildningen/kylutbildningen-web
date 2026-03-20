# Claude Code Prompt: Startsida med Sanity CMS

## Uppgift

Bygg den nya startsidan (`app/page.tsx`) för kylutbildningen.com.
Sidan hämtar redaktionellt innehåll från Sanity och live-data från EduAdmin.
Sanity-prompten (claude-code-prompt-sanity.md) ska redan vara genomförd
och `next-sanity` ska vara installerat.

---

## Befintlig site att matcha och förbättra

Referens: https://kylutbildningen.se

Den befintliga siten har:
- Vit bakgrund, mörkgrå/svart text
- Blå accentfärg (logotypens blå, ca `#1B5EA6`)
- Enkel, professionell skandinavisk känsla
- Nav: logotyp vänster, tre länkar höger (Start, Kursutbud, Kontakt)
- Tagline: "Godkänt examinationscenter av INCERT för examinering alla kategori 1-5"

Den nya sidan ska vara märkbart modernare och luftigare än den befintliga,
men hålla samma professionella ton. Inga lekfulla animationer — det är en B2B-site
för kyltekniker och företag som skickar personal på certifieringskurser.

Designriktning: **Refined industrial** — precision, kompetens, yrkeskunnande.
Tänk teknisk dokumentation möter modern SaaS-landningssida. Generösa whitespace,
skarp typografi, accentlinjer snarare än tjocka färgytor.

---

## Sanity-schema att lägga till

Lägg till ett `homePage`-schema (singleton) i `src/sanity/schemaTypes/homePage.ts`:

```typescript
import { defineField, defineType } from 'sanity'

export const homePage = defineType({
  name: 'homePage',
  title: 'Startsida',
  type: 'document',
  __experimental_actions: ['update', 'publish'],  // singleton
  fields: [
    // --- HERO ---
    defineField({
      name: 'heroHeading',
      title: 'Hero — Rubrik',
      type: 'string',
      description: 'T.ex. "Certifieringskurser för kylbranschen"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'heroSubheading',
      title: 'Hero — Underrubrik',
      type: 'string',
      description: 'T.ex. "Godkänt examinationscenter av INCERT för alla kategori 1–5"',
    }),
    defineField({
      name: 'heroCtaText',
      title: 'Hero — CTA-knapptext',
      type: 'string',
      initialValue: 'Se alla kurser',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero — Bakgrundsbild',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    // --- USP-BADGES (3 st) ---
    defineField({
      name: 'uspItems',
      title: 'USP — Förtroendemärken',
      description: '3 korta punkter under hero. T.ex. "INCERT-certifierat", "Sedan 2010", "Göteborg".',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'label', title: 'Text', type: 'string' }),
            defineField({
              name: 'icon',
              title: 'Ikon',
              type: 'string',
              description: 'Välj: shield | calendar | location | certificate | people',
              options: {
                list: [
                  { title: 'Sköld (certifiering)', value: 'shield' },
                  { title: 'Kalender (år/datum)', value: 'calendar' },
                  { title: 'Plats', value: 'location' },
                  { title: 'Diplom', value: 'certificate' },
                  { title: 'Grupp', value: 'people' },
                ],
              },
            }),
          ],
          preview: {
            select: { title: 'label' },
          },
        },
      ],
      validation: Rule => Rule.max(3),
    }),

    // --- OM OSS ---
    defineField({
      name: 'aboutHeading',
      title: 'Om oss — Rubrik',
      type: 'string',
      initialValue: 'Om Kylutbildningen',
    }),
    defineField({
      name: 'aboutText',
      title: 'Om oss — Text',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'aboutImage',
      title: 'Om oss — Bild',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', type: 'string', title: 'Alt-text' }),
      ],
    }),

    // --- UTBILDNINGSOMRÅDEN (kategorikort) ---
    defineField({
      name: 'courseCategoryHeading',
      title: 'Utbildningsområden — Rubrik',
      type: 'string',
      initialValue: 'Våra utbildningsområden',
    }),
    defineField({
      name: 'courseCategories',
      title: 'Utbildningsområden — Kategorikort',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'coursePage',
              title: 'Länkad kursinfosida',
              type: 'reference',
              to: [{ type: 'coursePage' }],
            }),
            defineField({
              name: 'tagline',
              title: 'Kort tagline (visas på kortet)',
              type: 'string',
              description: 'T.ex. "F-gas kategori I & II certifiering"',
            }),
          ],
          preview: {
            select: { title: 'coursePage.title', subtitle: 'tagline' },
          },
        },
      ],
    }),

    // --- KOMMANDE KURSER (rubrik) ---
    defineField({
      name: 'upcomingCoursesHeading',
      title: 'Kommande kurser — Rubrik',
      type: 'string',
      initialValue: 'Kommande kurser',
    }),
    defineField({
      name: 'upcomingCoursesSubtext',
      title: 'Kommande kurser — Undertext',
      type: 'string',
      description: 'Liten text under rubriken, t.ex. "Boka din plats idag"',
    }),

    // --- KONTAKT-TEASER ---
    defineField({
      name: 'contactHeading',
      title: 'Kontakt — Rubrik',
      type: 'string',
      initialValue: 'Har du frågor?',
    }),
    defineField({
      name: 'contactText',
      title: 'Kontakt — Text',
      type: 'text',
      rows: 2,
    }),
  ],
})
```

Registrera i `src/sanity/schemaTypes/index.ts`:
```typescript
import { homePage } from './homePage'
// lägg till i schemaTypes-arrayen
```

Lägg till query i `src/sanity/lib/queries.ts`:
```typescript
export const HOME_PAGE_QUERY = groq`
  *[_type == "homePage"][0] {
    heroHeading,
    heroSubheading,
    heroCtaText,
    heroImage { asset->, alt },
    uspItems,
    aboutHeading,
    aboutText,
    aboutImage { asset->, alt },
    courseCategoryHeading,
    courseCategories[] {
      tagline,
      coursePage-> {
        title,
        slug,
        eduAdminCourseId,
        shortDescription,
        heroImage { asset->, alt }
      }
    },
    upcomingCoursesHeading,
    upcomingCoursesSubtext,
    contactHeading,
    contactText
  }
`
```

---

## Startsidan — `app/page.tsx`

Server Component som hämtar Sanity och EduAdmin parallellt:

```typescript
import { client } from '@/sanity/lib/client'
import { HOME_PAGE_QUERY, SITE_SETTINGS_QUERY } from '@/sanity/lib/queries'
import { getUpcomingEvents } from '@/lib/eduadmin'
import { HeroSection } from '@/components/home/HeroSection'
import { UspBar } from '@/components/home/UspBar'
import { UpcomingCourses } from '@/components/home/UpcomingCourses'
import { CourseCategories } from '@/components/home/CourseCategories'
import { AboutSection } from '@/components/home/AboutSection'
import { ContactTeaser } from '@/components/home/ContactTeaser'

export default async function HomePage() {
  const [homeData, siteSettings, upcomingEvents] = await Promise.all([
    client.fetch(HOME_PAGE_QUERY, {}, { next: { tags: ['homePage'], revalidate: 3600 } }),
    client.fetch(SITE_SETTINGS_QUERY, {}, { next: { tags: ['siteSettings'], revalidate: 86400 } }),
    getUpcomingEvents(6),  // nästa 6 events, kort cache (60s)
  ])

  return (
    <main>
      <HeroSection data={homeData} />
      <UspBar items={homeData?.uspItems ?? []} />
      <UpcomingCourses
        heading={homeData?.upcomingCoursesHeading}
        subtext={homeData?.upcomingCoursesSubtext}
        events={upcomingEvents}
      />
      <CourseCategories
        heading={homeData?.courseCategoryHeading}
        categories={homeData?.courseCategories ?? []}
      />
      <AboutSection data={homeData} />
      <ContactTeaser
        heading={homeData?.contactHeading}
        text={homeData?.contactText}
        siteSettings={siteSettings}
      />
    </main>
  )
}
```

---

## Komponenter

Skapa i `src/components/home/`. Tailwind CSS genomgående.
Designriktning: refined industrial — se ovan.

### `HeroSection.tsx`

Layout: full-width, mörk overlay på hero-bild (om bild finns), annars djupblå bakgrund (`#0f2a4a`).
Vit text. Rubrik stor och skarp. CTA-knapp vit med blå text.
Ingen bild → gradient från `#0f2a4a` till `#1B5EA6`.

```
┌─────────────────────────────────────────────┐
│  [mörkblå bakgrund / foto med overlay]      │
│                                             │
│  Certifieringskurser för kylbranschen       │  ← heroHeading, vit, 3xl-4xl
│  Godkänt examinationscenter av INCERT...    │  ← heroSubheading, vit/70%, xl
│                                             │
│  [ Se alla kurser → ]                       │  ← vit knapp, blue text
└─────────────────────────────────────────────┘
```

Fallback om Sanity-data saknas: visa statisk text "Certifieringskurser för kylbranschen".

### `UspBar.tsx`

Horisontell rad av 3 ikoner + text direkt under hero.
Vit bakgrund, `border-b`, kompakt padding.
Ikoner renderas som enkla SVG-paths baserat på `icon`-värdet.

```
[ ✓ INCERT-certifierat ]  [ ✓ Sedan 2010 ]  [ ✓ Göteborg ]
```

Ikon-komponent — definiera dessa SVG-paths:
- `shield` → sköldform
- `calendar` → kalender
- `location` → platspin
- `certificate` → diplom/band
- `people` → persongrupp

### `UpcomingCourses.tsx`

Sektion med rubrik + grid av kurskort.
Hämtar `events`-array från EduAdmin (se typ nedan).
Max 6 events. "Se alla kurser"-länk till `/kurser`.

**Kurskortsdesign:**
```
┌───────────────────────────────┐
│ 23–24 mar 2026                │  ← datum, blå accentfärg
│ Omexaminering Kategori V      │  ← kursnamn, bold
│ 09:00–16:30 · Göteborg        │  ← tid + ort, grå
│                               │
│ 7 platser kvar    fr 9 500 kr │
│ [Kursinfo]        [Boka →]    │
└───────────────────────────────┘
```

Fullbokad-variant: röd "Fullbokad"-badge, Boka-knapp grå+disabled.
"2 platser kvar" (≤3): visa i orange (`text-orange-600 font-medium`).

EduAdmin event-typ:
```typescript
interface EduAdminEvent {
  eventId: number
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  maxNumberOfParticipants: number
  currentParticipants: number
  priceIncVat: number
  location?: { locationName: string; city: string }
  courseName?: { courseName: string; courseId: number }
}
```

Hjälpfunktioner att skapa i `lib/format.ts`:
```typescript
export function formatDateRange(start: string, end: string): string
// "23–24 mar 2026" om olika dagar, "27 mar 2026" om samma dag

export function formatPrice(priceIncVat: number): string
// "9 500 kr" med Intl.NumberFormat('sv-SE')

export function availableSeats(event: EduAdminEvent): number
// maxNumberOfParticipants - currentParticipants
```

### `CourseCategories.tsx`

Grid med kurskategori-kort (2 kolumner desktop, 1 mobil).
Varje kort: hero-bild från den länkade `coursePage`, kursnamn, tagline, "Läs mer"-länk.

```
┌─────────────────┐  ┌─────────────────┐
│  [bild]         │  │  [bild]         │
│  Kategori I&II  │  │  Kategori V     │
│  F-gas certif.  │  │  F-gas certif.  │
│  Läs mer →      │  │  Läs mer →      │
└─────────────────┘  └─────────────────┘
```

Länk till `/kurser/{eduAdminCourseId}` (eller `/kurser/{slug}` om du föredrar slug-baserade URLs).
Fallback-bild om Sanity-bild saknas: ljusgrå bakgrund med kursnamn centrerat.

### `AboutSection.tsx`

Två-kolumns-layout (text vänster, bild höger) på desktop. Stack på mobil.
Ljusgrå bakgrund (`bg-gray-50`) för att bryta av från vita sektioner.

```
┌────────────────────┬─────────────────┐
│ Om Kylutbildningen │   [foto]        │
│                    │                 │
│ [PortableText]     │                 │
│                    │                 │
└────────────────────┴─────────────────┘
```

Använd `<PortableText>` från `@portabletext/react` för `aboutText`.
Om `aboutImage` saknas: visa kolumnen men utan bild-kolumnen.

### `ContactTeaser.tsx`

Mörkblå bakgrund (`#0f2a4a`), vit text. Full-width.
Rubrik, kort text, telefonnummer + e-post från `siteSettings`, knapp till `/kontakt`.

```
┌─────────────────────────────────────────────┐
│  Har du frågor?                             │
│  Vi hjälper dig att hitta rätt kurs         │
│                                             │
│  010-123 45 67   info@kylutbildningen.se    │
│                   [ Kontakta oss → ]        │
└─────────────────────────────────────────────┘
```

---

## Layout-komponenter (gemensamma för hela siten)

### `components/layout/SiteHeader.tsx`

Sticky header, vit bakgrund, `border-b border-gray-100`, `shadow-sm`.

```
[ Logotyp ]                    [ Start ] [ Kursutbud ] [ Kontakt ] [ Logga in ]
```

- Logotyp: från `siteSettings.logo` (Sanity-bild), fallback: "Kylutbildningen" i bold blå text
- Aktiv länk: blå underline
- Mobil: hamburger-meny med slide-in drawer
- "Logga in"-knapp: länk till `/logga-in`, visas alltid (outline-stil)
- Om inloggad: länk till `/dashboard` istället

### `components/layout/SiteFooter.tsx`

Tre kolumner: navigation, kontaktinfo, logotyp + tagline.
Data från `siteSettings`.

### `app/layout.tsx`

Wrappa hela appen med `<SiteHeader>` och `<SiteFooter>`.
Hämta `siteSettings` en gång här och skicka som props.

---

## Filstruktur att skapa

```
src/
  sanity/
    schemaTypes/
      homePage.ts           ← NY
      index.ts              ← uppdatera

  components/
    home/
      HeroSection.tsx       ← NY
      UspBar.tsx            ← NY
      UpcomingCourses.tsx   ← NY
      CourseCategories.tsx  ← NY
      AboutSection.tsx      ← NY
      ContactTeaser.tsx     ← NY
    layout/
      SiteHeader.tsx        ← NY
      SiteFooter.tsx        ← NY

  lib/
    format.ts               ← NY (formatDateRange, formatPrice, availableSeats)

app/
  page.tsx                  ← NY (startsidan)
  layout.tsx                ← UPPDATERA med Header + Footer
```

---

## Sanity Studio — Startsida-dokument

Efter att koden är klar, gå till `/studio` och skapa ett dokument av typen "Startsida":

Minimalt innehåll att fylla i för att testa:
- Hero-rubrik: "Certifieringskurser för kylbranschen"
- Hero-underrubrik: "Godkänt examinationscenter av INCERT för examinering alla kategori 1–5"
- Hero-CTA: "Se alla kurser"
- USP-items (3 st):
  1. label: "INCERT-certifierat", icon: shield
  2. label: "Göteborg", icon: location
  3. label: "Alla kategori 1–5", icon: certificate
- Kommande kurser-rubrik: "Kommande kurser"
- Utbildningsområden-rubrik: "Våra utbildningsområden"
- Kontakt-rubrik: "Har du frågor?"
- Kontakt-text: "Vi hjälper dig att hitta rätt utbildning för din personal."

---

## Prioriteringsordning

1. Lägg till `homePage.ts`-schema och registrera det
2. Kör `npm run typegen` om du har det i package.json
3. Lägg till `HOME_PAGE_QUERY` i `queries.ts`
4. Skapa `lib/format.ts` med hjälpfunktionerna
5. Skapa alla 6 hem-komponenter (börja med `HeroSection` och `UpcomingCourses`)
6. Skapa `SiteHeader` och `SiteFooter`
7. Uppdatera `app/layout.tsx`
8. Bygg `app/page.tsx`
9. Gå till `/studio`, skapa Startsida-dokumentet med testinnehåll
10. Verifiera att sidan ser korrekt ut på localhost:3000

---

## Fallback-hantering

Sanity kan returnera `null` om dokumentet inte är skapat än.
Alla komponenter måste hantera saknad data elegant:

```typescript
// Alltid destructure med defaults
const { heroHeading = 'Certifieringskurser för kylbranschen' } = homeData ?? {}

// Visa aldrig tomma sektioner — villkorlig rendering
{homeData?.aboutText && <AboutSection data={homeData} />}
```

---

*Börja med steg 1: lägg till homePage-schemat och registrera det i index.ts.*
*Verifiera att `/studio` visar "Startsida" i menyn innan du bygger komponenter.*
