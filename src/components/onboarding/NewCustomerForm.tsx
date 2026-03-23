'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  email: string
}

function Field({
  label, value, onChange, type = 'text', placeholder = '', required = true, disabled = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold tracking-widest uppercase block mb-1.5"
        style={{ color: '#1A5EA8' }}>
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full text-sm rounded border px-3 py-2 disabled:opacity-50 disabled:bg-gray-50"
        style={{ borderColor: '#DDE4ED' }}
      />
    </div>
  )
}

export function NewCustomerForm({ email }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    orgNumber: '',
    address: '',
    zipCode: '',
    city: '',
    invoiceEmail: '',
    reference: '',
  })

  const set = (key: string, val: string) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const orgNr = form.orgNumber.replace(/[-\s]/g, '')
    if (!/^\d{10}$/.test(orgNr)) {
      setError('Ange ett giltigt organisationsnummer (10 siffror)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/onboarding/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, orgNumber: orgNr, email }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Något gick fel')

      router.push('/onboarding/profile')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-condensed font-bold uppercase text-lg mb-4"
          style={{ color: 'var(--navy)' }}>
          Dina uppgifter
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Förnamn" value={form.firstName}
            onChange={(v: string) => set('firstName', v)} />
          <Field label="Efternamn" value={form.lastName}
            onChange={(v: string) => set('lastName', v)} />
        </div>
        <div className="mt-4">
          <Field label="Telefon" value={form.phone}
            onChange={(v: string) => set('phone', v)}
            placeholder="07X-XXX XX XX" />
        </div>
        <div className="mt-4">
          <Field label="E-post" value={email}
            onChange={() => {}} required={false} disabled />
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Din inloggnings-e-post (kan inte ändras här)
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-condensed font-bold uppercase text-lg mb-4"
          style={{ color: 'var(--navy)' }}>
          Företagsuppgifter
        </h3>
        <div className="space-y-4">
          <Field label="Företagsnamn" value={form.companyName}
            onChange={(v: string) => set('companyName', v)} />
          <Field label="Organisationsnummer" value={form.orgNumber}
            onChange={(v: string) => set('orgNumber', v)}
            placeholder="XXXXXXXXXX" />
          <Field label="Adress" value={form.address}
            onChange={(v: string) => set('address', v)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Postnummer" value={form.zipCode}
              onChange={(v: string) => set('zipCode', v)}
              placeholder="XXX XX" />
            <Field label="Ort" value={form.city}
              onChange={(v: string) => set('city', v)} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-condensed font-bold uppercase text-lg mb-4"
          style={{ color: 'var(--navy)' }}>
          Fakturering
        </h3>
        <div className="space-y-4">
          <Field label="Fakturamail" value={form.invoiceEmail}
            onChange={(v: string) => set('invoiceEmail', v)}
            type="email"
            placeholder="ekonomi@foretag.se" />
          <Field label="Referens / märkning" value={form.reference}
            onChange={(v: string) => set('reference', v)}
            required={false}
            placeholder="T.ex. kostnadsställe eller beställarnamn" />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded text-sm"
          style={{ background: '#FEF2F2', color: '#DC2626',
            border: '1px solid #FCA5A5' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !form.firstName || !form.lastName ||
          !form.phone || !form.companyName || !form.orgNumber ||
          !form.address || !form.city || !form.invoiceEmail}
        className="w-full py-3 text-sm font-semibold tracking-wider
          uppercase text-white rounded transition-colors disabled:opacity-40"
        style={{ background: 'var(--navy)' }}>
        {loading ? 'Skapar konto...' : 'Skapa konto'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
        Genom att skapa ett konto godkänner du våra{' '}
        <a href="/villkor" className="underline" style={{ color: '#1A5EA8' }}>
          villkor
        </a>
      </p>
    </div>
  )
}
