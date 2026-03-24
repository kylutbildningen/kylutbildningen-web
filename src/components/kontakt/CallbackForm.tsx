'use client'
import { useState } from 'react'

const TIME_SLOTS = [
  'Förmiddag (08:00–12:00)',
  'Eftermiddag (12:00–16:00)',
  'Så snart som möjligt',
]

export function CallbackForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', phone: '', preferredTime: TIME_SLOTS[0], message: ''
  })

  const submit = async () => {
    setLoading(true)
    await fetch('/api/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-lg p-6 text-sm"
        style={{ background: '#F0F5FF', border: '1px solid var(--blue)', color: '#0C447C' }}>
        <p className="font-semibold mb-1">Tack {form.name}!</p>
        <p>Vi ringer upp dig på {form.phone} under {form.preferredTime.toLowerCase()}.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ background: 'var(--navy)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#00C4FF" strokeWidth="2" strokeLinecap="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07
            A19.5 19.5 0 013.07 11.5 19.79 19.79 0 01.22 2.84 2 2 0 012.18 1h3a2 2 0
            012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.09a16 16 0
            006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 15z"/>
        </svg>
        <span className="text-sm font-semibold text-white">Ring mig upp</span>
      </div>

      {/* Formulär */}
      <div className="p-5 bg-white space-y-4">
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Namn</label>
          <input type="text" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ditt namn" className="form-input" />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Telefonnummer</label>
          <input type="tel" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            placeholder="07X-XXX XX XX" className="form-input" />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Bästa tid att ringa</label>
          <select value={form.preferredTime}
            onChange={e => setForm({ ...form, preferredTime: e.target.value })}
            className="form-input">
            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Kort meddelande (valfritt)</label>
          <textarea value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="T.ex. vilken kurs det gäller..."
            rows={2} className="form-input resize-none" />
        </div>
        <button
          onClick={submit}
          disabled={loading || !form.name || !form.phone}
          className="w-full py-3 text-sm font-semibold tracking-wider uppercase
            text-white rounded transition-colors disabled:opacity-40"
          style={{ background: 'var(--navy)' }}>
          {loading ? 'Skickar...' : 'Be om återuppringning'}
        </button>
      </div>
    </div>
  )
}
