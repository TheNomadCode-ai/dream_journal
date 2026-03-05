'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const DEMO_TEXT = "I was in a house I didn't recognise.\nThe hallway kept extending..."

type DemoState = {
  timerText: string
  progress: number
  typed: string
  showAlarm: boolean
  showBar: boolean
  showCheck: boolean
  showSaved: boolean
}

const initialState: DemoState = {
  timerText: '2:00',
  progress: 1,
  typed: '',
  showAlarm: false,
  showBar: false,
  showCheck: false,
  showSaved: false,
}

export default function AlarmDemoTicker() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [state, setState] = useState<DemoState>(initialState)

  useEffect(() => {
    const node = hostRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry?.isIntersecting ?? false)
      },
      { threshold: 0.45 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) {
      setState(initialState)
      return
    }

    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const elapsed = ((now - start) % 12000 + 12000) % 12000

      const showAlarm = elapsed >= 0
      const showBar = elapsed >= 1000

      const rawProgress = elapsed <= 1000 ? 1 : elapsed >= 11000 ? 0 : 1 - (elapsed - 1000) / 10000

      const savePoint = 10800
      const showCheck = elapsed >= savePoint
      const showSaved = elapsed >= savePoint
      const progress = showCheck ? 0.08 : Math.max(0, rawProgress)

      const remainingSeconds = Math.max(0, Math.ceil(progress * 120))
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      const timerText = `${minutes}:${String(seconds).padStart(2, '0')}`

      let typed = ''
      if (elapsed >= 2000) {
        const chars = Math.min(DEMO_TEXT.length, Math.floor((elapsed - 2000) / 40))
        typed = DEMO_TEXT.slice(0, chars)
      }

      setState({ timerText, progress, typed, showAlarm, showBar, showCheck, showSaved })
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isVisible])

  const progressClass = useMemo(() => {
    if (state.progress <= 0.5) return 'alarm-demo-progress is-amber'
    return 'alarm-demo-progress'
  }, [state.progress])

  return (
    <div ref={hostRef} className="alarm-demo-shell" aria-label="Live alarm capture preview">
      <div className="alarm-demo-header">
        <p className={`alarm-demo-kicker ${state.showAlarm ? 'is-visible' : ''}`}>
          <span aria-hidden="true" className="alarm-demo-bell">🔔</span> Alarm fired at 7:00 AM
        </p>
        <p className="alarm-demo-timer">{state.timerText}</p>
      </div>

      {state.showBar && (
        <>
          <div className="alarm-demo-progress-track" role="progressbar" aria-valuenow={Math.round(state.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div className={progressClass} style={{ transform: `scaleX(${state.progress})` }} />
          </div>
          <p className="alarm-demo-hint">Window closes in</p>
        </>
      )}

      <div className="alarm-demo-body">
        <p className="alarm-demo-label">Quick capture</p>
        <p className="alarm-demo-copy">
          {state.typed}
          {!state.showSaved && <span className="alarm-demo-cursor">|</span>}
        </p>
      </div>

      <div className="alarm-demo-footer">
        {state.showSaved ? (
          <p className="alarm-demo-saved">{state.showCheck ? '✓' : ''} Dream saved.</p>
        ) : (
          <p className="alarm-demo-hint">Write before the window closes.</p>
        )}
      </div>
    </div>
  )
}
