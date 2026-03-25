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
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
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
    setDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      setPosition({
        x: dragStart.current.px + (e.clientX - dragStart.current.x),
        y: dragStart.current.py + (e.clientY - dragStart.current.y),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

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
          className="mb-4 rounded-xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            width: '380px',
            height: '520px',
            border: '1px solid rgba(11,31,58,0.15)',
            background: 'white',
            resize: 'both',
            overflow: 'auto',
            minWidth: '300px',
            minHeight: '400px',
            maxWidth: '600px',
          }}
        >
          {/* Header — drag-handle */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-move flex-shrink-0 select-none"
            style={{ background: 'var(--navy)' }}
            onMouseDown={onDragStart}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C4FF] animate-pulse" />
              <span className="text-sm font-semibold text-white">Kursassistent</span>
              {userContext?.name ? (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  — Hej {userContext.name.split(' ')[0]}!
                </span>
              ) : (
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Svarar direkt
                </span>
              )}
            </div>
            {/* Drag-ikon + stäng */}
            <div className="flex items-center gap-3">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                <circle cx="9" cy="5" r="1" fill="currentColor"/>
                <circle cx="15" cy="5" r="1" fill="currentColor"/>
                <circle cx="9" cy="12" r="1" fill="currentColor"/>
                <circle cx="15" cy="12" r="1" fill="currentColor"/>
                <circle cx="9" cy="19" r="1" fill="currentColor"/>
                <circle cx="15" cy="19" r="1" fill="currentColor"/>
              </svg>
              <button onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Chatt */}
          <div className="flex-1 overflow-hidden">
            <AiChat compact userContext={userContext} />
          </div>
        </div>
      )}

      {/* Floating-knapp */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center
          justify-center transition-all hover:scale-110 active:scale-95 ml-auto"
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
