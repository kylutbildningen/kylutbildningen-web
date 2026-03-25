import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getUpcomingEvents } from '@/lib/eduadmin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { email, course } = await req.json()

  // Get upcoming dates for the course
  const allEvents = await getUpcomingEvents()
  const dates = allEvents
    .filter(e =>
      e.courseName?.toLowerCase().includes(course.toLowerCase()) &&
      !e.isFullyBooked &&
      new Date(e.startDate) > new Date()
    )
    .slice(0, 4)
    .map(e => ({
      date: new Date(e.startDate).toLocaleDateString('sv-SE', {
        day: 'numeric', month: 'long', year: 'numeric',
      }),
      spots: e.spotsLeft,
      price: e.lowestPrice,
    }))

  const datesHtml = dates.length > 0
    ? dates.map(d => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #EEF1F5">${d.date}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #EEF1F5">${d.spots} platser kvar</td>
          <td style="padding:8px 12px;border-bottom:1px solid #EEF1F5">fr. ${d.price?.toLocaleString('sv-SE')} kr</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="padding:12px">Inga kommande datum just nu — kontakta oss!</td></tr>'

  await resend.emails.send({
    from: 'noreply@kylutbildningen.se',
    to: email,
    subject: `Kommande datum — ${course} | Kylutbildningen`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#0B1F3A;padding:24px;border-radius:8px 8px 0 0">
          <h2 style="color:white;margin:0;font-size:20px">
            Kyl<span style="color:#00C4FF">utbildningen</span>
          </h2>
        </div>
        <div style="padding:24px;background:white;border:1px solid #DDE4ED">
          <p style="color:#333;margin-top:0">
            Här är kommande datum för <strong>${course}</strong>:
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#F0F3F7">
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8">Datum</th>
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8">Platser</th>
                <th style="padding:8px 12px;text-align:left;color:#1A5EA8">Pris</th>
              </tr>
            </thead>
            <tbody>${datesHtml}</tbody>
          </table>
          <div style="margin-top:24px;text-align:center">
            <a href="https://kylutbildningen.com/kurser"
              style="background:#1A5EA8;color:white;padding:12px 24px;
                border-radius:6px;text-decoration:none;font-size:13px;
                font-weight:600;letter-spacing:0.05em">
              SE ALLA KURSER →
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;margin-bottom:0">
            Frågor? Kontakta oss på
            <a href="mailto:info@kylutbildningen.se" style="color:#1A5EA8">
              info@kylutbildningen.se
            </a>
          </p>
        </div>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
