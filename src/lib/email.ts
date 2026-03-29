/**
 * Email sending via Resend.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "bokning@kylutbildningen.se";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kylutbildningen.se";

interface BookingEmailData {
  bookingNumber: string;
  courseName: string;
  eventDate: string;
  eventCity: string;
  companyName: string;
  contactName: string;
  paymentMethod: "card" | "invoice";
  participants: Array<{ firstName: string; lastName: string; email: string }>;
  totalPriceExVat: number;
}

export async function sendBookingConfirmation(
  to: string[],
  data: BookingEmailData,
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("Resend not configured — skipping email to:", to.join(", "));
    console.log("Booking confirmation data:", JSON.stringify(data, null, 2));
    return;
  }

  const participantList = data.participants
    .map((p) => `• ${p.firstName} ${p.lastName} (${p.email})`)
    .join("\n");

  const paymentText =
    data.paymentMethod === "invoice"
      ? "Faktura skickas separat."
      : "Betalning har genomförts med kort.";

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #1a2332;">
      <div style="background: linear-gradient(135deg, #1a2332, #2d3a4a); padding: 32px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Bokningsbekräftelse</h1>
        <p style="color: rgba(255,255,255,0.6); margin: 8px 0 0;">Kylutbildningen</p>
      </div>
      <div style="border: 1px solid #e2e4e8; border-top: 0; padding: 32px; border-radius: 0 0 12px 12px;">
        <p>Hej ${data.contactName},</p>
        <p>Tack för din bokning! Här är en sammanfattning:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Bokningsnummer</td><td style="padding: 8px 0; font-weight: 600;">${data.bookingNumber}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Kurs</td><td style="padding: 8px 0;">${data.courseName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Datum</td><td style="padding: 8px 0;">${data.eventDate}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Ort</td><td style="padding: 8px 0;">${data.eventCity}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Företag</td><td style="padding: 8px 0;">${data.companyName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Antal deltagare</td><td style="padding: 8px 0;">${data.participants.length}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Pris exkl. moms</td><td style="padding: 8px 0; font-weight: 600;">${data.totalPriceExVat.toLocaleString("sv-SE")} kr</td></tr>
        </table>

        <h3 style="font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Deltagare</h3>
        <pre style="font-family: system-ui, sans-serif; font-size: 14px; line-height: 1.8; margin: 8px 0 24px;">${participantList}</pre>

        <p style="font-size: 14px; color: #64748b;">${paymentText}</p>

        <div style="margin-top: 32px; text-align: center;">
          <a href="${SITE_URL}/dashboard" style="display: inline-block; background: #0891b2; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Mina bokningar</a>
        </div>

        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
          Detta mejl skickades från Kylutbildningen i Göteborg AB.
          Vid frågor, kontakta oss på info@kylutbildningen.se.
        </p>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: `Bokningsbekräftelse: ${data.courseName} — ${data.bookingNumber}`,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend email failed:", res.status, text);
  }
}
