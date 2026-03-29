export const ADS_ID = 'AW-803000076'

export const CONVERSIONS = {
  booking:  'AW-803000076/mXTWCJG3-ZEcElye8_4C',  // Kursbokning genomförd
  contact:  'AW-803000076/ELJECObIgpIcEIye8_4C',  // Kontaktformulär skickat
  callback: 'AW-803000076/-YwsConIgpIcEIye8_4C',  // Återuppringning begärd
  chat:     'AW-803000076/A2TaCL7KgpIcEIye8_4C',  // Chattstarter
  reminder: 'AW-803000076/Xjk-CMHKgpIcEIye8_4C',  // Påminnelsemail skickat
}

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
