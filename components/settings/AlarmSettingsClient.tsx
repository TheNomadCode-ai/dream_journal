'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type AlarmRow = {
  id?: string
  user_id?: string
  alarm_time: string
  enabled: boolean
  days_of_week: number[]
  snooze_seconds: number
} | null

type Props = {
  initialAlarm: AlarmRow
  initialTimezone: string
  initialPushEnabled: boolean
}

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'))
const PERIODS = ['AM', 'PM'] as const
const DAYS = [
  { key: 1, label: 'M' },
  { key: 2, label: 'T' },
  { key: 3, label: 'W' },
  { key: 4, label: 'T' },
  { key: 5, label: 'F' },
  { key: 6, label: 'S' },
  { key: 7, label: 'S' },
]
const ITEM_HEIGHT = 44

function base64UrlToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

function to12Hour(time24: string | null | undefined) {
  const fallback = { hourIndex: 6, minuteIndex: 0, periodIndex: 0 as 0 | 1 }
  if (!time24) return fallback

  const [hRaw, mRaw] = time24.slice(0, 5).split(':')
  const hour24 = Number(hRaw)
  const minute = Number(mRaw)

  if (Number.isNaN(hour24) || Number.isNaN(minute)) return fallback

  const periodIndex = hour24 >= 12 ? 1 : 0
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const minuteIndex = Math.round(minute / 5) % 12

  return {
    hourIndex: Math.max(0, Math.min(11, hour12 - 1)),
    minuteIndex,
    periodIndex: periodIndex as 0 | 1,
  }
}

