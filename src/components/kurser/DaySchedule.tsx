'use client'

import { useState } from 'react'

interface Pass {
  tid?: string
  typ?: 'lesson' | 'break' | 'exam' | 'end'
  aktiviteter?: string[]
}

interface Dag {
  dagTitel: string
  dagSubtitel?: string
  pass?: Pass[]
}

interface Props {
  dagar: Dag[]
}

export function DaySchedule({ dagar }: Props) {
  const [active, setActive] = useState(0)

  if (!dagar?.length) return null

  const currentDay = dagar[active]

  const textStyle = (typ: string) => {
    switch (typ) {
      case 'break': return 'text-gray-400 uppercase text-xs tracking-wider font-medium'
      case 'exam':  return 'text-[#0C447C] font-semibold'
      case 'end':   return 'text-gray-400 font-medium'
      default:      return 'text-gray-800 text-[13px]'
    }
  }

  return (
    <div className="rounded-lg overflow-hidden border"
      style={{ borderColor: '#DDE4ED' }}>

      {/* Dag-flikar */}
      <div className="grid border-b"
        style={{
          gridTemplateColumns: `repeat(${dagar.length}, 1fr)`,
          borderColor: '#DDE4ED',
        }}>
        {dagar.map((dag, i) => (
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
              {dag.dagTitel}
            </div>
            {dag.dagSubtitel && (
              <div className={`text-[11px] mt-0.5 ${active === i ? 'text-[#1A5EA8] opacity-70' : 'text-gray-400'}`}>
                {dag.dagSubtitel}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Schema-rader */}
      <div className="divide-y divide-[#EEF1F5]">
        {currentDay.pass?.map((p, i) => (
          <div key={i}
            className={`grid ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
            style={{ gridTemplateColumns: '88px 1fr' }}>

            {/* Tid */}
            <div className="px-4 py-3.5 text-[11px] font-bold text-gray-400
              border-r flex items-start pt-4 tracking-wide leading-tight"
              style={{ borderColor: '#EEF1F5' }}>
              {p.tid}
            </div>

            {/* Aktiviteter */}
            <div className="px-5 py-3.5 flex flex-col gap-1">
              {p.aktiviteter?.map((aktivitet, j) => (
                <span key={j} className={`text-[13px] leading-snug ${textStyle(p.typ ?? 'lesson')}`}>
                  {aktivitet}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
