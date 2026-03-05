'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const DEMO_TEXT = 'I was standing in an endless hallway of mirrors and one door was breathing like it was alive.'

type DemoState = {
  secondsLeft: number
  progress: number
  typed: string
  showSaved: boolean
}

const initialState: DemoState = {
  secondsLeft: 120,
  progress: 1,
  typed: '',
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

      const progress = elapsed < 1000 ? 1 : Math.max(0, 1 - (elapsed - 1000) / 10000)
      const secondsLeft = Math.max(0, Math.ceil(progress * 120))

      let typed = ''
      if (elapsed >= 2000 && elapsed < 10000) {
        const ratio = Math.min(1, (elapsed - 2000) / 8000)
        const chars = Math.floor(ratio * DEMO_TEXT.length)
        typed = DEMO_TEXT.slice(0, chars)
      }

      const showSaved = elapsed >= 10000 && elapsed < 11500

      setState({ secondsLeft, progress, typed, showSaved })
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
        <p className="alarm-demo-kicker">Somnia alarm just triggered</p>
        <p className="alarm-demo-timer">{String(state.secondsLeft).padStart(2, '0')}s left</p>
      </div>

      <div className="alarm-demo-progress-track" role="progressbar" aria-valuenow={Math.round(state.progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={progressClass} style={{ transform: `scaleX(${state.progress})` }} />
      </div>

      <div className="alarm-demo-body">
        <p className="alarm-demo-label">Quick capture</p>
        <p className="alarm-demo-copy">
          {state.typed}
          {!state.showSaved && <span className="alarm-demo-cursor">|</span>}
        </p>
      </div>

      <div className="alarm-demo-footer">
        {state.showSaved ? (
          <p className="alarm-demo-saved">✓ Dream saved.</p>
        ) : (
          <p className="alarm-demo-hint">Write before the window closes.</p>
        )}
      </div>
    </div>
  )
}
