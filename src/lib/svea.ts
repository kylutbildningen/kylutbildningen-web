/**
 * Svea Checkout REST API integration.
 * Auth: HMAC SHA512 signature over request body + shared secret.
 */

import crypto from 'crypto'

const BASE_URL = process.env.SVEA_ENV === 'prod'
  ? 'https://checkoutapi.svea.com'
  : 'https://checkoutapistage.svea.com'

const MERCHANT_ID = process.env.SVEA_MERCHANT_ID!
const SECRET = process.env.SVEA_CHECKOUT_SECRET!

function generateAuth(body: string, timestamp: string): string {
  // 1. SHA-512 of body + secret + timestamp → uppercase hex
  const hashHex = crypto
    .createHash('sha512')
    .update(body + SECRET + timestamp, 'utf-8')
    .digest('hex')
    .toUpperCase()
  // 2. Base64-encode "merchantId:hashHex"
  const token = Buffer.from(`${MERCHANT_ID}:${hashHex}`, 'utf-8').toString('base64')
  return `Svea ${token}`
}

function formatTimestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export async function createSveaOrder(orderData: SveaOrderData): Promise<SveaOrderResponse> {
  const body = JSON.stringify(orderData)
  const timestamp = formatTimestamp()

  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': generateAuth(body, timestamp),
      'Timestamp': timestamp,
    },
    body,
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Svea API error ${res.status}: ${error}`)
  }

  return res.json()
}

export async function getSveaOrder(orderId: number): Promise<SveaOrderResponse> {
  const body = ''
  const timestamp = formatTimestamp()
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    headers: {
      'Authorization': generateAuth(body, timestamp),
      'Timestamp': timestamp,
    },
  })

  if (!res.ok) throw new Error(`Svea GET order error ${res.status}`)
  return res.json()
}

export interface SveaOrderData {
  CountryCode: string
  Currency: string
  Locale: string
  ClientOrderNumber: string
  MerchantSettings: {
    PushUri: string
    TermsUri: string
    CheckoutUri: string
    ConfirmationUri: string
  }
  Cart: {
    Items: SveaOrderItem[]
  }
  PresetValues?: {
    Key: string
    Value: string
    IsReadonly?: boolean
  }[]
}

export interface SveaOrderItem {
  ArticleNumber: string
  Name: string
  Quantity: number
  UnitPrice: number
  DiscountPercent: number
  VatPercent: number
  Unit: string
}

export interface SveaOrderResponse {
  OrderId: number
  Status: string
  Gui: {
    Layout: string
    Snippet: string
  }
  ClientOrderNumber: string
}
