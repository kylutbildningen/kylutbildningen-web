'use client'

import { useCallback, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js'
import type { BookingStep1Data } from '@/lib/validation'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Props {
  eventId: number
  formData: BookingStep1Data
  onClose: () => void
}

export function StripeModal({ eventId, formData, onClose }: Props) {
  const [loading, setLoading] = useState(true)

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, formData }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    setLoading(false)
    return data.clientSecret
  }, [eventId, formData])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{
          maxWidth: '560px',
          maxHeight: '90vh',
          background: 'white',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center
            justify-center rounded-full transition-colors hover:bg-gray-100"
          style={{ color: '#666' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-4"
          style={{ borderBottom: '1px solid #EEF1F5' }}>
          <h2 className="font-condensed font-bold uppercase text-xl"
            style={{ color: 'var(--navy)' }}>
            Slutför betalning
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Säker betalning via Stripe — dina kortuppgifter lagras aldrig hos oss
          </p>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2"
                style={{
                  borderColor: 'var(--navy)',
                  borderTopColor: 'transparent',
                }} />
            </div>
          )}
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}
