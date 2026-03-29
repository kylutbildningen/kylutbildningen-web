'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { id: 'hero', label: 'Start', icon: 'home' },
  { id: 'kommande-kurser', label: 'Kurser', icon: 'calendar' },
  { id: 'utbildningsomraden', label: 'Områden', icon: 'grid' },
]

const ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  ),
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  grid: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
}

/** Check if the nav sits over a dark section */
function isOverDarkBackground(navY: number): boolean {
  const darkSections = ['utbildningsomraden']
  for (const id of darkSections) {
    const el = document.getElementById(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (navY >= rect.top && navY <= rect.bottom) return true
  }
  const hero = document.querySelector('section')
  if (hero) {
    const rect = hero.getBoundingClientRect()
    if (navY >= rect.top && navY <= rect.bottom) return true
  }
  return false
}

export function SectionNav() {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>('hero')
  const [onDark, setOnDark] = useState(true)
  const isHome = pathname === '/'

  const updateBackground = useCallback(() => {
    const navY = window.innerHeight / 2
    setOnDark(isOverDarkBackground(navY))
  }, [])

  useEffect(() => {
    if (!isHome) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    )

    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    els.forEach((el) => observer.observe(el))

    const handleScroll = () => updateBackground()
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome, updateBackground])

  if (!isHome) return null

  return (
    <nav
      className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-1"
      aria-label="Sektionsnavigation"
    >
      <div
        className="rounded-full py-2 px-1.5 flex flex-col items-center gap-1 transition-colors duration-300"
        style={{
          background: onDark ? 'rgba(255,255,255,0.1)' : 'rgba(11,31,58,0.06)',
          backdropFilter: 'blur(8px)',
          border: onDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(11,31,58,0.08)',
        }}
      >
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id
          return (
            <button
              key={section.id}
              onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex items-center justify-center rounded-full transition-all duration-200"
              style={{
                width: 36,
                height: 36,
                background: isActive
                  ? (onDark ? 'rgba(0,196,255,0.2)' : 'rgba(26,94,168,0.1)')
                  : 'transparent',
                color: isActive
                  ? (onDark ? '#00C4FF' : '#1A5EA8')
                  : (onDark ? 'rgba(255,255,255,0.5)' : 'rgba(11,31,58,0.35)'),
              }}
              aria-label={section.label}
            >
              {ICONS[section.icon]}

              {/* Tooltip */}
              <span
                className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{
                  background: onDark ? 'rgba(0,0,0,0.7)' : 'rgba(11,31,58,0.85)',
                  color: '#fff',
                }}
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
