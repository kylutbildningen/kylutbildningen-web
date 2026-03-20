# Claude Code Prompt: Implementera ny design

## Uppgift

Implementera den nya designen för kylutbildningen.com baserat på design-preview.html.
Designriktning: **dark industrial precision** — mörkblå, kondenserad typografi, teknisk känsla.

---

## Typsnitt

Lägg till i `app/layout.tsx`:

```tsx
import { Barlow, Barlow_Condensed } from 'next/font/google'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-barlow',
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-barlow-condensed',
})
```

Lägg till variablerna på `<html>`-taggen:
```tsx
<html lang="sv" className={`${barlow.variable} ${barlowCondensed.variable}`}>
```

---

## CSS-variabler

Lägg till i `app/globals.css`:

```css
:root {
  --navy: #0B1F3A;
  --navy-mid: #112847;
  --blue: #1A5EA8;
  --blue-light: #2A7DD4;
  --ice: #E8F1FB;
  --steel: #8BA3BE;
  --accent: #00C4FF;
  --text: #1a2a3a;
  --muted: #556678;
  --gray-bg: #F0F3F7;
  --border: #DDE4ED;
}

body {
  font-family: var(--font-barlow), sans-serif;
  background: #FAFBFC;
  color: var(--text);
}
```

---

## Tailwind-konfiguration

Lägg till i `tailwind.config.ts`:

```ts
theme: {
  extend: {
    fontFamily: {
      sans: ['var(--font-barlow)', 'sans-serif'],
      condensed: ['var(--font-barlow-condensed)', 'sans-serif'],
    },
    colors: {
      navy: {
        DEFAULT: '#0B1F3A',
        mid: '#112847',
      },
      brand: {
        blue: '#1A5EA8',
        'blue-light': '#2A7DD4',
        accent: '#00C4FF',
        steel: '#8BA3BE',
      },
    },
  },
}
```

---

## Komponenter

### `components/layout/SiteHeader.tsx`

