export const ADS_ID = 'AW-803000076'

export const CONVERSIONS = {
  booking:  'AW-803000076/CONV_ID_1', // Kursbokning — hämta ID från Google Ads
  contact:  'AW-803000076/CONV_ID_2', // Kontaktformulär
  callback: 'AW-803000076/CONV_ID_3', // Återuppringning
  chat:     'AW-803000076/CONV_ID_4', // Chattstarter
  reminder: 'AW-803000076/CONV_ID_5', // Påminnelsemail
}

// OBS: Byt ut CONV_ID_X mot de riktiga ID:n från Google Ads
// efter att konverteringarna skapats i Google Ads-dashboarden.

export function trackConversion(
  type: keyof typeof CONVERSIONS,
  value?: number,
  transactionId?: string
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'conversion', {
    send_to: CONVERSIONS[type],
    value,
    currency: 'SEK',
    transaction_id: transactionId,
  })
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}
