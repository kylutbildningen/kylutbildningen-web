'use client'

import { useEffect, useState, use } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export default function BetalaSida({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const bookingData = sessionStorage.getItem(`booking_${eventId}`)
    if (!bookingData) {
      setError('Ingen bokningsdata hittad. Gå tillbaka och försök igen.')
      setLoading(false)
      return
    }

    const formData = JSON.parse(bookingData)

    fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: parseInt(eventId),
        formData,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        if (data.url) {
          window.location.href = data.url
        } else {
          setError('Kunde inte starta betalning. Försök igen.')
          setLoading(false)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [eventId])

  return (
    <div className="min-h-screen" style={{ background: '#FAFBFC' }}>
      <SiteHeader />

      <div style={{ background: 'var(--navy)' }}>
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-12">
          <h1 className="font-condensed font-bold uppercase text-white"
            style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}>
            Betalning
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        {loading && (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-4"
              style={{ borderColor: 'var(--navy)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Förbereder betalning via Stripe...
            </p>
          </>
        )}

        {error && (
          <div className="p-6 rounded-lg text-sm"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
            {error}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  )
}
