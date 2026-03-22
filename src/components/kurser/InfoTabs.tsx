'use client'

import { useState } from 'react'
import { PortableText } from '@portabletext/react'

interface Flik {
  titel: string
  text?: any[]
  highlightText?: string
}

interface Props {
  flikar: Flik[]
}

export function InfoTabs({ flikar }: Props) {
  const [active, setActive] = useState(0)

  if (!flikar?.length) return null

  const current = flikar[active]

  return (
    <div className="rounded-lg overflow-hidden border"
      style={{ borderColor: '#DDE4ED' }}>

      {/* Flikar */}
      <div className="grid border-b"
        style={{
          gridTemplateColumns: `repeat(${flikar.length}, 1fr)`,
          borderColor: '#DDE4ED',
        }}>
        {flikar.map((flik, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`py-3.5 px-5 text-left transition-colors border-r last:border-r-0
              ${active === i
                ? 'bg-white border-b-2 -mb-px'
                : 'bg-gray-50 hover:bg-gray-100'
              }`}
            style={{
              borderColor: active === i ? '#1A5EA8' : '#DDE4ED',
              borderBottomColor: active === i ? '#1A5EA8' : '#DDE4ED',
            }}>
            <div className={`text-sm font-semibold ${active === i ? 'text-[#1A5EA8]' : 'text-gray-600'}`}>
              {flik.titel}
            </div>
          </button>
        ))}
      </div>

      {/* Innehåll */}
      <div className="bg-white p-6">
        {current.text && (
          <div className="prose prose-sm text-[15px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            <PortableText value={current.text} />
          </div>
        )}

        {current.highlightText && (
          <div className="mt-5 rounded-lg px-5 py-4 text-[14px] leading-relaxed"
            style={{
              background: 'rgba(26, 94, 168, 0.06)',
              borderLeft: '3px solid #1A5EA8',
              color: '#0C447C',
            }}>
            {current.highlightText}
          </div>
        )}
      </div>
    </div>
  )
}
