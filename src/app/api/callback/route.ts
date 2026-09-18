import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase-server'
import { escapeHtml } from '@/lib/escape-html'
import { getClientIp, isRateLimited, HOUR, MINUTE } from '@/lib/rate-limit'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const callbackSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(50),
  preferredTime: z.string().max(100).nullish(),
  message: z.string().max(5_000).nullish(),
})

export async function POST(req: NextRequest) {
  if (isRateLimited(`callback:${getClientIp(req)}`, [
    { windowMs: 10 * MINUTE, max: 5 },
    { windowMs: HOUR, max: 10 },
  ])) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen senare.' }, { status: 429 })
  }

  const parsed = callbackSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ogiltiga uppgifter' }, { status: 400 })
  }
  const { name, phone, preferredTime, message } = parsed.data

  const supabase = await createSupabaseServer()
  await supabase.from('callback_requests').insert({
    name,
    phone,
    preferred_time: preferredTime,
    message: message || null,
    status: 'new',
  })

  await getResend().emails.send({
    from: 'noreply@kylutbildningen.se',
    to: 'info@kylutbildningen.se',
    subject: `Återuppringning önskad: ${name.replace(/[\r\n]+/g, ' ')}`,
    html: `
      <h2>Ny begäran om återuppringning</h2>
      <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Bästa tid:</strong> ${escapeHtml(preferredTime ?? '')}</p>
      ${message ? `<p><strong>Meddelande:</strong> ${escapeHtml(message)}</p>` : ''}
    `,
  })

  return NextResponse.json({ ok: true })
}
