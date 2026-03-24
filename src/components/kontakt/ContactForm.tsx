'use client'
import { useState } from 'react'

const SUBJECTS = [
  'Kursförfrågan',
  'Företagsbokning',
  'Faktura/ekonomi',
  'Övrigt',
]

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', subject: SUBJECTS[0], message: ''
  })

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-lg p-6 text-sm"
        style={{ background: '#ecfdf5', border: '1px solid var(--success)', color: '#065f46' }}>
        <p className="font-semibold mb-1">Tack för ditt meddelande!</p>
        <p>Vi har skickat en bekräftelse till {form.email} och återkommer inom en arbetsdag.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Namn *</label>
          <input type="text" required value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="Ditt namn" className="form-input" />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>E-post *</label>
          <input type="email" required value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="din@epost.se" className="form-input" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Telefon</label>
          <input type="tel" value={form.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="07X-XXX XX XX" className="form-input" />
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
            style={{ color: 'var(--blue)' }}>Företag</label>
          <input type="text" value={form.company}
            onChange={e => update('company', e.target.value)}
            placeholder="Företagsnamn" className="form-input" />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
          style={{ color: 'var(--blue)' }}>Ärende</label>
        <select value={form.subject}
          onChange={e => update('subject', e.target.value)}
          className="form-input">
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
          style={{ color: 'var(--blue)' }}>Meddelande *</label>
        <textarea required value={form.message}
          onChange={e => update('message', e.target.value)}
          placeholder="Beskriv ditt ärende..."
          rows={5} className="form-input resize-none" />
      </div>

      <button type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-semibold tracking-wider uppercase
          text-white rounded transition-colors disabled:opacity-40"
        style={{ background: 'var(--navy)' }}>
        {loading ? 'Skickar...' : 'Skicka meddelande'}
      </button>
    </form>
  )
}
