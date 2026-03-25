'use client'
import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { AiChat } from '@/components/kontakt/AiChat'

export interface UserContext {
  name?: string
  email?: string
  phone?: string
  company?: string
  orgNumber?: string
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: membership }] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('company_memberships').select('company_name, org_number').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      ])

      setUserContext({
        name: profile?.full_name,
        email: user.email,
        phone: profile?.phone,
        company: membership?.company_name,
        orgNumber: membership?.org_number,
      })
    }

    loadUser()
  }, [])

  if (pathname === '/kontakt') return null

  const onDragStart = (e: React.MouseEvent) => {
    dragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPosition({
        x: dragStart.current.px + (e.clientX - dragStart.current.x),
        y: dragStart.current.py + (e.clientY - dragStart.current.y),
      })
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const handleClose = () => {
    setOpen(false)
    setMinimized(false)
    setChatKey(k => k + 1)
  }

  return (
    <div
      className="fixed z-50"
      style={{
        bottom: `${24 - position.y}px`,
        right: `${24 - position.x}px`,
      }}
    >
      {open && (
        <div
          className="mb-4 rounded-xl shadow-2xl flex flex-col"
          style={{
            width: minimized ? '280px' : '380px',
            height: minimized ? 'auto' : undefined,
            border: '1px solid rgba(11,31,58,0.15)',
            background: 'white',
            resize: minimized ? 'none' : 'both',
            overflow: 'hidden',
            minWidth: minimized ? '280px' : '300px',
            minHeight: minimized ? 'auto' : '400px',
            maxWidth: '600px',
            maxHeight: minimized ? 'none' : '80vh',
          }}
        >
          {/* Header — drag-handle */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 select-none"
            style={{ background: 'var(--navy)', cursor: 'move' }}
            onMouseDown={onDragStart}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C4FF] animate-pulse" />
              <span className="text-sm font-semibold text-white">Kursassistent</span>
              {!minimized && (
                userContext?.name ? (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    — Hej {userContext.name.split(' ')[0]}!
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Svarar direkt
                  </span>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Drag-ikoner */}
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                {[0, 4, 8].map(y => (
                  <g key={y}>
                    <circle cx="2" cy={y + 3} r="1" fill="rgba(255,255,255,0.3)"/>
                    <circle cx="8" cy={y + 3} r="1" fill="rgba(255,255,255,0.3)"/>
                  </g>
                ))}
              </svg>

              {/* Minimera-knapp */}
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(m => !m) }}
                className="text-white/40 hover:text-white transition-colors p-1"
                title={minimized ? 'Expandera' : 'Minimera'}
              >
                {minimized ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14"/>
                  </svg>
                )}
              </button>

              {/* Stäng-knapp — rensar historik */}
              <button
                onClick={(e) => { e.stopPropagation(); handleClose() }}
                className="text-white/40 hover:text-white transition-colors p-1"
                title="Stäng och rensa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Chatt — flex-1 fyller fönstret vid resize */}
          {!minimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <AiChat key={chatKey} compact userContext={userContext} />
            </div>
          )}
        </div>
      )}

      {/* Floating-knapp */}
      <button
        onClick={() => {
          if (!open) {
            setOpen(true)
            setMinimized(false)
          } else {
            setMinimized(m => !m)
          }
        }}
        className="w-14 h-14 rounded-full shadow-xl flex items-center
          justify-center transition-all hover:scale-110 active:scale-95 ml-auto"
        style={{ background: 'var(--navy)' }}
        aria-label="Öppna kursassistent"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="5" y1="5" x2="19" y2="19"/>
          <line x1="19" y1="5" x2="5" y2="19"/>
          <circle cx="12" cy="12" r="2" fill="#0B1F3A"
            stroke="#00C4FF" strokeWidth="1.5"/>
        </svg>
      </button>
    </div>
  )
}
