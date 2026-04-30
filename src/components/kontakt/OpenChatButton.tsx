'use client'

import { useEffect } from 'react'

export function OpenChatButton() {
  useEffect(() => {
    window.dispatchEvent(new Event('open-chat-widget'))
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open-chat-widget'))}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
      style={{ background: 'var(--blue)' }}
    >
      Öppna chatt
    </button>
  )
}
