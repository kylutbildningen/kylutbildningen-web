'use client'

import { useEffect, useRef } from 'react'
import { trackConversion } from '@/lib/analytics'

export function BookingConversionTracker() {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackConversion('booking')
  }, [])

  return null
}
