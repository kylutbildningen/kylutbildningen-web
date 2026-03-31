import { NextRequest, NextResponse } from 'next/server'
import { getUpcomingEvents } from '@/lib/eduadmin'

// VAPI anropar denna route som ett function tool under samtal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // VAPI skickar tool call-data i body
    const toolCallId = body?.message?.toolCallList?.[0]?.id || 'unknown'

    // Hämta kommande kurser från EduAdmin
    const events = await getUpcomingEvents()

    // Filtrera och formatera för röstassistenten
    const now = new Date()
    const upcoming = events
      .filter((e) => new Date(e.startDate) > now)
      .slice(0, 8)
      .map((e) => {
        const dateStr = new Date(e.startDate).toLocaleDateString('sv-SE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        const status = e.isFullyBooked
          ? 'fullbokad'
          : `${e.spotsLeft} platser kvar`

        return `${e.courseName} — ${dateStr} — ${status}`
      })

    const result =
      upcoming.length > 0
        ? `Kommande kurser:\n${upcoming.join('\n')}`
        : 'Inga kommande kurser hittades just nu.'

    // VAPI function tool response-format
    return NextResponse.json({
      results: [
        {
          toolCallId,
          result,
        },
      ],
    })
  } catch (err) {
    console.error('VAPI EduAdmin error:', err)
    return NextResponse.json({
      results: [
        {
          toolCallId: 'error',
          result:
            'Kunde inte hämta kursinformation just nu. Be kunden besöka kylutbildningen.se/kurser.',
        },
      ],
    })
  }
}
