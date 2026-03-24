'use client'
import { useState, useRef, useEffect } from 'react'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTED = [
  'Vad behöver jag för att montera värmepumpar?',
  'Skillnad på nyexaminering och omexaminering?',
  'Kan vi boka för flera anställda?',
  'Vad kostar kursen?',
]

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="w-2 h-2 rounded-full bg-[#00C4FF] animate-pulse" />
        <span className="text-sm font-semibold text-white">Kursassistent</span>
        <span className="text-xs ml-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Svarar direkt
        </span>
      </div>

      {/* Meddelandevy */}
      <div className="bg-white overflow-y-auto" style={{ minHeight: '320px', maxHeight: '420px' }}>
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
                  {msg.content || <span className="opacity-40">Skriver...</span>}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
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
