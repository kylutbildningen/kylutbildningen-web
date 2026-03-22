'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      style={{ background: 'var(--navy)', borderTop: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row
        items-start md:items-center justify-between gap-4">

        <div className="flex-1">
          <p className="text-sm font-medium text-white mb-1">
            Vi använder cookies
          </p>
          <p className="text-xs leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Vi använder nödvändiga cookies för att siten ska fungera korrekt.
            Läs mer i vår{' '}
            <Link href="/cookies"
              className="underline hover:text-white transition-colors"
              style={{ color: '#00C4FF' }}>
              cookiepolicy
            </Link>.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-xs font-semibold tracking-wider
              uppercase transition-colors rounded"
            style={{
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
          >
            Avvisa
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-xs font-semibold tracking-wider
              uppercase rounded transition-colors text-white"
            style={{ background: '#1A5EA8' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2A7DD4')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1A5EA8')}
          >
            Acceptera
          </button>
        </div>
      </div>
    </div>
  )
}
