'use client'
import { useEffect } from 'react'
import { AiChat } from './AiChat'
import { ContactForm } from './ContactForm'
import { CallbackForm } from './CallbackForm'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center"
      onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-5xl mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl shadow-2xl"
        style={{ background: 'var(--gray-bg, #F5F7FA)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 rounded-t-xl"
          style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="font-condensed font-bold uppercase text-white text-xl">
              Hur kan vi hjälpa dig?
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Ställ en fråga eller skicka ett meddelande
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/10"
            aria-label="Stäng">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI-assistent */}
            <div>
              <h3 className="font-condensed font-bold uppercase text-lg mb-1.5"
                style={{ color: 'var(--navy)' }}>
                Fråga kursassistenten
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                Få svar direkt — assistenten hjälper dig hitta rätt kurs.
              </p>
              <AiChat />
            </div>

            {/* Kontaktformulär */}
            <div>
              <h3 className="font-condensed font-bold uppercase text-lg mb-1.5"
                style={{ color: 'var(--navy)' }}>
                Skicka ett meddelande
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
                Fyll i formuläret så återkommer vi inom en arbetsdag.
              </p>
              <ContactForm />
            </div>
          </div>

          {/* Callback */}
          <div className="mt-8 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="font-condensed font-bold uppercase text-lg mb-1.5"
                  style={{ color: 'var(--navy)' }}>
                  Vill du bli uppringd?
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Lämna ditt nummer så ringer vi upp dig — normalt inom samma arbetsdag.
                </p>
              </div>
              <CallbackForm />
            </div>
          </div>

          {/* Kontaktinfo */}
          <div className="mt-8 pt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: 'var(--blue)' }}>E-post</div>
              <a href="mailto:info@kylutbildningen.se"
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--navy)' }}>
                info@kylutbildningen.se
              </a>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: 'var(--blue)' }}>Telefon</div>
              <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                031-795 32 00
              </p>
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1"
                style={{ color: 'var(--blue)' }}>Adress</div>
              <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
                Göteborg
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
