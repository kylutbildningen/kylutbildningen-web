'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

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
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-12 h-16"
      style={{
        background: 'rgba(11,31,58,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Link href="/" className="font-condensed font-bold text-lg tracking-widest uppercase text-white">
        Kyl<span className="text-[#00C4FF]">utbildningen</span>
      </Link>

      <nav className="flex items-center gap-8">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-xs font-medium tracking-widest uppercase transition-colors
              ${pathname === href ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            {label}
          </Link>
        ))}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
            >
              {user.fullName}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4l4 4 4-4" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div
                  className="absolute right-0 top-full z-20 mt-1 w-48 rounded overflow-hidden shadow-xl"
                  style={{ background: '#112847', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {user.companyName && (
                    <div className="px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] tracking-wider uppercase" style={{ color: '#8BA3BE' }}>
                        {user.companyName}
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs tracking-wider hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/kurser"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2.5 text-xs tracking-wider hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    Boka kurs
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-xs tracking-wider hover:bg-white/5 transition-colors"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: '#8BA3BE' }}
                  >
                    Logga ut
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/logga-in"
            className="px-5 py-2 bg-[#1A5EA8] hover:bg-[#2A7DD4] text-white text-xs font-semibold tracking-wider uppercase rounded transition-colors"
          >
            Logga in
          </Link>
        )}
      </nav>
    </header>
  )
}
