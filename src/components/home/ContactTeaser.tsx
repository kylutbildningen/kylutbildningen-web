import Link from 'next/link'

interface Props {
  heading?: string
  text?: string
  contactEmail?: string
  contactPhone?: string
}

export function ContactTeaser({ heading, text, contactEmail, contactPhone }: Props) {
  return (
    <section id="kontakt" className="py-20 border-t" style={{ background: '#F0F3F7', borderColor: '#DDE4ED' }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <h2 className="font-condensed font-bold uppercase mb-2"
            style={{ fontSize: 'clamp(24px, 4vw, 36px)', color: 'var(--navy)' }}>
            {heading ?? 'Har du frågor?'}
          </h2>
          <p className="text-base font-light" style={{ color: 'var(--muted)' }}>
            {text ?? 'Vi hjälper dig att hitta rätt utbildning för din personal.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-shrink-0 w-full md:w-auto">
          {contactEmail && (
            <div className="flex flex-col gap-1 px-6 py-4 bg-white rounded"
              style={{ border: '1px solid #DDE4ED' }}>
              <span className="text-[11px] tracking-wider uppercase" style={{ color: 'var(--muted)' }}>E-post</span>
              <strong className="text-[15px] font-semibold" style={{ color: 'var(--navy)' }}>
                {contactEmail}
              </strong>
            </div>
          )}
          {contactPhone && (
            <div className="flex flex-col gap-1 px-6 py-4 bg-white rounded"
              style={{ border: '1px solid #DDE4ED' }}>
              <span className="text-[11px] tracking-wider uppercase" style={{ color: 'var(--muted)' }}>Telefon</span>
              <strong className="text-[15px] font-semibold" style={{ color: 'var(--navy)' }}>
                {contactPhone}
              </strong>
            </div>
          )}
          <Link href="/kontakt"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 text-white text-sm font-semibold tracking-wider uppercase rounded transition-all hover:-translate-y-px"
            style={{ background: 'var(--navy)' }}>
            Kontakta oss
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
