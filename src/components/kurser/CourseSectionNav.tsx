'use client'

import { useEffect, useState, useCallback } from 'react'

interface Section {
  id: string
  label: string
  icon: string
}

const ICONS: Record<string, React.ReactNode> = {
  top: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  ),
  description: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  about: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  layout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
    </svg>
  ),
  badge: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15l-2 5 2-1 2 1-2-5z" /><circle cx="12" cy="9" r="6" />
    </svg>
  ),
  flame: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2 2-4 2z" />
    </svg>
  ),
  clock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  tabs: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v6M15 3v6" />
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  facts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

const SECTION_META: Record<string, { label: string; icon: string }> = {
  snabbfakta: { label: 'Fakta', icon: 'facts' },
  beskrivning: { label: 'Beskrivning', icon: 'description' },
  omUtbildningen: { label: 'Om kursen', icon: 'about' },
  innehall: { label: 'Innehåll', icon: 'list' },
  upplagg: { label: 'Upplägg', icon: 'layout' },
  certifiering: { label: 'Certifiering', icon: 'badge' },
  lodprov: { label: 'Lödprov', icon: 'flame' },
  dagSchema: { label: 'Schema', icon: 'clock' },
  infoFlikar: { label: 'Info', icon: 'tabs' },
  kommandeTillfallen: { label: 'Tillfällen', icon: 'calendar' },
}

interface Props {
  sectionTypes: string[]
}

export function CourseSectionNav({ sectionTypes }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [navTop, setNavTop] = useState<number | null>(null)

  // Build sections list from visible types, only including those with a DOM element
  const [sections, setSections] = useState<Section[]>([])

  useEffect(() => {
    // Wait a tick for DOM to render
    const timer = setTimeout(() => {
      const found: Section[] = []
      for (const type of sectionTypes) {
        const meta = SECTION_META[type]
        if (!meta) continue
        const el = document.getElementById(`section-${type}`)
        if (el) {
          found.push({ id: `section-${type}`, label: meta.label, icon: meta.icon })
        }
      }
      setSections(found)
    }, 500)
    return () => clearTimeout(timer)
  }, [sectionTypes])

  const updatePosition = useCallback(() => {
    // Align nav with the first section (content area start)
    const firstSection = sections[0]
    if (!firstSection) return
    const el = document.getElementById(firstSection.id)
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Keep nav fixed — use top of first section as anchor, but clamp to viewport
    const targetTop = Math.max(80, rect.top)
    setNavTop(targetTop)
  }, [sections])

  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: 0 },
    )

    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    els.forEach((el) => observer.observe(el))

    updatePosition()
    window.addEventListener('scroll', updatePosition, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updatePosition)
      window.removeEventListener('resize', updatePosition)
    }
  }, [sections, updatePosition])

  if (sections.length === 0) return null

  return (
    <nav
      className="fixed right-4 md:right-6 z-40 hidden sm:flex flex-col gap-1 transition-all duration-300"
      style={{ top: navTop ?? '50%' }}
      aria-label="Sektionsnavigation"
    >
      <div
        className="rounded-full py-2 px-1.5 flex flex-col items-center gap-1 transition-colors duration-300"
        style={{
          background: 'rgba(11,31,58,0.06)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(11,31,58,0.08)',
        }}
      >
        {/* Back to top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group relative flex items-center justify-center rounded-full transition-all duration-200"
          style={{
            width: 36,
            height: 36,
            color: 'rgba(11,31,58,0.35)',
          }}
          aria-label="Tillbaka till toppen"
        >
          {ICONS.top}
          <span
            className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: 'rgba(11,31,58,0.85)', color: '#fff' }}
          >
            Toppen
          </span>
        </button>

        {/* Divider */}
        <div className="w-5 h-px my-0.5" style={{ background: 'rgba(11,31,58,0.1)' }} />

        {sections.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: 36,
                height: 36,
                background: isActive ? 'rgba(26,94,168,0.1)' : 'transparent',
                color: isActive ? '#1A5EA8' : 'rgba(11,31,58,0.35)',
              }}
              aria-label={section.label}
            >
              {ICONS[section.icon]}
              <span
                className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: 'rgba(11,31,58,0.85)', color: '#fff' }}
              >
                {section.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