function to24Hour(hourIndex: number, minuteIndex: number, periodIndex: number) {
  const h12 = hourIndex + 1
  const m = minuteIndex * 5
  const period = PERIODS[periodIndex] ?? 'AM'

  let h24 = h12 % 12
  if (period === 'PM') h24 += 12

  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function WheelColumn({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.scrollTop = selectedIndex * ITEM_HEIGHT
  }, [selectedIndex])

  function snap() {
    if (!ref.current) return
    const index = Math.max(0, Math.min(items.length - 1, Math.round(ref.current.scrollTop / ITEM_HEIGHT)))
    ref.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
    onChange(index)
  }

  function handleScroll() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      snap()
    }, 90)
  }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div
        ref={ref}
        onScroll={handleScroll}
        onTouchEnd={snap}
        style={{
          height: 220,
          overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          padding: `${ITEM_HEIGHT * 2}px 0`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex)
          return (
            <div
              key={`${item}-${index}`}
              style={{
                height: ITEM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                color: index === selectedIndex ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                fontSize: 24,
                letterSpacing: '0.03em',
                filter: distance > 1 ? 'blur(0.8px)' : 'none',
                transition: 'color 120ms ease',
              }}
            >
              {item}
            </div>
          )
        })}
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: ITEM_HEIGHT,
          borderTop: '1px solid rgba(255,255,255,0.10)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default function AlarmSettingsClient({ initialAlarm, initialTimezone, initialPushEnabled }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [alarm, setAlarm] = useState<AlarmRow>(initialAlarm)
  const initialTime = useMemo(() => to12Hour(initialAlarm?.alarm_time), [initialAlarm?.alarm_time])
  const [hourIndex, setHourIndex] = useState(initialTime.hourIndex)
  const [minuteIndex, setMinuteIndex] = useState(initialTime.minuteIndex)
  const [periodIndex, setPeriodIndex] = useState(initialTime.periodIndex)
  const [selectedDays, setSelectedDays] = useState<number[]>(initialAlarm?.days_of_week ?? [1, 2, 3, 4, 5, 6, 7])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [pushEnabled, setPushEnabled] = useState(Boolean(initialPushEnabled || alarm?.enabled))
  const [timezone, setTimezone] = useState(initialTimezone)

  const deviceTimezone = useMemo(() => {
    if (typeof Intl === 'undefined') return 'UTC'
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  }, [])

  const timezoneChanged = timezone !== deviceTimezone

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)
  }, [])

  async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push notifications are not supported on this device.')
      return false
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''
    if (!vapidKey) {
      setError('Missing VAPID public key configuration.')
      return false
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(vapidKey),
    })

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        wakeTime: to24Hour(hourIndex, minuteIndex, periodIndex),
        wakeTimezone: timezone,
      }),
    })

    return response.ok
  }

  async function handleNotificationToggle() {
    if (notificationsLoading) return

    setError(null)

    if (permission === 'unsupported') return

    setNotificationsLoading(true)

    try {
      if (permission === 'default') {
        const result = await Notification.requestPermission()
        setPermission(result)

        if (result === 'granted') {
          const ok = await subscribeToPush()
          if (ok) {
            setPushEnabled(true)
          } else {
            setError('Could not save push subscription right now.')
          }
        } else {
          setPushEnabled(false)
        }

        if (result === 'denied') {
          setError('Enable notifications in your phone settings to receive the alarm.')
        }
        return
      }

      if (permission === 'granted') {
        const ok = await subscribeToPush()
        if (ok) setPushEnabled(true)
        if (!ok) setError('Could not refresh push subscription.')
      }
    } finally {
      setNotificationsLoading(false)
    }
  }

  async function handleSave() {
    if (selectedDays.length === 0) {
      setError('Select at least one day for your alarm.')
      return
    }

    setSaving(true)
    setError(null)

    const alarmTime = to24Hour(hourIndex, minuteIndex, periodIndex)

    try {
      const response = await fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alarm_time: alarmTime,
          enabled: true,
          days_of_week: selectedDays,
          snooze_seconds: 0,
          timezone,
        }),
      })

      if (!response.ok) {
        setError('Could not save alarm settings.')
        return
      }

      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (user) {
        const { data: updatedAlarm } = await (supabase as any)
          .from('alarms')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (updatedAlarm) {
          setAlarm(updatedAlarm as AlarmRow)
          setPushEnabled(Boolean(updatedAlarm.enabled))
          setSelectedDays(Array.isArray(updatedAlarm.days_of_week) ? updatedAlarm.days_of_week : selectedDays)
        }
      }

      const display = new Date(`1970-01-01T${alarmTime}:00`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

      setToast(`Alarm set for ${display}`)
      window.setTimeout(() => setToast(null), 2600)
    } finally {
      setSaving(false)
    }
  }

  function toggleDay(day: number) {
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter((item) => item !== day)
      }
      return [...current, day].sort((a, b) => a - b)
    })
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '42px 20px 110px', color: '#E8E4D9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link href="/settings" className="btn-ghost-gold" style={{ fontSize: 10 }}>
          ← Back
        </Link>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6F85' }}>
          Alarm
        </p>
      </div>

      <section style={{ border: '1px solid #1E2235', background: '#12141F', borderRadius: 16, padding: 20 }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10, color: '#C9A84C', marginBottom: 10 }}>
          Wake-up alarm
        </p>

        <div style={{ background: '#0A0B12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '8px 10px', display: 'flex', gap: 10 }}>
          <WheelColumn items={HOURS} selectedIndex={hourIndex} onChange={setHourIndex} />
          <WheelColumn items={MINUTES} selectedIndex={minuteIndex} onChange={setMinuteIndex} />
          <WheelColumn
            items={[...PERIODS]}
            selectedIndex={periodIndex}
            onChange={(index) => setPeriodIndex((index % 2 === 0 ? 0 : 1) as 0 | 1)}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <p style={{ fontFamily: "'Josefin Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 10, color: '#6B6F85', marginBottom: 10 }}>
            Repeat
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 8 }}>
            {DAYS.map((day) => {
              const selected = selectedDays.includes(day.key)
              return (
                <button
                  key={`${day.key}-${day.label}`}
                  onClick={() => toggleDay(day.key)}
                  type="button"
                  style={{
                    minHeight: 44,
                    borderRadius: 999,
                    background: selected ? 'rgba(180,130,255,0.25)' : 'rgba(255,255,255,0.03)',
                    border: selected ? '1px solid rgba(180,130,255,0.60)' : '1px solid rgba(255,255,255,0.10)',
                    color: selected ? '#F0E1FF' : 'rgba(255,255,255,0.65)',
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    transition: 'background 100ms ease, border-color 100ms ease, color 100ms ease',
                  }}
                >
                  {day.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ marginTop: 22, padding: '14px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 14, color: '#E8E4D9', marginBottom: 6 }}>Entry window</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)' }}>2 minutes after alarm fires</p>
        </div>

        <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <p style={{ fontSize: 14, color: '#E8E4D9', marginBottom: 10 }}>Notifications</p>

          {permission === 'denied' ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              Enable notifications in your phone settings to receive the alarm.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleNotificationToggle}
              disabled={notificationsLoading}
              style={{
                width: '100%',
                minHeight: 48,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.12)',
                background: pushEnabled ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                color: '#E8E4D9',
                textAlign: 'left',
                padding: '0 14px',
                fontSize: 13,
                opacity: notificationsLoading ? 0.7 : 1,
              }}
            >
              {notificationsLoading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 100 100" style={{ animation: 'moonPulse 1.5s ease-in-out infinite' }}>
                    <defs>
                      <radialGradient id="mg-notification" cx="32%" cy="30%" r="65%">
                        <stop offset="0%" stopColor="rgba(240,225,255,1)" />
                        <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
                      </radialGradient>
                    </defs>
                    <circle cx="50" cy="50" r="42" fill="url(#mg-notification)" />
                    <circle cx="66" cy="44" r="35" fill="#06040f" />
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : pushEnabled ? (
                'Notifications enabled'
              ) : (
                'Tap to enable alarm notifications'
              )}
            </button>
          )}
        </div>

        {timezoneChanged && (
          <div style={{ marginTop: 14, border: '1px solid rgba(201,168,76,0.35)', borderRadius: 12, padding: 12 }}>
            <p style={{ fontSize: 12, color: '#C9A84C', marginBottom: 8 }}>
              Timezone changed from {timezone} to {deviceTimezone}.
            </p>
            <button type="button" className="btn-ghost-gold" style={{ fontSize: 10 }} onClick={() => setTimezone(deviceTimezone)}>
              Use device timezone
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            marginTop: 20,
            width: '100%',
            minHeight: 52,
            borderRadius: 10,
            background: '#FFFFFF',
            color: '#000000',
            fontWeight: 600,
            fontSize: 15,
            opacity: saving ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {saving ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 100 100" style={{ animation: 'moonPulse 1.5s ease-in-out infinite' }}>
                <defs>
                  <radialGradient id="mg-save" cx="32%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="rgba(240,225,255,1)" />
                    <stop offset="100%" stopColor="rgba(140,80,255,0.6)" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="42" fill="url(#mg-save)" />
                <circle cx="66" cy="44" r="35" fill="#06040f" />
              </svg>
              <span>Saving...</span>
            </span>
          ) : (
            'Save Alarm'
          )}
        </button>

        <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.48)' }}>
          When your alarm fires, Somnia opens automatically. You have 2 minutes to begin your entry. After that, the window closes for the day.
        </p>

        {error && <p style={{ marginTop: 10, fontSize: 13, color: '#B06A74' }}>{error}</p>}
      </section>

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 24,
            transform: 'translateX(-50%)',
            background: '#FFFFFF',
            color: '#000000',
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            zIndex: 120,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
