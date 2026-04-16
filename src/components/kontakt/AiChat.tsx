'use client'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { trackConversion } from '@/lib/analytics'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED = [
  { icon: '🔧', text: 'Vad behöver jag för att montera värmepumpar?' },
  { icon: '❄️', text: 'Vad behöver jag för att jobba med luftkonditionering i bilar?' },
  { icon: '🔄', text: 'Jag behöver omexaminera mig Kategori I & II' },
  { icon: '🚗', text: 'Jag behöver omexaminera mig Kategori V' },
]

const QUICK_ACTIONS = [
  { id: 'callback', icon: '📞', label: 'Bli uppringd' },
  { id: 'contact', icon: '✉️', label: 'Skicka meddelande' },
  { id: 'info', icon: '📋', label: 'Kontaktuppgifter' },
] as const

type QuickAction = typeof QUICK_ACTIONS[number]['id']

const PREFERRED_TIMES = [
  'Förmiddag (08:00–12:00)',
  'Eftermiddag (12:00–16:00)',
  'Så snart som möjligt',
]

const SUBJECTS = [
  'Kursförfrågan',
  'Företagsbokning',
  'Faktura/ekonomi',
  'Övrigt',
]

interface UserContext {
  name?: string
  email?: string
  phone?: string
  company?: string
  orgNumber?: string
}

interface Props {
  compact?: boolean
  userContext?: UserContext | null
  onNewMessage?: () => void
}

