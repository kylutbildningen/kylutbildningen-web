'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
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

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [unreadCount, setUnreadCount] = useState(0)
  const [maximized, setMaximized] = useState(false)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const pathname = usePathname()
  const isMobile = useIsMobile()

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

  // Listen for open-chat events from header/footer — toggle on repeat click
  useEffect(() => {
    const handler = () => {
      if (open && !minimized) {
        setMinimized(true)
      } else if (open && minimized) {
        setMinimized(false)
      } else {
        handleOpen()
      }
    }
    window.addEventListener('open-chat-widget', handler)
    return () => window.removeEventListener('open-chat-widget', handler)
  }) // re-subscribe on every render to capture current open/minimized state

  // Lock body scroll on mobile when chat is open
  useEffect(() => {
    if (isMobile && open && !minimized) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile, open, minimized])

  const onDragStart = (e: React.MouseEvent) => {
    if (isMobile) return
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
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
      setMinimized(false)
      setMaximized(false)
      setChatKey(k => k + 1)
    }, 200)
  }

  const handleOpen = () => {
    setOpen(true)
    setMinimized(false)
    setUnreadCount(0)
  }

  const handleUnminimize = () => {
    setMinimized(false)
    setUnreadCount(0)
  }

  const onNewMessage = useCallback(() => {
    if (minimized) {
      setUnreadCount(c => c + 1)
    }
  }, [minimized])

  // Mobile: fullscreen overlay
  if (isMobile) {
    return (
      <>
        {(open || closing) && !minimized && (
          <div
            className={`fixed inset-0 z-50 flex flex-col ${closing ? 'chat-window-exit' : 'chat-window-enter'}`}
            style={{ background: 'white', transformOrigin: 'bottom right' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0B1F3A 0%, #112847 100%)',
                borderBottom: '1px solid rgba(0,196,255,0.1)',
                paddingTop: 'max(12px, env(safe-area-inset-top))',
              }}>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,196,255,0.15)' }}>
                  <span className="text-xs">🤖</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white leading-tight">Kursassistent</span>
                  <span className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {userContext?.name ? `Hej ${userContext.name.split(' ')[0]}!` : 'Svarar direkt'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white transition-colors p-2 -mr-1 rounded-lg hover:bg-white/10"
                aria-label="Stäng"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Chat */}
            <div className="flex-1 flex flex-col overflow-hidden"
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <AiChat key={chatKey} compact userContext={userContext} onNewMessage={onNewMessage} />
            </div>
          </div>
        )}

        {/* Floating button */}
        <div className="fixed z-50" style={{ bottom: '16px', right: '16px' }}>
          <button
            onClick={() => {
              if (!open) handleOpen()
              else if (minimized) handleUnminimize()
              else handleClose()
            }}
            className="relative w-14 h-14 rounded-full shadow-xl flex items-center
              justify-center transition-all duration-200 active:scale-95"
            style={{ background: 'var(--navy)' }}
            aria-label="Öppna kursassistent"
          >
            {!open && (
              <span className="absolute inset-0 rounded-full chat-pulse-ring"
                style={{ background: 'rgba(0,196,255,0.2)' }} />
            )}
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="#00C4FF" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
                style={{ animation: 'messagePop 0.3s ease-out' }}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </>
    )
  }

  // Desktop / tablet
  return (
    <div
      className="fixed z-50"
      style={{
        bottom: `${24 - position.y}px`,
        right: `${24 - position.x}px`,
      }}
    >
      {(open || closing) && (
        <div
          className={`mb-4 rounded-2xl flex flex-col ${closing ? 'chat-window-exit' : 'chat-window-enter'}`}
          style={{
            width: minimized ? '280px' : maximized ? 'min(600px, calc(100vw - 48px))' : 'min(380px, calc(100vw - 48px))',
            height: minimized ? 'auto' : maximized ? 'calc(100dvh - 100px)' : 'min(520px, calc(100dvh - 100px))',
            background: 'white',
            resize: minimized || maximized ? 'none' : 'both',
            overflow: 'hidden',
            minWidth: minimized ? '280px' : '300px',
            minHeight: minimized ? 'auto' : 'min(400px, calc(100dvh - 100px))',
            maxWidth: 'min(600px, calc(100vw - 48px))',
            maxHeight: minimized ? 'none' : 'calc(100dvh - 100px)',
            boxShadow: '0 25px 50px -12px rgba(11,31,58,0.25), 0 0 0 1px rgba(11,31,58,0.06)',
            transformOrigin: 'bottom right',
            transition: 'width 0.25s ease, height 0.25s ease',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0 select-none"
            style={{
              background: 'linear-gradient(135deg, #0B1F3A 0%, #112847 100%)',
              borderBottom: '1px solid rgba(0,196,255,0.1)',
              cursor: 'move',
            }}
            onMouseDown={onDragStart}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(0,196,255,0.15)' }}>
                <span className="text-xs">🤖</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white leading-tight">Kursassistent</span>
                {!minimized && (
                  <span className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {userContext?.name
                      ? `Hej ${userContext.name.split(' ')[0]}!`
                      : 'Svarar direkt'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Drag icon */}
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="opacity-30">
                {[0, 4, 8].map(y => (
                  <g key={y}>
                    <circle cx="2" cy={y + 3} r="1" fill="white"/>
                    <circle cx="8" cy={y + 3} r="1" fill="white"/>
                  </g>
                ))}
              </svg>

              {/* Minimize */}
              <button
                onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); if (minimized) setUnreadCount(0) }}
                className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
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

              {/* Maximize */}
              {!minimized && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMaximized(m => !m) }}
                  className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                  title={maximized ? 'Återställ' : 'Maximera'}
                >
                  {maximized ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 14 10 14 10 20"/>
                      <polyline points="20 10 14 10 14 4"/>
                      <line x1="14" y1="10" x2="21" y2="3"/>
                      <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 3 21 3 21 9"/>
                      <polyline points="9 21 3 21 3 15"/>
                      <line x1="21" y1="3" x2="14" y2="10"/>
                      <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                  )}
                </button>
              )}

              {/* Close */}
              <button
                onClick={(e) => { e.stopPropagation(); handleClose() }}
                className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
                title="Stäng och rensa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Chat */}
          {!minimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <AiChat key={chatKey} compact userContext={userContext} onNewMessage={onNewMessage} />
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => {
          if (!open) {
            handleOpen()
          } else if (minimized) {
            handleUnminimize()
          } else {
            setMinimized(true)
          }
        }}
        className="relative w-14 h-14 rounded-full shadow-xl flex items-center
          justify-center transition-all duration-200 hover:scale-110 active:scale-95 ml-auto"
        style={{ background: 'var(--navy)' }}
        aria-label="Öppna kursassistent"
      >
        {!open && (
          <span className="absolute inset-0 rounded-full chat-pulse-ring"
            style={{ background: 'rgba(0,196,255,0.2)' }} />
        )}
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="#00C4FF" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            style={{ animation: 'messagePop 0.3s ease-out' }}>
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
