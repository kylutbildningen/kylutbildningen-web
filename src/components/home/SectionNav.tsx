'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { id: 'kommande-kurser', label: 'Kurser' },
  { id: 'utbildningsomraden', label: 'Områden' },
  { id: 'kontakt', label: 'Kontakt' },
]

/** Check if the nav sits over a dark section */
function isOverDarkBackground(navY: number): boolean {
  const darkSections = ['utbildningsomraden']
  for (const id of darkSections) {
    const el = document.getElementById(id)
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (navY >= rect.top && navY <= rect.bottom) return true
  }
  // Also dark when over the hero (top of page)
  const hero = document.querySelector('section')
  if (hero) {
    const rect = hero.getBoundingClientRect()
    if (navY >= rect.top && navY <= rect.bottom) return true
  }
  return false
}

export function SectionNav() {
  const pathname = usePathname()
  const [activeId, setActiveId] = useState<string | null>(null)
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

    const handleScroll = () => {
      updateBackground()
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isHome, updateBackground])

  if (!isHome) return null

  const dotActive = onDark ? '#00C4FF' : 'var(--blue)'
  const dotInactive = onDark ? 'rgba(255,255,255,0.3)' : 'var(--border)'
  const labelColor = onDark ? 'rgba(255,255,255,0.8)' : 'var(--navy)'

  return (
    <nav
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4"
      aria-label="Sektionsnavigation"
    >
      {SECTIONS.map((section) => {
        const isActive = activeId === section.id
        return (
          <button
            key={section.id}
            onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
            className="group flex items-center gap-3 cursor-pointer"
            aria-label={section.label}
          >
            <span
              className="text-[10px] font-bold tracking-[0.12em] uppercase transition-all duration-200"
              style={{
                color: labelColor,
                opacity: isActive ? 1 : 0,
              }}
            >
              {section.label}
            </span>
            <span
              className="block rounded-full transition-all duration-200 group-hover:scale-125"
              style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                background: isActive ? dotActive : dotInactive,
              }}
            />
          </button>
        )
      })}
    </nav>
  )
}