/** Check if an assistant message mentions courses (has /kurser/ links) */
function mentionsCourses(content: string): boolean {
  return /\[.+?\]\(\/kurser\//.test(content)
}

/** Extract first course name from markdown links like [Kursnamn](/kurser/slug) */
function extractCourseName(content: string): string {
  const match = content.match(/\[([^\]]+)\]\(\/kurser\//)
  return match ? match[1] : ''
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

export function AiChat({ compact = false, userContext, onNewMessage }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const [showEscalation, setShowEscalation] = useState(false)
  const [escalationStep, setEscalationStep] = useState<'collect' | 'confirm' | 'sent'>('collect')
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' })
  const [chatSummary, setChatSummary] = useState('')

  const [showReminder, setShowReminder] = useState(false)
  const [reminderCourse, setReminderCourse] = useState('')
  const [reminderEmail, setReminderEmail] = useState('')
  const [reminderSent, setReminderSent] = useState(false)

  const [showRating, setShowRating] = useState(false)
  const [rated, setRated] = useState(false)

  // Quick action panels
  const [activePanel, setActivePanel] = useState<QuickAction | null>(null)
  const [callbackForm, setCallbackForm] = useState({ name: '', phone: '', preferredTime: PREFERRED_TIMES[2], message: '' })
  const [callbackSent, setCallbackSent] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', subject: SUBJECTS[0], message: '' })
  const [contactSent, setContactSent] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, showEscalation, escalationStep, activePanel])

  // Show rating after a conversation develops
  useEffect(() => {
    if (!loading && messages.length >= 4 && !rated && !showRating) {
      const timer = setTimeout(() => setShowRating(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [loading, messages.length, rated, showRating])

  const openPanel = (panel: QuickAction) => {
    if (panel === 'callback') {
      setCallbackForm(f => ({
        ...f,
        name: userContext?.name || f.name,
        phone: userContext?.phone || f.phone,
      }))
    } else if (panel === 'contact') {
      setContactForm(f => ({
        ...f,
        name: userContext?.name || f.name,
        email: userContext?.email || f.email,
        phone: userContext?.phone || f.phone,
        company: userContext?.company || f.company,
      }))
    }
    setActivePanel(panel)
    setStarted(true)
  }

  const handleCallbackSubmit = async () => {
    await fetch('/api/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: callbackForm.name,
        phone: callbackForm.phone,
        preferredTime: callbackForm.preferredTime,
        message: callbackForm.message || null,
      }),
    })
    setCallbackSent(true)
    trackConversion('callback', 300)
  }

  const handleContactSubmit = async () => {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        company: contactForm.company,
        subject: contactForm.subject,
        message: contactForm.message,
      }),
    })
    setContactSent(true)
    trackConversion('contact', 500)
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setStarted(true)
    setInput('')
    const now = new Date()
    const newMessages: Message[] = [...messages, { role: 'user', content: text, timestamp: now }]
    setMessages([...newMessages, { role: 'assistant', content: '', timestamp: new Date() }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), userContext }),
      })

      if (res.status === 429) {
        setMessages(prev => {
          const u = [...prev]
          u[u.length - 1] = { ...u[u.length - 1], content: 'Du har skickat för många meddelanden. Vänta en stund och försök igen.' }
          return u
        })
        setLoading(false)
        return
      }

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
              u[u.length - 1] = { ...u[u.length - 1], content: u[u.length - 1].content + t }
              return u
            })
          }
        }
      }

      onNewMessage?.()

      // Check for escalation and reminder tags
      setMessages(prev => {
        const updated = [...prev]
        const lastMsg = updated[updated.length - 1]
        let content = lastMsg.content

        if (content.includes('[ESKALERA]')) {
          content = content.replace('[ESKALERA]', '').trim()
          setTimeout(() => setShowEscalation(true), 800)
        }

        const reminderMatch = content.match(/\[ERBJUD_PÅMINNELSE: (.+?)\]/)
        if (reminderMatch) {
          content = content.replace(reminderMatch[0], '').trim()
          setReminderCourse(reminderMatch[1])
          if (userContext?.email) setReminderEmail(userContext.email)
          setTimeout(() => setShowReminder(true), 800)
        }

        updated[updated.length - 1] = { ...lastMsg, content }
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
      body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
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

  const copyMessage = (idx: number, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className={compact ? 'flex flex-col h-full' : 'rounded-lg overflow-hidden'} style={compact ? undefined : { border: '1px solid var(--border)' }}>
      {/* Header — döljs i compact-läge (ChatWidget visar sin egen) */}
      {!compact && (
        <div className="flex items-center gap-3 px-5 py-4"
          style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #112847 100%)', borderBottom: '1px solid rgba(0,196,255,0.1)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,196,255,0.15)' }}>
            <span className="text-xs">🤖</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Kursassistent</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Svarar direkt
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef}
        className={`bg-white overflow-y-auto chat-scroll ${compact ? 'flex-1' : ''}`}
        style={{
          ...(compact
            ? { minHeight: 0, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }
            : { minHeight: '320px', maxHeight: '420px' }),
        }}>
        {!started ? (
          <div className="p-5">
            <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
              {userContext?.name
                ? `Hej ${userContext.name.split(' ')[0]}! Ställ en fråga om våra kurser eller välj ett av alternativen nedan.`
                : 'Hej! Ställ en fråga om våra kurser eller välj ett av alternativen nedan.'}
            </p>
            {/* Quick action buttons */}
            <div className="flex gap-2 mb-4">
              {QUICK_ACTIONS.map((action, i) => (
                <button key={action.id} onClick={() => openPanel(action.id)}
                  className="flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-medium
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm chat-msg-enter"
                  style={{
                    background: 'linear-gradient(135deg, #E8F1FB 0%, #F0F5FF 100%)',
                    border: '1px solid rgba(26,94,168,0.12)',
                    color: '#1A5EA8',
                    animationDelay: `${i * 0.06}s`,
                  }}>
                  <span className="text-lg">{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            <p className="text-xs mb-2 font-medium" style={{ color: 'var(--steel)' }}>Vanliga frågor</p>
            <div className="space-y-2">
              {SUGGESTED.map((q, i) => (
                <button key={i} onClick={() => send(q.text)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3
                    transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--navy)',
                    animationDelay: `${(i + 3) * 0.08}s`,
                  }}>
                  <span className="text-base flex-shrink-0">{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const isLastAssistant = !isUser && msg.content && i === messages.length - 1 && !loading
              const showEmailCta = isLastAssistant && mentionsCourses(msg.content) && !showReminder && !reminderSent

              return (
                <div key={i} className={`flex gap-2 chat-msg-enter ${isUser ? 'flex-row-reverse' : ''}`}
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                    isUser ? 'bg-[#0B1F3A] text-white' : ''
                  }`} style={!isUser ? { background: 'rgba(0,196,255,0.12)' } : undefined}>
                    {isUser ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : (
                      <span className="text-xs">🤖</span>
                    )}
                  </div>

                  {/* Bubble + meta */}
                  <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`group relative px-4 py-3 text-sm leading-relaxed ${
                      isUser ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tl-md'
                    }`} style={{
                      background: isUser ? 'var(--navy)' : 'var(--gray-bg)',
                      color: isUser ? 'white' : 'var(--text)',
                    }}>
                      {!isUser ? (
                        msg.content ? (
                          <>
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => {
                                  const isLogin = href === '/logga-in' || href === '/onboarding'
                                  if (isLogin) {
                                    return (
                                      <button
                                        onClick={() => window.dispatchEvent(new Event('open-auth-modal'))}
                                        className="underline font-medium cursor-pointer"
                                        style={{ color: '#1A5EA8', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                                      >
                                        {children}
                                      </button>
                                    )
                                  }
                                  const isBooking = href?.startsWith('/boka/')
                                  if (isBooking) {
                                    return (
                                      <a
                                        href={href}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold no-underline transition-colors hover:opacity-80"
                                        style={{ background: '#1A5EA8', color: 'white' }}
                                      >
                                        Boka →
                                      </a>
                                    )
                                  }
                                  return (
                                    <a
                                      href={href}
                                      target={href?.startsWith('/') ? undefined : '_blank'}
                                      rel={href?.startsWith('/') ? undefined : 'noopener noreferrer'}
                                      className="underline font-medium"
                                      style={{ color: '#1A5EA8' }}
                                    >
                                      {children}
                                    </a>
                                  )
                                },
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

                            {/* Copy button */}
                            <button
                              onClick={() => copyMessage(i, msg.content)}
                              className="absolute -top-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity
                                bg-white border border-[#DDE4ED] rounded-md p-1 shadow-sm hover:bg-gray-50"
                              title="Kopiera"
                            >
                              {copiedIdx === i ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                                  <path d="M20 6L9 17l-5-5"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8BA3BE" strokeWidth="2" strokeLinecap="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                              )}
                            </button>
                          </>
                        ) : (
                          /* Typing dots */
                          <div className="flex items-center gap-2 py-1.5 px-1">
                            {[0, 1, 2].map(j => (
                              <span key={j}
                                className="w-2 h-2 rounded-full chat-typing-dot"
                                style={{
                                  background: '#8BA3BE',
                                  animationDelay: `${j * 0.2}s`,
                                }}
                              />
                            ))}
                          </div>
                        )
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Email CTA — offer to send course dates */}
                    {showEmailCta && (
                      <button
                        onClick={() => {
                          if (userContext?.email) setReminderEmail(userContext.email)
                          setReminderCourse(extractCourseName(msg.content))
                          setShowReminder(true)
                        }}
                        className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                          transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm chat-msg-enter"
                        style={{
                          background: 'linear-gradient(135deg, #E8F1FB 0%, #F0F5FF 100%)',
                          color: '#1A5EA8',
                          border: '1px solid rgba(26,94,168,0.15)',
                          animationDelay: '0.3s',
                        }}
                      >
                        <span>📧</span>
                        <span>Osäker på datumen? Jag kan maila dem till dig!</span>
                      </button>
                    )}

                    {/* Timestamp */}
                    <span className="text-[10px] mt-1 px-1" style={{ color: '#8BA3BE' }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}

            {/* Escalation panel */}
            {showEscalation && escalationStep === 'collect' && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
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
                      className="w-full text-sm px-3 py-2 rounded-lg border"
                      style={{ borderColor: '#B5D4F4', background: 'white' }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleEscalationPreview}
                  disabled={!contactInfo.name || !contactInfo.email}
                  className="w-full mt-3 py-2 text-xs font-semibold tracking-wider
                    uppercase text-white rounded-lg disabled:opacity-40 transition-colors"
                  style={{ background: '#1A5EA8' }}>
                  Granska och skicka
                </button>
              </div>
            )}

            {showEscalation && escalationStep === 'confirm' && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
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
                <div className="text-xs p-3 rounded-lg mb-3"
                  style={{ background: 'white', border: '1px solid #B5D4F4',
                    color: '#0C447C', lineHeight: '1.6' }}>
                  <p className="font-semibold mb-1">Sammanfattning av chatten:</p>
                  <p>{chatSummary}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEscalationStep('collect')}
                    className="flex-1 py-2 text-xs font-semibold tracking-wider
                      uppercase rounded-lg transition-colors"
                    style={{ border: '1px solid #1A5EA8', color: '#1A5EA8' }}>
                    Ändra
                  </button>
                  <button
                    onClick={handleEscalationSend}
                    className="flex-1 py-2 text-xs font-semibold tracking-wider
                      uppercase text-white rounded-lg transition-colors"
                    style={{ background: '#1A5EA8' }}>
                    Skicka
                  </button>
                </div>
              </div>
            )}

            {showEscalation && escalationStep === 'sent' && (
              <div className="p-4 rounded-xl text-center chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
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

            {/* Reminder offer */}
            {showReminder && !reminderSent && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid #B5D4F4' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#0C447C' }}>
                  Vill du ha en påminnelse?
                </p>
                <p className="text-xs mb-3" style={{ color: '#1A5EA8' }}>
                  {reminderCourse
                    ? <>Jag kan skicka dig kommande datum för <strong>{reminderCourse}</strong> via mail.</>
                    : 'Jag skickar dig kommande kursdatum så du kan planera i lugn och ro.'}
                </p>
                <input
                  type="email"
                  value={reminderEmail}
                  onChange={e => setReminderEmail(e.target.value)}
                  placeholder="Din e-postadress"
                  className="w-full text-xs px-3 py-2 rounded-lg border mb-2"
                  style={{ borderColor: '#B5D4F4' }}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReminder(false)}
                    className="flex-1 py-2 text-xs rounded-lg transition-colors"
                    style={{ border: '1px solid #B5D4F4', color: '#1A5EA8' }}>
                    Nej tack
                  </button>
                  <button
                    onClick={async () => {
                      await fetch('/api/reminder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: reminderEmail,
                          course: reminderCourse || 'alla kurser',
                        }),
                      })
                      setReminderSent(true)
                      setShowReminder(false)
                      trackConversion('reminder', 100)
                    }}
                    disabled={!reminderEmail.includes('@')}
                    className="flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40 transition-colors"
                    style={{ background: '#1A5EA8' }}>
                    Skicka datum
                  </button>
                </div>
              </div>
            )}

            {reminderSent && (
              <div className="p-3 rounded-xl text-xs text-center chat-msg-enter"
                style={{ background: '#F0F5FF', color: '#1A5EA8' }}>
                ✓ Kursdatum skickade till {reminderEmail}
              </div>
            )}

            {/* Satisfaction rating */}
            {showRating && !rated && (
              <div className="flex items-center justify-center gap-3 py-3 chat-msg-enter">
                <span className="text-xs" style={{ color: '#8BA3BE' }}>Var svaret till hjälp?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setRated(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all
                      hover:scale-110 hover:bg-green-50 border border-transparent hover:border-green-200"
                    title="Ja"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => setRated(true)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all
                      hover:scale-110 hover:bg-red-50 border border-transparent hover:border-red-200"
                    title="Nej"
                  >
                    👎
                  </button>
                </div>
              </div>
            )}

            {rated && (
              <p className="text-[11px] text-center py-2 chat-msg-enter" style={{ color: '#8BA3BE' }}>
                Tack för din feedback!
              </p>
            )}

            {/* ── Quick action panels ── */}

            {/* Callback form */}
            {activePanel === 'callback' && !callbackSent && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">📞</span>
                  <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>Bli uppringd</p>
                </div>
                <p className="text-xs mb-3" style={{ color: '#1A5EA8' }}>
                  Fyll i dina uppgifter så ringer vi upp dig.
                </p>
                <div className="space-y-2">
                  <input type="text" placeholder="Ditt namn" value={callbackForm.name}
                    onChange={e => setCallbackForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                  <input type="tel" placeholder="Telefonnummer" value={callbackForm.phone}
                    onChange={e => setCallbackForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                  <select value={callbackForm.preferredTime}
                    onChange={e => setCallbackForm(f => ({ ...f, preferredTime: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }}>
                    {PREFERRED_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <textarea placeholder="Beskriv kort ditt ärende (valfritt)" value={callbackForm.message}
                    onChange={e => setCallbackForm(f => ({ ...f, message: e.target.value }))}
                    rows={2} className="w-full text-sm px-3 py-2 rounded-lg border resize-none"
                    style={{ borderColor: '#B5D4F4', background: 'white' }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setActivePanel(null)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{ border: '1px solid #1A5EA8', color: '#1A5EA8' }}>
                    Avbryt
                  </button>
                  <button onClick={handleCallbackSubmit}
                    disabled={!callbackForm.name || !callbackForm.phone}
                    className="flex-1 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                    style={{ background: '#1A5EA8' }}>
                    Ring mig
                  </button>
                </div>
              </div>
            )}

            {activePanel === 'callback' && callbackSent && (
              <div className="p-4 rounded-xl text-center chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
                <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>Vi ringer dig!</p>
                <p className="text-xs mt-1" style={{ color: '#1A5EA8' }}>
                  {callbackForm.preferredTime === 'Så snart som möjligt'
                    ? `Vi ringer ${callbackForm.phone} så snart vi kan.`
                    : `Vi ringer ${callbackForm.phone} (${callbackForm.preferredTime.toLowerCase()}).`}
                </p>
                <button onClick={() => { setActivePanel(null); setCallbackSent(false) }}
                  className="mt-3 text-xs underline" style={{ color: '#1A5EA8' }}>
                  Fortsätt chatta
                </button>
              </div>
            )}

            {/* Contact message form */}
            {activePanel === 'contact' && !contactSent && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">✉️</span>
                  <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>Skicka meddelande</p>
                </div>
                <p className="text-xs mb-3" style={{ color: '#1A5EA8' }}>
                  Vi svarar inom en arbetsdag.
                </p>
                <div className="space-y-2">
                  <input type="text" placeholder="Ditt namn" value={contactForm.name}
                    onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                  <input type="email" placeholder="E-postadress" value={contactForm.email}
                    onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                  <div className="flex gap-2">
                    <input type="tel" placeholder="Telefon (valfritt)" value={contactForm.phone}
                      onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                    <input type="text" placeholder="Företag (valfritt)" value={contactForm.company}
                      onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))}
                      className="flex-1 text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }} />
                  </div>
                  <select value={contactForm.subject}
                    onChange={e => setContactForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg border" style={{ borderColor: '#B5D4F4', background: 'white' }}>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <textarea placeholder="Ditt meddelande" value={contactForm.message}
                    onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))}
                    rows={3} className="w-full text-sm px-3 py-2 rounded-lg border resize-none"
                    style={{ borderColor: '#B5D4F4', background: 'white' }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setActivePanel(null)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{ border: '1px solid #1A5EA8', color: '#1A5EA8' }}>
                    Avbryt
                  </button>
                  <button onClick={handleContactSubmit}
                    disabled={!contactForm.name || !contactForm.email?.includes('@') || !contactForm.message}
                    className="flex-1 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-40 transition-colors"
                    style={{ background: '#1A5EA8' }}>
                    Skicka
                  </button>
                </div>
              </div>
            )}

            {activePanel === 'contact' && contactSent && (
              <div className="p-4 rounded-xl text-center chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
                <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>Meddelande skickat!</p>
                <p className="text-xs mt-1" style={{ color: '#1A5EA8' }}>
                  Vi återkommer till {contactForm.email} inom en arbetsdag.
                </p>
                <button onClick={() => { setActivePanel(null); setContactSent(false) }}
                  className="mt-3 text-xs underline" style={{ color: '#1A5EA8' }}>
                  Fortsätt chatta
                </button>
              </div>
            )}

            {/* Contact info card */}
            {activePanel === 'info' && (
              <div className="p-4 rounded-xl chat-msg-enter"
                style={{ background: '#F0F5FF', border: '1px solid rgba(26,94,168,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📋</span>
                  <p className="text-sm font-semibold" style={{ color: '#0C447C' }}>Kontaktuppgifter</p>
                </div>
                <div className="space-y-3 text-xs" style={{ color: '#1A5EA8' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-sm mt-0.5">📧</span>
                    <div>
                      <p className="font-semibold" style={{ color: '#0C447C' }}>E-post</p>
                      <a href="mailto:info@kylutbildningen.se" className="underline">info@kylutbildningen.se</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm mt-0.5">📱</span>
                    <div>
                      <p className="font-semibold" style={{ color: '#0C447C' }}>Telefon</p>
                      <a href="tel:031-472636" className="underline">031-47 26 36</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-sm mt-0.5">📍</span>
                    <div>
                      <p className="font-semibold" style={{ color: '#0C447C' }}>Adress</p>
                      <p>Kylutbildningen i Göteborg AB</p>
                      <p>A Odhners gata 7</p>
                      <p>421 30 Västra Frölunda</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setActivePanel(null)}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg transition-colors"
                    style={{ border: '1px solid #1A5EA8', color: '#1A5EA8' }}>
                    Stäng
                  </button>
                  <button onClick={() => { setActivePanel(null); openPanel('callback') }}
                    className="flex-1 py-2 text-xs font-semibold text-white rounded-lg transition-colors"
                    style={{ background: '#1A5EA8' }}>
                    📞 Bli uppringd
                  </button>
                </div>
              </div>
            )}

            <div />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: '#FAFBFC' }}>
        {/* Mid-conversation quick actions */}
        {started && !activePanel && (
          <div className="flex gap-1.5 mb-2">
            {QUICK_ACTIONS.map(action => (
              <button key={action.id} onClick={() => openPanel(action.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors hover:bg-[#E8F1FB]"
                style={{ color: '#1A5EA8', border: '1px solid rgba(26,94,168,0.12)' }}>
                <span className="text-xs">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center rounded-xl border transition-all duration-150"
          style={{ borderColor: 'var(--border)', background: 'white' }}
          onFocus={e => {
            e.currentTarget.style.borderColor = '#1A5EA8'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,94,168,0.08)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <input type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send(input)}
            placeholder="Skriv din fråga..."
            className="flex-1 text-sm px-4 py-2.5 bg-transparent outline-none border-none"
            style={{ fontSize: '14px' }}
            disabled={loading} />
          <button onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="w-9 h-9 mr-1 rounded-lg flex items-center justify-center
              transition-all duration-150 disabled:opacity-30"
            style={{ background: input.trim() ? 'var(--navy)' : 'transparent' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={input.trim() ? '#00C4FF' : '#8BA3BE'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22l-4-9-9-4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
