import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function POST(req: NextRequest) {
  const { name, phone, preferredTime, message } = await req.json()

  const supabase = await createSupabaseServer()
  await supabase.from('callback_requests').insert({
    name,
    phone,
    preferred_time: preferredTime,
    message: message || null,
    status: 'new',
  })

  await getResend().emails.send({
    from: 'noreply@kylutbildningen.com',
    to: 'info@kylutbildningen.se',
    subject: `Återuppringning önskad: ${name}`,
    html: `
      <h2>Ny begäran om återuppringning</h2>
      <p><strong>Namn:</strong> ${name}</p>
      <p><strong>Telefon:</strong> ${phone}</p>
      <p><strong>Bästa tid:</strong> ${preferredTime}</p>
      ${message ? `<p><strong>Meddelande:</strong> ${message}</p>` : ''}
    `,
  })

  return NextResponse.json({ ok: true })
}
