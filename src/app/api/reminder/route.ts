import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getUpcomingEvents } from '@/lib/eduadmin'

const resend = new Resend(process.env.RESEND_API_KEY)

/** Check if course name matches the search query */
function courseMatches(courseName: string, query: string): boolean {
  const name = courseName.toLowerCase().trim()
  const q = query.toLowerCase().trim()

  // Direct substring match (either direction)
  if (name.includes(q) || q.includes(name)) return true

  // Extract the category part (I, II, V, I & II, etc.) — these MUST match
  const catPattern = /kategori\s+([\divIV&\s]+)/i
  const queryCat = q.match(catPattern)?.[1]?.replace(/\s+/g, '').toLowerCase()
  const nameCat = name.match(catPattern)?.[1]?.replace(/\s+/g, '').toLowerCase()

  // If query specifies a category, the name must have the same category
  if (queryCat && nameCat && queryCat !== nameCat) return false

  // Check type match (ny/om-examinering)
  const queryIsNy = q.includes('nyexam') || q.includes('ny exam')
  const queryIsOm = q.includes('omexam') || q.includes('om exam')
  const nameIsNy = name.includes('nyexam') || name.includes('ny exam')
  const nameIsOm = name.includes('omexam') || name.includes('om exam')

  if (queryIsNy && !nameIsNy) return false
  if (queryIsOm && !nameIsOm) return false

  // If category and type both match, it's a match
  if (queryCat && nameCat && queryCat === nameCat) return true

  return false
}

export async function POST(req: NextRequest) {
  const { email, course } = await req.json()

  const allEvents = await getUpcomingEvents()
  const isAll = !course || course === 'alla kurser'

  const dates = allEvents
    .filter(e => {
      if (e.isFullyBooked || new Date(e.startDate) <= new Date()) return false
      if (isAll) return true
      return courseMatches(e.courseName || '', course)
    })
    .slice(0, 6)
    .map(e => ({
      name: e.courseName,
      date: new Date(e.startDate).toLocaleDateString('sv-SE', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
      endDate: new Date(e.endDate).toLocaleDateString('sv-SE', {
        day: 'numeric', month: 'long',
      }),
      spots: e.spotsLeft,
      price: e.lowestPrice,
      eventId: e.eventId,
    }))

  const courseLabel = isAll ? 'alla kurser' : course

  const datesHtml = dates.length > 0
    ? dates.map(d => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5;font-weight:500;color:#0B1F3A">
            ${isAll ? `<strong>${d.name}</strong><br>` : ''}${d.date}–${d.endDate}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5;color:#555">${d.spots} platser kvar</td>
          <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5;color:#555">fr. ${d.price?.toLocaleString('sv-SE')} kr</td>
          <td style="padding:10px 12px;border-bottom:1px solid #EEF1F5">
            <a href="https://kylutbildningen.com/boka/${d.eventId}"
              style="background:#1A5EA8;color:white;padding:6px 14px;border-radius:4px;
                text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap">
              Boka →
            </a>
          </td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#888">
        Inga kommande datum hittades för ${courseLabel} just nu.
        Kontakta oss så hjälper vi dig!
      </td></tr>`

  await resend.emails.send({
    from: 'noreply@kylutbildningen.se',
    to: email,
    subject: `Kommande datum — ${courseLabel} | Kylutbildningen`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#0B1F3A;padding:24px;border-radius:8px 8px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">
            Kyl<span style="color:#00C4FF">utbildningen</span>
          </h2>
        </div>
        <div style="padding:24px;background:white;border:1px solid #DDE4ED;border-top:none">
          <p style="color:#333;margin-top:0;font-size:15px">
            Hej! Här är kommande datum för <strong>${courseLabel}</strong>:
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#F0F3F7">
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Datum</th>
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Platser</th>
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Pris</th>
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8;font-size:11px;text-transform:uppercase;letter-spacing:0.05em"></th>
              </tr>
            </thead>
            <tbody>${datesHtml}</tbody>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="https://kylutbildningen.com/kurser"
              style="background:#0B1F3A;color:white;padding:12px 28px;
                border-radius:6px;text-decoration:none;font-size:13px;
                font-weight:600;letter-spacing:0.05em">
              SE ALLA KURSER →
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;margin-bottom:0;text-align:center">
            Kylutbildningen i Göteborg AB — INCERT-godkänt examinationscenter sedan 1997
          </p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
