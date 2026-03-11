'use client'

import { useEffect, useState } from 'react'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push-notifications'
import { createClient } from '@/lib/supabase/client'

type Props = {
  initialWakeTime: string
  initialSleepTime: string
  tier: string
  isTrial: boolean
  trialDaysRemaining: number
}

function toInput(value: string) {
  return value.slice(0, 5)
}

export default function SleepPlanSettings({ initialWakeTime, initialSleepTime, tier, isTrial, trialDaysRemaining }: Props) {
  const [wakeTime, setWakeTime] = useState(toInput(initialWakeTime || '07:00:00'))
  const [sleepTime, setSleepTime] = useState(toInput(initialSleepTime || '23:00:00'))
  const [saving, setSaving] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default')

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    setNotifStatus(Notification.permission)
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        target_wake_time: wakeTime,
        target_sleep_time: sleepTime,
      })

    window.location.href = '/dashboard'
  }

  async function handleEnableNotifications() {
    const success = await subscribeToPush()
    if (success) {
      setNotifStatus('granted')
      return
    }

    if ('Notification' in window) {
      setNotifStatus(Notification.permission)
    }
  }

  async function handleDisableNotifications() {
    await unsubscribeFromPush()
    if ('Notification' in window) {
      // Browser permission can remain granted even when unsubscribed.
      setNotifStatus(Notification.permission)
    } else {
      setNotifStatus('default')
    }
  }

  return (
    <>
      <div style={{ display: 'grid', gap: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Settings
          </div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Sleep schedule and plan
          </h1>
        </div>

        <button
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            background: 'transparent',
            border: '1px solid rgba(200,160,80,0.5)',
            borderRadius: '4px',
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: saving
              ? 'rgba(200,160,80,0.4)'
              : 'rgba(200,160,80,0.9)',
            textTransform: 'uppercase',
            cursor: saving ? 'wait' : 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Sleep schedule</p>

        <div style={{ marginBottom: 16 }}>
          <TimeWheelPicker
            value={wakeTime}
            label="Wake time"
            onChange={setWakeTime}
          />
        </div>

        <TimeWheelPicker
          value={sleepTime}
          label="Sleep time"
          onChange={setSleepTime}
        />
      </section>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Plan</p>
        <p style={{ color: '#efe8ff', marginBottom: 8 }}>
          Current: {isTrial ? 'Pro (trial)' : tier === 'pro' ? 'Pro' : 'Free'}
        </p>
        {isTrial ? (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 8 }}>{trialDaysRemaining} day{trialDaysRemaining === 1 ? '' : 's'} remaining</p>
            <p style={{ color: '#cbb7e4' }}>Pro features unlocked during your trial.</p>
          </>
        ) : tier === 'pro' ? (
          <p style={{ color: '#cbb7e4' }}>Pro features unlocked.</p>
        ) : (
          <>
            <p style={{ color: '#cbb7e4', marginBottom: 12 }}>Free includes unlimited dream journaling and archive.</p>
            <a href="https://sushankhanal.gumroad.com/l/somniavault" target="_blank" rel="noreferrer" className="btn-gold">
              Upgrade to Pro - $4.99/mo
            </a>
          </>
        )}
      </section>

      <section style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <div
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
            fontSize: '10px',
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          Notifications
        </div>

        {notifStatus === 'denied' ? (
          <p
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
              fontSize: '11px',
              color: 'rgba(255,100,100,0.7)',
            }}
          >
            Notifications blocked. Enable in your browser settings.
          </p>
        ) : notifStatus === 'granted' ? (
          <div>
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '12px',
              }}
            >
              Notifications permission granted.
            </p>
            <button onClick={() => void handleDisableNotifications()} className="btn-gold">
              Disable push subscription
            </button>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '4px',
              }}
            >
              Get notified when your windows open.
            </p>
            <p
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                marginBottom: '16px',
                letterSpacing: '0.05em',
              }}
            >
              Morning and evening only. Nothing else.
            </p>
            <button
              onClick={() => void handleEnableNotifications()}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid rgba(200,160,80,0.5)',
                borderRadius: '4px',
                fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'rgba(200,160,80,0.9)',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Enable notifications
            </button>
          </div>
        )}
      </section>
      </div>
    </>
  )
}
