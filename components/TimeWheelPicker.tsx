'use client'

import { useEffect, useMemo, useRef } from 'react'

type Props = {
  value: string
  onChange: (time: string) => void
  label?: string
}

const ITEM_HEIGHT = 56
const WHEEL_HEIGHT = 200
const EDGE_PADDING = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function parseValue(value: string) {
  const [hourRaw, minuteRaw] = value.split(':')
  const hour = Math.min(23, Math.max(0, Number(hourRaw || 0)))
  const minute = Math.min(59, Math.max(0, Number(minuteRaw || 0)))
  const minuteStep = Math.round(minute / 5) * 5
  return {
    hour,
    minute: minuteStep === 60 ? 55 : minuteStep,
  }
}

export default function TimeWheelPicker({ value, onChange, label }: Props) {
  const hourRef = useRef<HTMLDivElement | null>(null)
  const minuteRef = useRef<HTMLDivElement | null>(null)

  const scrollTimers = useRef<{ hour?: number; minute?: number }>({})

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), [])
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), [])

  const parsed = parseValue(value)
  const selectedHour = parsed.hour
  const selectedMinute = parsed.minute

  function scrollToIndex(el: HTMLDivElement | null, index: number) {
    if (!el) return
    const top = index * ITEM_HEIGHT
    if (Math.abs(el.scrollTop - top) > 1) {
      el.scrollTo({ top, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const hourIndex = selectedHour
    const minuteIndex = Math.round(selectedMinute / 5)
    scrollToIndex(hourRef.current, hourIndex)
    scrollToIndex(minuteRef.current, minuteIndex)
  }, [selectedHour, selectedMinute])

  function emitChange(nextHour: number, nextMinute: number) {
    onChange(`${pad2(nextHour)}:${pad2(nextMinute)}`)
  }

  function handleScroll(kind: 'hour' | 'minute') {
    const el = kind === 'hour' ? hourRef.current : minuteRef.current
    if (!el) return

    if (scrollTimers.current[kind]) {
      window.clearTimeout(scrollTimers.current[kind])
    }

    scrollTimers.current[kind] = window.setTimeout(() => {
      const index = Math.max(0, Math.min(kind === 'hour' ? 23 : 11, Math.round(el.scrollTop / ITEM_HEIGHT)))
      const snappedTop = index * ITEM_HEIGHT
      el.scrollTo({ top: snappedTop, behavior: 'smooth' })

      if (kind === 'hour') {
        emitChange(index, selectedMinute)
      } else {
        emitChange(selectedHour, index * 5)
      }
    }, 80)
  }

  return (
    <div>
      {label ? <label style={{ display: 'block', marginBottom: 8, color: '#cfbde7' }}>{label}</label> : null}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            height: WHEEL_HEIGHT,
            width: '100%',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div
            ref={hourRef}
            onScroll={() => handleScroll('hour')}
            style={{
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingTop: EDGE_PADDING,
              paddingBottom: EDGE_PADDING,
            }}
            className="time-wheel-column"
          >
            {hours.map((h) => {
              const selected = h === selectedHour
              return (
                <div
                  key={`h-${h}`}
                  style={{
                    height: ITEM_HEIGHT,
                    scrollSnapAlign: 'center',
                    display: 'grid',
                    placeItems: 'center',
                    color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                    fontFamily: 'Georgia, serif',
                    fontSize: selected ? 32 : 24,
                    transition: 'color 120ms ease, font-size 120ms ease',
                  }}
                >
                  {pad2(h)}
                </div>
              )
            })}
          </div>

          <div
            ref={minuteRef}
            onScroll={() => handleScroll('minute')}
            style={{
              overflowY: 'auto',
              scrollSnapType: 'y mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingTop: EDGE_PADDING,
              paddingBottom: EDGE_PADDING,
            }}
            className="time-wheel-column"
          >
            {minutes.map((m) => {
              const selected = m === selectedMinute
              return (
                <div
                  key={`m-${m}`}
                  style={{
                    height: ITEM_HEIGHT,
                    scrollSnapAlign: 'center',
                    display: 'grid',
                    placeItems: 'center',
                    color: selected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.25)',
                    fontFamily: 'Georgia, serif',
                    fontSize: selected ? 32 : 24,
                    transition: 'color 120ms ease, font-size 120ms ease',
                  }}
                >
                  {pad2(m)}
                </div>
              )
            })}
          </div>
        </div>

        <div
          aria-hidden
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: 0,
            right: 0,
            top: EDGE_PADDING,
            height: ITEM_HEIGHT,
            borderTop: '1px solid rgba(200,160,80,0.3)',
            borderBottom: '1px solid rgba(200,160,80,0.3)',
            background: 'rgba(200,160,80,0.06)',
          }}
        />
      </div>
    </div>
  )
}
