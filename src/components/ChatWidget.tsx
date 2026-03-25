'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { AiChat } from '@/components/kontakt/AiChat'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Dölj på kontaktsidan
  if (pathname === '/kontakt') return null

  return (
    <div className="fixed bottom-6 right-6 z-50">

      {/* Chat-fönster */}
      {open && (
        <div className="mb-4 rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: '360px',
            maxHeight: '520px',
            border: '1px solid rgba(11,31,58,0.15)',
            background: 'white',
          }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--navy)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C4FF] animate-pulse" />
              <span className="text-sm font-semibold text-white">Kursassistent</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Svarar direkt
              </span>
            </div>
            <button onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white transition-colors p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Chatt */}
          <AiChat compact />
        </div>
      )}

      {/* Floating-knapp */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center
          justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'var(--navy)' }}
        aria-label="Öppna kursassistent">
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#00C4FF" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="5" y1="5" x2="19" y2="19"/>
            <line x1="19" y1="5" x2="5" y2="19"/>
            <circle cx="12" cy="12" r="2" fill="#0B1F3A"
              stroke="#00C4FF" strokeWidth="1.5"/>
          </svg>
        )}
      </button>
    </div>
  )
}
