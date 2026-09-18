import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { escapeHtml } from '@/lib/escape-html'
import { getClientIp, isRateLimited, HOUR, MINUTE } from '@/lib/rate-limit'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().max(50).nullish(),
  company: z.string().max(200).nullish(),
  subject: z.string().max(200).nullish(),
  message: z.string().max(10_000).nullish(),
})

export async function POST(req: NextRequest) {
  if (isRateLimited(`contact:${getClientIp(req)}`, [
    { windowMs: 10 * MINUTE, max: 5 },
    { windowMs: HOUR, max: 10 },
  ])) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen senare.' }, { status: 429 })
  }

  const parsed = contactSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ogiltiga uppgifter' }, { status: 400 })
  }
  const { name, email, phone, company, subject, message } = parsed.data

  // Header-safe subject (no newlines), HTML-escaped body
  const subjectLine = `${subject ?? ''} — ${name}`.replace(/[\r\n]+/g, ' ')

  const resend = getResend()
  await Promise.all([
    resend.emails.send({
      from: 'noreply@kylutbildningen.se',
      to: 'info@kylutbildningen.se',
      replyTo: email,
      subject: `Kontaktformulär: ${subjectLine}`,
      html: `<h2>Nytt meddelande</h2>
        <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-post:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(phone || '—')}</p>
        <p><strong>Företag:</strong> ${escapeHtml(company || '—')}</p>
        <p><strong>Ärende:</strong> ${escapeHtml(subject ?? '')}</p>
        <hr>
        <p>${escapeHtml(message ?? '').replace(/\n/g, '<br>')}</p>`,
    }),
    resend.emails.send({
      from: 'noreply@kylutbildningen.se',
      to: email,
      subject: 'Tack för ditt meddelande — Kylutbildningen i Göteborg',
      html: `<p>Hej ${escapeHtml(name)},</p>
        <p>Tack för ditt meddelande! Vi återkommer inom en arbetsdag.</p>
        <p>Med vänliga hälsningar<br>
        Kylutbildningen i Göteborg AB<br>
        info@kylutbildningen.se</p>`,
    }),
  ])

  return NextResponse.json({ ok: true })
}
