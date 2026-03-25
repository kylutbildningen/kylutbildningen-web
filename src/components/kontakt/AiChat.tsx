'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  'Vad behöver jag för att montera värmepumpar?',
  'Skillnad på nyexaminering och omexaminering?',
  'Kan vi boka för flera anställda?',
  'Vad kostar kursen?',
]

interface Props { compact?: boolean }

export function AiChat({ compact = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showEscalation, setShowEscalation] = useState(false)
  const [escalationStep, setEscalationStep] = useState<'collect' | 'confirm' | 'sent'>('collect')
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' })
  const [chatSummary, setChatSummary] = useState('')

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, showEscalation, escalationStep])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setStarted(true)
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages([...newMessages, { role: 'assistant', content: '' }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            const { text: t } = JSON.parse(line.slice(6))
            setMessages(prev => {
              const u = [...prev]
              u[u.length - 1] = { role: 'assistant', content: u[u.length - 1].content + t }
              return u
            })
          }
        }
      }

      // Check for escalation tag
      setMessages(prev => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        if (lastMsg.content.includes('[ESKALERA]')) {
          updated[updated.length - 1] = {
            ...lastMsg,
            content: lastMsg.content.replace('[ESKALERA]', '').trim()
          }
          setTimeout(() => setShowEscalation(true), 800)
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEscalationPreview = async () => {
    const res = await fetch('/api/chat/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    const data = await res.json()
    setChatSummary(data.summary)
    setEscalationStep('confirm')
  }

  const handleEscalationSend = async () => {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        subject: 'Chatteskalering — kund behöver hjälp',
        message: chatSummary,
      }),
    })
    setEscalationStep('sent')
  }

  return (
    <div className={compact ? '' : 'rounded-lg overflow-hidden'} style={compact ? undefined : { border: '1px solid var(--border)' }}>
      {/* Header — döljs i compact-läge (ChatWidget visar sin egen) */}
      {!compact && (
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="w-2 h-2 rounded-full bg-[#00C4FF] animate-pulse" />
          <span className="text-sm font-semibold text-white">Kursassistent</span>
          <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Svarar direkt
          </span>
        </div>
      )}

      {/* Meddelandevy */}
      <div ref={scrollRef} className="bg-white overflow-y-auto" style={{ minHeight: compact ? '200px' : '320px', maxHeight: compact ? '320px' : '420px' }}>
        {!started ? (
          <div className="p-6">
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              Hej! Ställ en fråga om våra kurser eller välj ett av alternativen nedan.
            </p>
            <div className="space-y-2">
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => send(q)}
                  className="w-full text-left px-4 py-3 rounded-md text-sm
                    transition-colors hover:bg-gray-50"
                  style={{ border: '1px solid var(--border)', color: 'var(--navy)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-4 py-3 rounded-lg text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'var(--navy)' : 'var(--gray-bg)',
                    color: msg.role === 'user' ? 'white' : 'var(--text)',
                  }}>
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target={href?.startsWith('/') ? undefined : '_blank'}
                              rel={href?.startsWith('/') ? undefined : 'noopener noreferrer'}
                              className="underline font-medium"
                              style={{ color: '#1A5EA8' }}
                            >
                              {children}
                            </a>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold">{children}</strong>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="opacity-40">Skriver...</span>
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Escalation panel */}
            {showEscalation && escalationStep === 'collect' && (
              <div className="p-4 rounded-lg"
                style={{ background: '#F0F5FF', border: '1px solid #1A5EA8' }}>
                <p className="text-sm font-semibold mb-1"
                  style={{ color: '#0C447C' }}>
                  Vill du att vi kontaktar dig?
                </p>
                <p className="text-xs mb-4" style={{ color: '#1A5EA8' }}>
                  Fyll i dina uppgifter så sammanställer vi chatten och skickar till vårt team.
                </p>
                <div className="space-y-2">
                  {([
                    { key: 'name', placeholder: 'Ditt namn', type: 'text' },
                    { key: 'email', placeholder: 'E-postadress', type: 'email' },
                    { key: 'phone', placeholder: 'Telefonnummer', type: 'tel' },
                  ] as const).map(field => (
                    <input
                      key={field.key}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={contactInfo[field.key]}
                      onChange={e => setContactInfo(prev => ({
                        ...prev, [field.key]: e.target.value
                      }))}
                      className="w-full text-sm px-3 py-2 rounded border"
                      style={{ borderColor: '#B5D4F4', background: 'white' }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleEscalationPreview}
                  disabled={!contactInfo.name || !contactInfo.email}
                  className="w-full mt-3 py-2 text-xs font-semibold tracking-wider
                    uppercase text-white rounded disabled:opacity-40"
                  style={{ background: '#1A5EA8' }}>
                  Granska och skicka
                </button>
              </div>
            )}

            {showEscalation && escalationStep === 'confirm' && (
              <div className="p-4 rounded-lg"
                style={{ background: '#F0F5FF', border: '1px solid #1A5EA8' }}>
                <p className="text-sm font-semibold mb-3"
                  style={{ color: '#0C447C' }}>
                  Stämmer detta?
                </p>
                <div className="text-xs mb-3 space-y-1" style={{ color: '#1A5EA8' }}>
                  <p><strong>Namn:</strong> {contactInfo.name}</p>
                  <p><strong>E-post:</strong> {contactInfo.email}</p>
                  {contactInfo.phone && (
                    <p><strong>Telefon:</strong> {contactInfo.phone}</p>
                  )}
                </div>
                <div className="text-xs p-3 rounded mb-3"
                  style={{ background: 'white', border: '1px solid #B5D4F4',
                    color: '#0C447C', lineHeight: '1.6' }}>
                  <p className="font-semibold mb-1">Sammanfattning av chatten:</p>
                  <p>{chatSummary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEscalationStep('collect')}
                    className="flex-1 py-2 text-xs font-semibold tracking-wider
                      uppercase rounded"
                    style={{ border: '1px solid #1A5EA8', color: '#1A5EA8' }}>
                    Ändra
                  </button>
                  <button
                    onClick={handleEscalationSend}
                    className="flex-1 py-2 text-xs font-semibold tracking-wider
                      uppercase text-white rounded"
                    style={{ background: '#1A5EA8' }}>
                    Skicka
                  </button>
                </div>
              </div>
            )}

            {showEscalation && escalationStep === 'sent' && (
              <div className="p-4 rounded-lg text-center"
                style={{ background: '#F0F5FF', border: '1px solid #1A5EA8' }}>
                <svg className="mx-auto mb-2" width="24" height="24"
                  viewBox="0 0 24 24" fill="none" stroke="#1A5EA8"
                  strokeWidth="2" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>
                  Skickat!
                </p>
                <p className="text-xs mt-1" style={{ color: '#1A5EA8' }}>
                  Vi återkommer till {contactInfo.email} inom en arbetsdag.
                </p>
              </div>
            )}

            <div />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-4"
        style={{ borderTop: '1px solid var(--border)', background: '#FAFBFC' }}>
        <input type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Skriv din fråga..."
          className="form-input flex-1 text-sm"
          disabled={loading} />
        <button onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="px-4 py-2 text-xs font-semibold tracking-wider uppercase
            rounded text-white transition-colors disabled:opacity-40"
          style={{ background: 'var(--navy)' }}>
          Skicka
        </button>
      </div>
    </div>
  )
}
