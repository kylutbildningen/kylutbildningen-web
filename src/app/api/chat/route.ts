import Anthropic from '@anthropic-ai/sdk'
import { ApifyClient } from 'apify-client'
import { NextRequest } from 'next/server'
import { getUpcomingEvents } from '@/lib/eduadmin'

const client = new Anthropic()
const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN })

const SYSTEM_PROMPT = `Du är en hjälpsam kursassistent för Kylutbildningen i Göteborg AB. Svara ALLTID på svenska. Var kortfattad och tydlig.

Du har tillgång till ett sökverktyg (search_web) för att hämta aktuell information. Använd det NÄR:
- Någon frågar om aktuella certifieringskrav eller priser från INCERT
- Någon frågar om F-gasförordningen eller regelverket
- Du behöver verifiera aktuell information från incert.se

ANVÄND INTE sökning för:
- Frågor om våra egna kurser, datum och priser (det vet du redan)
- Allmänna frågor om kylbranschen

VIKTIGA URLs att söka på vid behov:
- https://incert.se/teknikomraden/koldmedier/ (certifieringskrav)
- https://incert.se/prislista (aktuella priser)
- https://incert.se/examinationscentra-2/ (examinationscenters)

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
- Om kunden explicit ber att få tala med någon

PÅMINNELSE VIA MAIL:
Om en kund visar intresse för en kurs men verkar tveka eller säger att de ska "fundera", "kolla upp" eller "höra med chefen", erbjud ett påminnelsemail.

Avsluta ditt svar med exakt denna rad:
[ERBJUD_PÅMINNELSE: {kursnamn}]

Exempel:
- Kund: "Jag ska fundera lite"
  → [ERBJUD_PÅMINNELSE: Nyexaminering Kategori I & II]
- Kund: "Ska höra med min chef"
  → [ERBJUD_PÅMINNELSE: Omexaminering Kategori V]
- Kund: "Vilka datum finns?"
  → Svara på frågan, inget erbjudande behövs ännu`

const tools: Anthropic.Tool[] = [
  {
    name: 'search_web',
    description: 'Hämtar aktuell information från en webbsida. Använd för INCERT-priser och certifieringskrav.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: {
          type: 'string',
          description: 'URL att hämta information från',
        },
        query: {
          type: 'string',
          description: 'Vad du letar efter på sidan',
        },
      },
      required: ['url', 'query'],
    },
  },
]

async function searchWeb(url: string, query: string): Promise<string> {
  try {
    const run = await apify.actor('apify/rag-web-browser').call({
      startUrls: [{ url }],
      query,
      maxCrawlPages: 1,
    })

    const { items } = await apify.dataset(run.defaultDatasetId).listItems()
    if (items.length === 0) return 'Ingen information hittades.'

    const item = items[0] as Record<string, unknown>
    const text = item.text as string | undefined
    return text?.substring(0, 2000) || 'Kunde inte läsa sidan.'
  } catch (err) {
    console.error('Apify error:', err)
    return 'Kunde inte hämta information just nu.'
  }
}

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

    return `\n\nKOMMANDE KURSTILLFÄLLEN (realtidsdata — använd detta för att svara på frågor om datum, platser och tillgänglighet):
${lines.join('\n')}`
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  const { messages, userContext } = await req.json()

  const catalog = await buildCatalog()
  let systemPrompt = SYSTEM_PROMPT + catalog

  if (userContext?.name) {
    systemPrompt += `

INLOGGAD ANVÄNDARE:
Namn: ${userContext.name}
E-post: ${userContext.email || '—'}
Telefon: ${userContext.phone || '—'}
Företag: ${userContext.company || '—'}
Org.nr: ${userContext.orgNumber || '—'}

VIKTIGT: Hälsa användaren med förnamnet i ditt första svar. Ex: "Hej ${userContext.name.split(' ')[0]}! ..."

Om användaren vill boka en kurs:
- Du vet redan deras uppgifter — bekräfta dem istället för att fråga
- Ex: "Vill du boka som ${userContext.company || 'ditt företag'}? Dina uppgifter fylls i automatiskt på bokningssidan."
- Länka direkt till bokningssidan: [Boka denna kurs](/boka/EVENT_ID)`
  }

  // Agentic loop — AI kan anropa verktyg flera gånger
  let currentMessages = [...messages]

  while (true) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: currentMessages,
    })

    // Om AI:n är klar — skicka svaret som SSE
    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter(b => b.type === 'text')
        .map(b => (b as Anthropic.TextBlock).text)
        .join('')

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        start(controller) {
          const words = text.split(' ')
          let i = 0
          const interval = setInterval(() => {
            if (i >= words.length) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()
              clearInterval(interval)
              return
            }
            const chunk = (i === 0 ? '' : ' ') + words[i]
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
            )
            i++
          }, 20)
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Om AI:n vill använda ett verktyg
    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock

      currentMessages.push({
        role: 'assistant' as const,
        content: response.content,
      })

      if (toolUse.name === 'search_web') {
        const input = toolUse.input as { url: string; query: string }
        const result = await searchWeb(input.url, input.query)

        currentMessages.push({
          role: 'user' as const,
          content: [{
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: result,
          }],
        })
      }

      continue
    }

    break
  }

  return new Response('Stream error', { status: 500 })
}
