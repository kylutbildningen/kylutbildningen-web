import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer
      className="flex items-center justify-between px-12 py-8"
      style={{ background: 'var(--navy)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
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
