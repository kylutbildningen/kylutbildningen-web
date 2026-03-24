import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function POST(req: NextRequest) {
  const { name, email, phone, company, subject, message } = await req.json()

  const resend = getResend()
  await Promise.all([
    resend.emails.send({
      from: 'noreply@kylutbildningen.com',
      to: 'info@kylutbildningen.se',
      subject: `Kontaktformulär: ${subject} — ${name}`,
      html: `<h2>Nytt meddelande</h2>
        <p><strong>Namn:</strong> ${name}</p>
        <p><strong>E-post:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone || '—'}</p>
        <p><strong>Företag:</strong> ${company || '—'}</p>
        <p><strong>Ärende:</strong> ${subject}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>`,
    }),
    resend.emails.send({
      from: 'noreply@kylutbildningen.com',
      to: email,
      subject: 'Tack för ditt meddelande — Kylutbildningen i Göteborg',
      html: `<p>Hej ${name},</p>
        <p>Tack för ditt meddelande! Vi återkommer inom en arbetsdag.</p>
        <p>Med vänliga hälsningar<br>
        Kylutbildningen i Göteborg AB<br>
        info@kylutbildningen.se</p>`,
    }),
  ])

  return NextResponse.json({ ok: true })
}
