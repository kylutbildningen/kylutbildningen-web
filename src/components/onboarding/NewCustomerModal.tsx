'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CustomerType = 'company' | 'private' | null

interface Props {
  email: string
  onClose: () => void
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2" style={{ borderBottom: '1px solid #EEF1F5' }}>
      <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--navy)' }}>{value}</span>
    </div>
  )
}

const STEPS = ['Typ', 'Uppgifter', 'Bekräfta']

export function NewCustomerModal({ email, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [customerType, setCustomerType] = useState<CustomerType>(null)
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

  const isCompany = customerType === 'company'

  const canProceedStep1 = !!form.firstName && !!form.lastName && !!form.phone
    && (!isCompany || (!!form.companyName && !!form.orgNumber && !!form.address && !!form.city && !!form.invoiceEmail))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    if (isCompany) {
      const orgNr = form.orgNumber.replace(/[-\s]/g, '')
      if (!/^\d{10}$/.test(orgNr)) {
        setError('Ange ett giltigt organisationsnummer (10 siffror)')
        setLoading(false)
        return
      }
    }

    try {
      const payload = isCompany
        ? { ...form, orgNumber: form.orgNumber.replace(/[-\s]/g, ''), email, customerType: 'company' }
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            companyName: `${form.firstName} ${form.lastName}`,
            orgNumber: '',
            address: form.address,
            zipCode: form.zipCode,
            city: form.city,
            invoiceEmail: email,
            reference: '',
            email,
            customerType: 'private',
          }

      const res = await fetch('/api/onboarding/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Något gick fel')

      setStep(3) // success
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,31,58,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">

        {/* Close button */}
        {step < 3 && (
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: 'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}

        {/* Progress */}
        {step < 3 && (
          <div className="px-8 pt-8 pb-2">
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
                    style={{
                      background: i <= step ? 'var(--navy)' : '#EEF1F5',
                      color: i <= step ? 'white' : 'var(--muted)',
                    }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className="text-[11px] font-medium tracking-wider uppercase hidden sm:block"
                    style={{ color: i <= step ? 'var(--navy)' : 'var(--muted)' }}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px" style={{ background: i < step ? 'var(--navy)' : '#EEF1F5' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-8 pb-8">

          {/* ── Step 0: Privatperson / Företag ── */}
          {step === 0 && (
            <div>
              <h2 className="font-condensed font-bold uppercase text-xl mb-2"
                style={{ color: 'var(--navy)' }}>
                Välj kontotyp
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Är du privatperson eller representerar du ett företag?
              </p>

              <div className="grid grid-cols-2 gap-4">
                {([
                  { type: 'private' as const, label: 'Privatperson', desc: 'Jag bokar som privatperson',
                    icon: <><circle cx="12" cy="8" r="4" /><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /></> },
                  { type: 'company' as const, label: 'Företag', desc: 'Jag representerar ett företag',
                    icon: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M3 7l9-4 9 4" /></> },
                ]).map(opt => {
                  const active = customerType === opt.type
                  return (
                    <button key={opt.type}
                      onClick={() => setCustomerType(opt.type)}
                      className="rounded-lg p-5 text-left transition-all"
                      style={{
                        border: active ? '2px solid var(--navy)' : '1px solid #DDE4ED',
                        background: active ? '#F0F5FF' : 'white',
                      }}>
                      <div className="w-10 h-10 mb-3 flex items-center justify-center rounded-lg"
                        style={{ background: active ? 'var(--navy)' : '#F0F3F7' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke={active ? '#00C4FF' : '#8BA3BE'} strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round">
                          {opt.icon}
                        </svg>
                      </div>
                      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--navy)' }}>
                        {opt.label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {opt.desc}
                      </p>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!customerType}
                className="w-full mt-6 py-3 text-sm font-semibold tracking-wider uppercase text-white rounded transition-colors disabled:opacity-40"
                style={{ background: 'var(--navy)' }}>
                Fortsätt
              </button>
            </div>
          )}

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div>
              <button onClick={() => setStep(0)}
                className="flex items-center gap-1 text-xs mb-4 transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}>
                ← Tillbaka
              </button>

              <h2 className="font-condensed font-bold uppercase text-xl mb-6"
                style={{ color: 'var(--navy)' }}>
                {isCompany ? 'Företags- och kontaktuppgifter' : 'Dina uppgifter'}
              </h2>

              <div className="space-y-6">
                {/* Person info */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Förnamn" value={form.firstName}
                      onChange={v => set('firstName', v)} />
                    <Field label="Efternamn" value={form.lastName}
                      onChange={v => set('lastName', v)} />
                  </div>
                  <Field label="Telefon" value={form.phone}
                    onChange={v => set('phone', v)} placeholder="07X-XXX XX XX" />
                  <Field label="E-post" value={email}
                    onChange={() => {}} required={false} disabled />
                </div>

                {/* Company info (only for företag) */}
                {isCompany && (
                  <>
                    <div className="h-px" style={{ background: '#EEF1F5' }} />
                    <div className="space-y-4">
                      <Field label="Företagsnamn" value={form.companyName}
                        onChange={v => set('companyName', v)} />
                      <Field label="Organisationsnummer" value={form.orgNumber}
                        onChange={v => set('orgNumber', v)} placeholder="XXXXXXXXXX" />
                      <Field label="Adress" value={form.address}
                        onChange={v => set('address', v)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Postnummer" value={form.zipCode}
                          onChange={v => set('zipCode', v)} placeholder="XXX XX" />
                        <Field label="Ort" value={form.city}
                          onChange={v => set('city', v)} />
                      </div>
                    </div>
                    <div className="h-px" style={{ background: '#EEF1F5' }} />
                    <div className="space-y-4">
                      <Field label="Fakturamail" value={form.invoiceEmail}
                        onChange={v => set('invoiceEmail', v)} type="email"
                        placeholder="ekonomi@foretag.se" />
                      <Field label="Referens / märkning" value={form.reference}
                        onChange={v => set('reference', v)} required={false}
                        placeholder="T.ex. kostnadsställe eller beställarnamn" />
                    </div>
                  </>
                )}

                {/* Private address (optional) */}
                {!isCompany && (
                  <>
                    <div className="h-px" style={{ background: '#EEF1F5' }} />
                    <div className="space-y-4">
                      <Field label="Adress" value={form.address}
                        onChange={v => set('address', v)} required={false} />
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Postnummer" value={form.zipCode}
                          onChange={v => set('zipCode', v)} placeholder="XXX XX" required={false} />
                        <Field label="Ort" value={form.city}
                          onChange={v => set('city', v)} required={false} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full mt-6 py-3 text-sm font-semibold tracking-wider uppercase text-white rounded transition-colors disabled:opacity-40"
                style={{ background: 'var(--navy)' }}>
                Granska
              </button>
            </div>
          )}

          {/* ── Step 2: Confirm ── */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 text-xs mb-4 transition-colors hover:opacity-70"
                style={{ color: 'var(--muted)' }}>
                ← Ändra uppgifter
              </button>

              <h2 className="font-condensed font-bold uppercase text-xl mb-2"
                style={{ color: 'var(--navy)' }}>
                Bekräfta
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
                Kontrollera att allt stämmer innan vi skapar ditt konto.
              </p>

              <div className="rounded-lg p-5 mb-4" style={{ background: '#F8F9FB', border: '1px solid #EEF1F5' }}>
                <p className="text-[11px] font-bold tracking-widest uppercase mb-3"
                  style={{ color: '#1A5EA8' }}>
                  {isCompany ? 'Kontaktperson' : 'Personuppgifter'}
                </p>
                <SummaryRow label="Namn" value={`${form.firstName} ${form.lastName}`} />
                <SummaryRow label="Telefon" value={form.phone} />
                <SummaryRow label="E-post" value={email} />
                {form.address && <SummaryRow label="Adress" value={`${form.address}${form.zipCode ? `, ${form.zipCode}` : ''} ${form.city}`} />}
              </div>

              {isCompany && (
                <div className="rounded-lg p-5 mb-4" style={{ background: '#F8F9FB', border: '1px solid #EEF1F5' }}>
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-3"
                    style={{ color: '#1A5EA8' }}>
                    Företag
                  </p>
                  <SummaryRow label="Företag" value={form.companyName} />
                  <SummaryRow label="Org.nr" value={form.orgNumber} />
                  <SummaryRow label="Adress" value={`${form.address}${form.zipCode ? `, ${form.zipCode}` : ''} ${form.city}`} />
                  <SummaryRow label="Fakturamail" value={form.invoiceEmail} />
                  {form.reference && <SummaryRow label="Referens" value={form.reference} />}
                </div>
              )}

              {error && (
                <div className="p-4 rounded text-sm mb-4"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 text-sm font-semibold tracking-wider uppercase text-white rounded transition-colors disabled:opacity-50"
                style={{ background: 'var(--navy)' }}>
                {loading ? 'Skapar konto...' : 'Skapa konto'}
              </button>

              <p className="text-xs text-center mt-4" style={{ color: 'var(--muted)' }}>
                Genom att skapa ett konto godkänner du våra{' '}
                <a href="/villkor" target="_blank" className="underline" style={{ color: '#1A5EA8' }}>
                  villkor
                </a>
              </p>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
                style={{ background: '#E8F5E9' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="font-condensed font-bold uppercase text-xl mb-2"
                style={{ color: 'var(--navy)' }}>
                Konto skapat!
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Du skickas vidare till din dashboard...
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