Sticky, mörkblå header med glassmorphism-effekt.

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16"
      style={{ background: 'rgba(11,31,58,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

      <Link href="/" className="font-condensed font-bold text-lg tracking-widest uppercase text-white">
        Kyl<span className="text-[#00C4FF]">utbildningen</span>
      </Link>

      <nav className="flex items-center gap-8">
        {[
          { href: '/', label: 'Start' },
          { href: '/kurser', label: 'Kursutbud' },
          { href: '/om-oss', label: 'Om oss' },
          { href: '/kontakt', label: 'Kontakt' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-xs font-medium tracking-widest uppercase transition-colors
              ${pathname === href ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            {label}
          </Link>
        ))}

        <Link
          href="/logga-in"
          className="px-5 py-2 bg-[#1A5EA8] hover:bg-[#2A7DD4] text-white text-xs font-semibold tracking-wider uppercase rounded transition-colors"
        >
          Logga in
        </Link>
      </nav>
    </header>
  )
}
```

---

### `components/home/HeroSection.tsx`

```tsx
import Link from 'next/link'
import { HeroUpcomingPanel } from './HeroUpcomingPanel'

interface Props {
  heading?: string
  subheading?: string
  ctaText?: string
  events: EduAdminEvent[]
}

export function HeroSection({ heading, subheading, ctaText, events }: Props) {
  return (
    <section className="min-h-screen grid grid-cols-2 relative overflow-hidden"
      style={{ background: 'var(--navy)' }}>

      {/* Grid-lines bakgrund */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '80px 80px'
      }} />

      {/* Vänster — text */}
      <div className="relative z-10 flex flex-col justify-center px-18 pt-32 pb-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-sm w-fit"
          style={{ background: 'rgba(0,196,255,0.1)', border: '1px solid rgba(0,196,255,0.25)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C4FF] animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#00C4FF]">
            INCERT-godkänt examinationscenter
          </span>
        </div>

        {/* Rubrik */}
        <h1 className="font-condensed font-extrabold uppercase leading-[0.95] tracking-tight text-white mb-6"
          style={{ fontSize: 'clamp(52px, 6vw, 80px)' }}>
          Certifiering<br />
          för <span className="text-[#00C4FF]">kyl</span><br />
          branschen
        </h1>

        <p className="text-lg font-light leading-relaxed mb-12 max-w-sm"
          style={{ color: 'rgba(255,255,255,0.55)' }}>
          {subheading ?? 'Vi utbildar och examinerar kyltekniker inom alla F-gas-kategorier 1–5 i Göteborg.'}
        </p>

        <div className="flex items-center gap-4">
          <Link href="/kurser"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#1A5EA8] hover:bg-[#2A7DD4] text-white text-sm font-semibold tracking-wider uppercase rounded transition-all hover:-translate-y-px">
            {ctaText ?? 'Se alla kurser'}
            <ArrowIcon />
          </Link>
          <Link href="/om-oss"
            className="text-sm font-medium tracking-wider uppercase pb-0.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            Om oss
          </Link>
        </div>

        {/* Stats */}
        <div className="flex gap-0 mt-16 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {[
            { num: '1–5', label: 'Alla kategorier' },
            { num: '100%', label: 'INCERT-certifierat' },
            { num: 'GBG', label: 'Göteborg' },
          ].map((stat, i) => (
            <div key={i} className="flex-1 pr-8 mr-8"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="font-condensed font-bold text-4xl text-white leading-none tracking-tight">
                {stat.num}
              </div>
              <div className="text-xs font-medium tracking-widest uppercase mt-1"
                style={{ color: 'var(--brand-steel, #8BA3BE)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Höger — live-panel */}
      <div className="relative z-10 flex items-center justify-center pt-32 pb-20 pr-16">
        <HeroUpcomingPanel events={events} />
      </div>
    </section>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}
```

---

### `components/home/HeroUpcomingPanel.tsx`

Live-panelen i hero som visar kommande kurser — hämtas från EduAdmin.

```tsx
import Link from 'next/link'
import { formatDateRange, availableSeats } from '@/lib/format'

interface Props { events: EduAdminEvent[] }

export function HeroUpcomingPanel({ events }: Props) {
  return (
    <div className="w-full max-w-[440px] rounded-lg overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Titelrad */}
      <div className="flex items-center gap-2 px-5 py-4"
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="w-2 h-2 rounded-full bg-green-500" />
        <span className="ml-2 text-[11px] font-bold tracking-widest uppercase"
          style={{ color: '#8BA3BE' }}>Kommande tillfällen</span>
      </div>

      {/* Kurslista */}
      <div>
        {events.slice(0, 5).map(event => {
          const seats = availableSeats(event)
          return (
            <div key={event.eventId}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/5 cursor-pointer"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="font-condensed font-bold text-[13px] tracking-wider text-[#00C4FF] min-w-[90px]">
                {formatDateRange(event.startDate, event.endDate)}
              </div>
              <div className="flex-1 px-4 text-[13px] font-normal"
                style={{ color: 'rgba(255,255,255,0.8)' }}>
                {event.courseName?.courseName}
              </div>
              <SeatsBadge seats={seats} />
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: 'rgba(26,94,168,0.15)', borderTop: '1px solid rgba(26,94,168,0.2)' }}>
        <span className="text-xs" style={{ color: '#8BA3BE' }}>Uppdaterat live från EduAdmin</span>
        <Link href="/kurser" className="text-xs font-medium text-[#00C4FF] hover:underline">
          Se alla →
        </Link>
      </div>
    </div>
  )
}

function SeatsBadge({ seats }: { seats: number }) {
  if (seats <= 0)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm"
      style={{ background: 'rgba(255,80,80,0.12)', color: '#ff6060' }}>Fullbokad</span>
  if (seats <= 3)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm"
      style={{ background: 'rgba(255,160,0,0.12)', color: '#ffaa00' }}>{seats} platser</span>
  return <span className="text-[11px] font-bold px-2.5 py-1 rounded-sm"
    style={{ background: 'rgba(0,196,255,0.12)', color: '#00C4FF' }}>{seats} platser</span>
}
```

---

### `components/home/UpcomingCourses.tsx`

```tsx
import Link from 'next/link'
import { formatDateRange, formatPrice, availableSeats } from '@/lib/format'

interface Props {
  heading?: string
  subtext?: string
  events: EduAdminEvent[]
}

export function UpcomingCourses({ heading, events }: Props) {
  return (
    <section className="py-24 px-18 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#1A5EA8] mb-3">
          <span className="block w-6 h-0.5 bg-[#1A5EA8]" />
          Aktuellt
        </div>
        <h2 className="font-condensed font-bold uppercase text-navy leading-none tracking-tight mb-12"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)', color: 'var(--navy)' }}>
          {heading ?? 'Kommande kurser'}
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-px mb-8"
          style={{ background: '#DDE4ED', border: '1px solid #DDE4ED', borderRadius: '6px', overflow: 'hidden' }}>
          {events.slice(0, 6).map(event => {
            const seats = availableSeats(event)
            const full = seats <= 0
            return (
              <div key={event.eventId}
                className={`bg-white p-7 flex flex-col gap-3 transition-colors ${!full ? 'hover:bg-[#f5f8fc] cursor-pointer' : 'opacity-60'}`}>
                <div className="font-condensed font-bold text-[13px] tracking-widest uppercase text-[#1A5EA8]">
                  {formatDateRange(event.startDate, event.endDate)}
                </div>
                <div className="text-[15px] font-semibold leading-snug"
                  style={{ color: 'var(--navy)' }}>
                  {event.courseName?.courseName}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {event.startTime ? `${event.startTime}–${event.endTime}` : '09:00–16:30'}
                  {event.location?.city ? ` · ${event.location.city}` : ''}
                </div>
                <div className="mt-auto flex items-center justify-between pt-4"
                  style={{ borderTop: '1px solid #EEF1F5' }}>
                  <div>
                    {event.priceIncVat > 0 && (
                      <div className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                        fr. {formatPrice(event.priceIncVat)}
                      </div>
                    )}
                    {full
                      ? <div className="text-[11px] font-bold tracking-wider uppercase text-red-600">● Fullbokad</div>
                      : seats <= 3
                        ? <div className="text-[11px] font-semibold text-amber-600">{seats} platser kvar</div>
                        : <div className="text-[11px] font-semibold text-emerald-600">{seats} platser kvar</div>
                    }
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/kurser/${event.courseName?.courseId}`}
                      className="text-xs font-medium hover:text-[#1A5EA8] transition-colors"
                      style={{ color: 'var(--muted)' }}>
                      Info
                    </Link>
                    {!full && (
                      <Link href={`/boka/${event.eventId}`}
                        className="px-4 py-1.5 bg-navy hover:bg-[#1A5EA8] text-white text-xs font-semibold tracking-wider uppercase rounded-sm transition-colors"
                        style={{ background: 'var(--navy)' }}>
                        Boka
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex justify-end">
          <Link href="/kurser"
            className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-wider uppercase text-[#1A5EA8] hover:underline">
            Se alla kommande kurser
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
```

---

### `components/home/CourseCategories.tsx`

```tsx
import Link from 'next/link'

interface Category {
  _key: string
  tagline?: string
  coursePage?: { title: string; slug: { current: string }; eduAdminCourseId: number; shortDescription?: string }
}

interface Props { heading?: string; categories: Category[] }

export function CourseCategories({ heading, categories }: Props) {
  return (
    <section className="py-24 px-18" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
          <span className="block w-6 h-0.5 bg-[#00C4FF]" />
          Utbildningar
        </div>
        <h2 className="font-condensed font-bold uppercase leading-none tracking-tight text-white mb-12"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>
          {heading ?? 'Våra utbildningsområden'}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <Link
              key={cat._key}
              href={`/kurser/${cat.coursePage?.slug?.current ?? cat.coursePage?.eduAdminCourseId}`}
              className="block p-7 rounded-lg transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,196,255,0.3)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 opacity-70 text-[#00C4FF]">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="font-condensed font-bold text-[22px] uppercase text-white leading-tight tracking-wide mb-2.5">
                {cat.coursePage?.title}
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {cat.tagline ?? cat.coursePage?.shortDescription}
              </div>
              <div className="mt-5 text-[11px] font-bold tracking-widest uppercase text-[#00C4FF] opacity-70">
                Läs mer →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

### `components/home/UspBar.tsx`

```tsx
const ICONS: Record<string, JSX.Element> = {
  certificate: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  people: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
}

export function UspBar({ items }: { items: { label: string; icon: string }[] }) {
  return (
    <div className="px-18 border-b" style={{ background: 'var(--gray-bg, #F0F3F7)', borderColor: '#DDE4ED' }}>
      <div className="max-w-6xl mx-auto flex items-stretch">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3.5 py-5 flex-1"
            style={{
              paddingRight: i < items.length - 1 ? '40px' : 0,
              marginRight: i < items.length - 1 ? '40px' : 0,
              borderRight: i < items.length - 1 ? '1px solid #DDE4ED' : 'none'
            }}>
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded"
              style={{ background: 'var(--navy)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[item.icon] ?? ICONS.certificate}
              </svg>
            </div>
            <div>
              <strong className="block text-[13px] font-semibold" style={{ color: 'var(--navy)' }}>
                {item.label}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### `components/home/ContactTeaser.tsx`

```tsx
import Link from 'next/link'

interface Props {
  heading?: string
  text?: string
  siteSettings?: { contactEmail?: string; contactPhone?: string }
}

export function ContactTeaser({ heading, text, siteSettings }: Props) {
  return (
    <section className="py-20 px-18 border-t" style={{ background: '#F0F3F7', borderColor: '#DDE4ED' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-12">
        <div>
          <h2 className="font-condensed font-bold text-4xl uppercase mb-2" style={{ color: 'var(--navy)' }}>
            {heading ?? 'Har du frågor?'}
          </h2>
          <p className="text-base font-light" style={{ color: 'var(--muted)' }}>
            {text ?? 'Vi hjälper dig att hitta rätt utbildning för din personal.'}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          {siteSettings?.contactEmail && (
            <div className="flex flex-col gap-1 px-6 py-4 bg-white rounded"
              style={{ border: '1px solid #DDE4ED' }}>
              <span className="text-[11px] tracking-wider uppercase" style={{ color: 'var(--muted)' }}>E-post</span>
              <strong className="text-[15px] font-semibold" style={{ color: 'var(--navy)' }}>
                {siteSettings.contactEmail}
              </strong>
            </div>
          )}
          {siteSettings?.contactPhone && (
            <div className="flex flex-col gap-1 px-6 py-4 bg-white rounded"
              style={{ border: '1px solid #DDE4ED' }}>
              <span className="text-[11px] tracking-wider uppercase" style={{ color: 'var(--muted)' }}>Telefon</span>
              <strong className="text-[15px] font-semibold" style={{ color: 'var(--navy)' }}>
                {siteSettings.contactPhone}
              </strong>
            </div>
          )}
          <Link href="/kontakt"
            className="inline-flex items-center gap-2 px-7 py-4 text-white text-sm font-semibold tracking-wider uppercase rounded transition-all hover:-translate-y-px"
            style={{ background: 'var(--navy)' }}>
            Kontakta oss
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
```

---

### `components/layout/SiteFooter.tsx`

```tsx
import Link from 'next/link'

export function SiteFooter({ settings }: { settings?: any }) {
  return (
    <footer className="flex items-center justify-between px-18 py-8"
      style={{ background: 'var(--navy)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="font-condensed font-bold text-sm tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.4)' }}>
        Kyl<span style={{ color: '#00C4FF' }}>utbildningen</span> i Göteborg AB
      </div>
      <div className="flex items-center gap-8">
        <Link href="/kontakt" className="text-xs hover:text-white transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}>Kontakt</Link>
        <Link href="/cookies" className="text-xs hover:text-white transition-colors"
          style={{ color: 'rgba(255,255,255,0.3)' }}>Cookies</Link>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
```

---

## Prioriteringsordning

1. Lägg till Barlow-fonterna i `app/layout.tsx`
2. Uppdatera `app/globals.css` med CSS-variabler
3. Uppdatera `tailwind.config.ts`
4. Skapa alla 7 komponenter ovan
5. Uppdatera `app/layout.tsx` med `<SiteHeader>` och `<SiteFooter>`
6. Kör `npm run dev` och kontrollera att startsidan ser korrekt ut

---

## Obs — onMouseEnter/Leave i CategoryCard

`CourseCategories.tsx` använder inline event handlers för hover-effekter eftersom
Tailwind inte stödjer dynamiska border-colors bra. Alternativt kan du ersätta
med en `group`-klass och `group-hover:` variants om du föredrar ren Tailwind.

---

*Börja med steg 1–3 (typsnitt + CSS-variabler) innan du skapar komponenterna.*
