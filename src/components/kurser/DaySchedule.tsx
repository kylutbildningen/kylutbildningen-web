'use client'

import { useState } from 'react'

interface Slot {
  tid?: string
  typ?: 'normal' | 'rast' | 'prov' | 'slut'
  aktiviteter?: string[]
}

interface Dag {
  dagTitel?: string
  dagSubtitel?: string
  slots?: Slot[]
}

interface Props {
  dagar: Dag[]
}

export function DaySchedule({ dagar }: Props) {
  const [active, setActive] = useState(0)

  if (!dagar?.length) return null

  const dag = dagar[active]

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ border: '0.5px solid #DDE4ED' }}>

      {/* Flik-rad */}
      <div className="grid"
        style={{ gridTemplateColumns: `repeat(${dagar.length}, 1fr)` }}>
        {dagar.map((d, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="py-3 px-4 text-center transition-all"
            style={{
              background: active === i ? 'white' : '#F0F3F7',
              borderBottom: active === i
                ? '2px solid #1A5EA8'
                : '0.5px solid #DDE4ED',
              borderRight: i < dagar.length - 1
                ? '0.5px solid #DDE4ED'
                : 'none',
              cursor: 'pointer',
            }}
          >
            <div className="text-sm font-semibold"
              style={{ color: active === i ? '#1A5EA8' : '#556678' }}>
              {d.dagTitel}
            </div>
            {d.dagSubtitel && (
              <div className="text-[11px] mt-0.5"
                style={{ color: active === i ? '#1A5EA8' : '#8BA3BE', opacity: 0.8 }}>
                {d.dagSubtitel}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Slots */}
      <div style={{ background: 'white' }}>
        {dag.slots?.map((slot, i) => (
          <div
            key={i}
            className="grid"
            style={{
              gridTemplateColumns: '72px 1fr',
              borderBottom: i < (dag.slots?.length ?? 0) - 1
                ? '0.5px solid #EEF1F5'
                : 'none',
              background: slot.typ === 'rast'
                ? '#F8F9FA'
                : slot.typ === 'prov'
                ? 'rgba(26,94,168,0.03)'
                : 'white',
            }}
          >
            {/* Tid */}
            <div className="flex items-start pt-3.5 px-4"
              style={{
                borderRight: '0.5px solid #EEF1F5',
                color: '#8BA3BE',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.03em',
              }}>
              {slot.tid}
            </div>

            {/* Aktiviteter */}
            <div className="py-3 px-5">
              {slot.typ === 'rast' ? (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#B4B2A9',
                }}>
                  {slot.aktiviteter?.[0] ?? 'Rast'}
                </span>
              ) : slot.typ === 'slut' ? (
                <span style={{ fontSize: '13px', color: '#8BA3BE', fontWeight: 500 }}>
                  {slot.aktiviteter?.[0] ?? 'Slut för dagen'}
                </span>
              ) : (
                <div className="flex flex-col gap-1">
                  {slot.aktiviteter?.map((a, j) => (
                    <div key={j} className="flex items-start gap-2">
                      {slot.typ === 'prov' ? (
                        <span className="mt-1 w-1.5 h-1.5 rounded-sm flex-shrink-0"
                          style={{ background: '#1A5EA8', marginTop: '5px' }} />
                      ) : (
                        <span className="mt-1 w-1 h-1 rounded-full flex-shrink-0"
                          style={{ background: '#B4B2A9', marginTop: '6px' }} />
                      )}
                      <span style={{
                        fontSize: '13px',
                        color: slot.typ === 'prov' ? '#0C447C' : '#556678',
                        fontWeight: slot.typ === 'prov' ? 600 : 400,
                        lineHeight: 1.5,
                      }}>
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
