import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { getUpcomingEvents } from '@/lib/eduadmin'

const client = new Anthropic()

const SYSTEM_PROMPT = `Du är en hjälpsam kursassistent för Kylutbildningen i Göteborg AB. Svara ALLTID på svenska. Var kortfattad och tydlig.

OM FÖRETAGET:
- INCERT-godkänt examinationscenter sedan 1997
- Kurser i Göteborg, välkomnar deltagare från hela Sverige
- Kontakt: info@kylutbildningen.se

KURSER:

Kategori I & II (stationära system):
- Nyexaminering Kategori I & II — 3 dagar, första certifikatet
- Omexaminering Kategori I & II — 2 dagar, förnyelse vart 5:e år
- Kategori I = obegränsad behörighet, Kategori II = under 3 kg köldmedium
- Kräver: teoretiskt prov + praktiskt prov + lödprov

Kategori V (mobila system — fordonsklimat):
- Nyexaminering Kategori V — 3 dagar
- Omexaminering Kategori V — 2 dagar
- Gäller ENBART luftkonditionering i fordon (MAC), INTE kyltransporter
- Kräver: teoretiskt prov + praktiskt prov (inget lödprov)

Övriga kurser:
- Praktisk Kylteknik 5 dagar — grundkurs för nybörjare
- Praktiskt Prov — för dig som bara behöver göra om praktiska provet
- Omprov / Examineringsprov — teoretiskt omprov
- Provtryckningskurs — trycktestning och täthetskontroll
- Utbildningsintyg (Lödprov, Mobil AC)

VANLIGA FRÅGOR:

"Vad behöver jag för att montera värmepumpar?"
→ Kategori I eller II. Börja med Nyexaminering Kategori I & II.

"Vad behöver jag för att jobba med bilklimat?"
→ Kategori V certifikat.

"Skillnad nyexaminering och omexaminering?"
→ Ny = första gången (3 dagar). Om = förnyelse vart 5:e år (2 dagar).

"Hur länge gäller certifikatet?"
→ Tillsvidare, men kräver omexaminering vart femte år.

"Behöver jag förkunskaper?"
→ Inga formella krav.

"Kan vi boka för flera anställda?"
→ Ja, kontakta oss för gruppbokning.

PRISER (ungefärliga, exkl. moms):
- Nyexaminering Kat I & II: ca 18 600 kr
- Omexaminering Kat I & II: ca 10 500 kr
- Nyexaminering Kat V: ca 14 500 kr
- Omexaminering Kat V: ca 9 500 kr

VIKTIGT — ANVÄND ALLTID MARKDOWN-LÄNKAR:
När du nämner en kurs, länka alltid direkt till kurssidan:
- Nyexaminering Kategori I & II → [Nyexaminering Kategori I & II](/kurser/nyexaminering-kategori-i-ii)
- Omexaminering Kategori I & II → [Omexaminering Kategori I & II](/kurser/omexaminering-kategori-i-ii)
- Nyexaminering Kategori V → [Nyexaminering Kategori V](/kurser/nyexaminering-kategori-v)
- Omexaminering Kategori V → [Omexaminering Kategori V](/kurser/omexaminering-kategori-v)
- Praktisk Kylteknik 5 dagar → [Praktisk Kylteknik 5 dagar](/kurser/praktisk-kylteknik-5-dagar)
- Omprov / Examineringsprov → [Omprov](/kurser/omprov)
- Provtryckningskurs → [Provtryckningskurs](/kurser/provtryckningskurs)
- Utbildningsintyg → [Utbildningsintyg](/kurser/utbildningsintyg)

Länka också till kontaktformuläret när du uppmanar att kontakta oss: [kontaktformuläret](/kontakt)
Avsluta aldrig med "Kontakta oss på info@kylutbildningen.se" utan använd istället länken [kontaktformuläret](/kontakt).

Om du inte kan svara: be dem använda [kontaktformuläret](/kontakt).

VIKTIGT — BOKNINGSLÄNKAR:
När du visar ett kurstillfälle med datum, inkludera alltid en bokningslänk:
[Boka denna kurs](/boka/EVENT_ID) — byt EVENT_ID mot det faktiska eventId.

ESKALERING TILL MÄNNISKA:
Om du inte kan svara på frågan, eller om kunden behöver personlig
hjälp, avbokning, företagsbokning eller annan komplex hantering,
avsluta svaret med exakt denna rad (och ingenting annat efter):
[ESKALERA]
Exempel på när du ska eskalera:
- Frågor om avbokning eller ombyte av kurs
- Klagomål eller reklamationer
- Företagsbokning för fler än 3 personer
- Frågor du inte kan besvara med din information
- Om kunden explicit ber att få tala med någon`

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

async function buildCatalog(): Promise<string> {
  try {
    const events = await getUpcomingEvents()
    if (events.length === 0) return '\n\nINGA KOMMANDE KURSTILLFÄLLEN TILLGÄNGLIGA JUST NU.'

    const lines = events.map(e => {
      const spots = e.isFullyBooked ? 'FULLBOKAD' : `${e.spotsLeft} platser kvar`
      const price = e.lowestPrice ? `${Math.round(e.lowestPrice)} kr exkl. moms` : ''
      return `- ${e.courseName} | ${e.city} | ${formatDate(e.startDate)}–${formatDate(e.endDate)} | ${spots}${price ? ` | ${price}` : ''} | eventId: ${e.eventId}`
    })

    return `\n\nKOMMERANDE KURSTILLFÄLLEN (realtidsdata — använd detta för att svara på frågor om datum, platser och tillgänglighet):
${lines.join('\n')}`
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const catalog = await buildCatalog()

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT + catalog,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta') {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
          )
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
