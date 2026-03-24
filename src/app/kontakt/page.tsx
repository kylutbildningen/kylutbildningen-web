import { AiChat } from '@/components/kontakt/AiChat'
import { ContactForm } from '@/components/kontakt/ContactForm'
import { CallbackForm } from '@/components/kontakt/CallbackForm'

export default function KontaktPage() {
  return (
    <main>
      {/* Hero */}
      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
          <div className="flex items-center gap-2.5 text-[11px] font-bold
            tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
            <span className="block w-6 h-0.5 bg-[#00C4FF]" />
            Kontakt
          </div>
          <h1 className="font-condensed font-bold uppercase text-white leading-none"
            style={{ fontSize: 'clamp(40px, 5vw, 64px)' }}>
            Hur kan vi hjälpa dig?
          </h1>
          <p className="mt-4 text-lg font-light max-w-xl"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            Ställ en fråga direkt till vår kursassistent, eller skicka
            ett meddelande så återkommer vi inom en arbetsdag.
          </p>
        </div>
      </div>

      {/* Tvåkolumns-layout */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* VÄNSTER — AI-assistent */}
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-2"
              style={{ color: 'var(--navy)' }}>
              Fråga kursassistenten
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Få svar direkt — assistenten hjälper dig hitta rätt kurs
              och svarar på vanliga frågor om F-gas-certifiering.
            </p>
            <AiChat />
          </div>

          {/* HÖGER — Kontaktformulär */}
          <div>
            <h2 className="font-condensed font-bold uppercase text-2xl mb-2"
              style={{ color: 'var(--navy)' }}>
              Skicka ett meddelande
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Fyll i formuläret så återkommer vi inom en arbetsdag.
            </p>
            <ContactForm />
          </div>
        </div>

        {/* Ring mig upp */}
        <div className="mt-12 pt-12" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-condensed font-bold uppercase text-2xl mb-2"
                style={{ color: 'var(--navy)' }}>
                Vill du bli uppringd?
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Lämna ditt nummer så ringer vi upp dig — normalt inom samma arbetsdag.
                Vi hjälper dig hitta rätt kurs och kan boka direkt i telefon.
              </p>
            </div>
            <CallbackForm />
          </div>
        </div>

        {/* Kontaktinfo */}
        <div className="mt-16 pt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
          style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>E-post</div>
            <a href="mailto:info@kylutbildningen.se"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--navy)' }}>
              info@kylutbildningen.se
            </a>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>Telefon</div>
            <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
              031-795 32 00
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase mb-2"
              style={{ color: 'var(--blue)' }}>Adress</div>
            <p className="text-sm font-medium" style={{ color: 'var(--navy)' }}>
              Göteborg
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
