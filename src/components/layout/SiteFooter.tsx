'use client'

import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer
      className="py-8"
      style={{ background: 'var(--navy)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center md:justify-between gap-4">
          <div className="font-condensed font-bold text-sm tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            Kyl<span style={{ color: '#00C4FF' }}>utbildningen</span> i Göteborg AB
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button onClick={() => window.dispatchEvent(new Event('open-chat-widget'))}
              className="text-xs hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Kontakt</button>
            <Link href="/villkor" className="text-xs hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Villkor</Link>
            <Link href="/cookies" className="text-xs hover:text-white transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}>Cookies</Link>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
