'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  totalSeconds: number
  onExpire: () => void
}

export default function CountdownTimer({ totalSeconds, onExpire }: Props) {
  const [seconds, setSeconds] = useState(totalSeconds)
  const expiredRef = useRef(false)

  useEffect(() => {
    setSeconds(totalSeconds)
    expiredRef.current = false
  }, [totalSeconds])

  useEffect(() => {
    if (seconds <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => current - 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [seconds, onExpire])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const display = `${mins}:${secs.toString().padStart(2, '0')}`

  const color = useMemo(() => {
    if (seconds > 120) return 'rgba(255,255,255,0.40)'
    if (seconds > 60) return 'rgba(255,200,80,0.70)'
    if (seconds > 30) return 'rgba(255,140,60,0.80)'
    return 'rgba(255,80,80,0.90)'
  }, [seconds])

  const pulseClass = seconds <= 60 ? 'timer-pulse' : ''

  return (
    <div
      className={pulseClass}
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
        fontSize: 14,
        letterSpacing: '0.1em',
        color,
        transition: 'color 1s ease',
      }}
    >
      {display}
    </div>
  )
}
