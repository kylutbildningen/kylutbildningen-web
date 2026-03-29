'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
function openChatWidget() {
  window.dispatchEvent(new Event('open-chat-widget'))
}
function openAuthModal() {
  window.dispatchEvent(new Event('open-auth-modal'))
}
function openDashboardModal() {
  window.dispatchEvent(new Event('open-dashboard-modal'))
}

interface UserInfo {
  fullName: string
  companyName: string
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createSupabaseBrowser()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', authUser.id)
        .single()

      const { data: membership } = await supabase
        .from('company_memberships')
        .select('company_name')
        .eq('user_id', authUser.id)
        .limit(1)
        .single()

      if (profile?.full_name) {
        setUser({
          fullName: profile.full_name,
          companyName: membership?.company_name ?? '',
        })
      }
    }
    loadUser()
  }, [])

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    setUser(null)
    setMenuOpen(false)
    router.push('/')
  }

  const navLinks = [
    { href: '/', label: 'Start' },
    { href: '/kurser', label: 'Kursutbud' },
    { href: '/om-oss', label: 'Om oss' },
    { href: '/kontakt', label: 'Kontakt' },
  ]

  return (
    <>
    <header
      className="sticky top-0 z-50 h-16"
      style={{
        background: 'rgba(11,31,58,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-full">
      <Link href="/" className="font-condensed font-bold text-lg tracking-widest uppercase text-white">
        Kyl<span className="text-[#00C4FF]">utbildningen</span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map(({ href, label }) =>
          href === '/kontakt' ? (
            <button
              key={href}
              onClick={openChatWidget}
              className="text-xs font-medium tracking-widest uppercase transition-colors text-white/60 hover:text-white"
            >
              {label}
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className={`text-xs font-medium tracking-widest uppercase transition-colors
                ${pathname === href ? 'text-white' : 'text-white/60 hover:text-white'}`}
            >
              {label}
            </Link>
          )
        )}

        {user ? (
          <button
            onClick={openDashboardModal}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-colors hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
          >
            {user.fullName}
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-5 py-2 bg-[#1A5EA8] hover:bg-[#2A7DD4] text-white text-xs font-semibold tracking-wider uppercase rounded transition-colors"
          >
            Logga in
          </button>
        )}
      </nav>

      {/* Hamburger */}
      <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Meny">
        <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>
      </div>

      {/* Mobilmeny */}
      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 z-40 py-4"
          style={{ background: 'rgba(11,31,58,0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {navLinks.map(item =>
            item.href === '/kontakt' ? (
              <button
                key={item.href}
                onClick={() => { setMenuOpen(false); openChatWidget() }}
                className="block w-full text-left px-6 py-3 text-sm font-medium tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-sm font-medium tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                {item.label}
              </Link>
            )
          )}

          {user ? (
            <>
              <div className="px-6 pt-3 pb-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] tracking-wider uppercase mb-2" style={{ color: '#8BA3BE' }}>
                  {user.companyName || user.fullName}
                </p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); openDashboardModal(); }}
                className="block w-full text-left px-6 py-3 text-sm font-medium tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                Dashboard
              </button>
            </>
          ) : (
            <div className="px-6 pt-3 pb-1">
              <button onClick={() => { setMenuOpen(false); openAuthModal() }}
                className="block w-full text-center py-3 bg-[#1A5EA8] text-white text-xs font-semibold tracking-wider uppercase rounded transition-colors hover:bg-[#2A7DD4]">
                Logga in
              </button>
            </div>
          )}
        </div>
      )}
    </header>

    </>
  )
}
