'use client'

import { useEffect, useState, use } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'

export default function BetalaSida({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [snippet, setSnippet] = useState<string>('')
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

    fetch('/api/svea/create-order', {
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
        setSnippet(data.snippet)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [eventId])

  // Render Svea snippet with script execution
  useEffect(() => {
    if (!snippet) return
    const container = document.getElementById('svea-checkout')
    if (!container) return

    container.innerHTML = snippet

    container.querySelectorAll('script').forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr =>
        newScript.setAttribute(attr.name, attr.value),
      )
      newScript.textContent = oldScript.textContent
      oldScript.replaceWith(newScript)
    })
  }, [snippet])

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

      <div className="max-w-3xl mx-auto px-6 py-12">
        {loading && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--muted)' }}>
            Laddar betalning...
          </div>
        )}

        {error && (
          <div className="p-6 rounded-lg text-sm"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <div id="svea-checkout" />
      </div>

      <SiteFooter />
    </div>
  )
}
