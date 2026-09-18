import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getClientIp, isRateLimited, HOUR, MINUTE } from '@/lib/rate-limit'

const client = new Anthropic()

const summarizeSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string().max(4_000),
  })).min(1).max(40),
})

export async function POST(req: NextRequest) {
  if (isRateLimited(`summarize:${getClientIp(req)}`, [
    { windowMs: 10 * MINUTE, max: 5 },
    { windowMs: HOUR, max: 10 },
  ])) {
    return NextResponse.json({ error: 'För många förfrågningar. Försök igen senare.' }, { status: 429 })
  }

  const parsed = summarizeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ogiltig förfrågan' }, { status: 400 })
  }

  const chatText = parsed.data.messages
    .map((m) => `${m.role === 'user' ? 'Kund' : 'Assistent'}: ${m.content}`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Sammanfatta denna chatt i 2-3 meningar på svenska.
Fokusera på vad kunden frågade om och vad de behöver hjälp med.
Skriv i tredje person, t.ex. "Kunden undrar om...".
Var kortfattad och konkret.

Chatt:
${chatText}`
    }]
  })

  const summary = response.content[0].type === 'text'
    ? response.content[0].text
    : ''

  return NextResponse.json({ summary })
}
