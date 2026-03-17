/**
 * Svea WebPay checkout integration.
 */

const SVEA_MERCHANT_ID = process.env.SVEA_MERCHANT_ID ?? "";
const SVEA_SECRET_KEY = process.env.SVEA_SECRET_KEY ?? "";
const SVEA_CHECKOUT_URL =
  process.env.SVEA_CHECKOUT_URL ?? "https://checkoutapistage.svea.com";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://kylutbildningen.com";

interface SveaCheckoutResponse {
  OrderId: number;
  CheckoutUrl: string;
}

/**
 * Initialize a Svea checkout session and return the redirect URL.
 */
export async function initSveaCheckout(params: {
  bookingId: number;
  bookingNumber: string;
  totalAmountIncVat: number;
  customerEmail: string;
  description: string;
}): Promise<string> {
  if (!SVEA_MERCHANT_ID || !SVEA_SECRET_KEY) {
    console.warn("Svea credentials not configured, returning mock URL");
    return `${SITE_URL}/boka/bekraftelse?booking=${params.bookingNumber}`;
  }

  const amountInMinorUnit = Math.round(params.totalAmountIncVat * 100);

  const res = await fetch(`${SVEA_CHECKOUT_URL}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SVEA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      MerchantId: SVEA_MERCHANT_ID,
      Currency: "SEK",
      CountryCode: "SE",
      Locale: "sv-SE",
      Cart: {
        Items: [
          {
            ArticleNumber: `BOOKING-${params.bookingNumber}`,
            Name: params.description,
            Quantity: 100,
            UnitPrice: amountInMinorUnit,
            VatPercent: 2500,
          },
        ],
      },
      MerchantSettings: {
        CheckoutUri: `${SITE_URL}/boka/${params.bookingId}`,
        ConfirmationUri: `${SITE_URL}/boka/bekraftelse?booking=${params.bookingNumber}&svea={checkout.order.uri}`,
        PushUri: `${SITE_URL}/api/booking/svea-callback?booking=${params.bookingNumber}`,
        TermsUri: `${SITE_URL}/villkor`,
      },
      ClientOrderNumber: params.bookingNumber,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Svea checkout failed: ${res.status} ${text}`);
  }

  const data: SveaCheckoutResponse = await res.json();
  return data.CheckoutUrl;
}
