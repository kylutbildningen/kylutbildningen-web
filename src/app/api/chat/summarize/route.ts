import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const chatText = messages
    .map((m: { role: string; content: string }) =>
      `${m.role === 'user' ? 'Kund' : 'Assistent'}: ${m.content}`)
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
