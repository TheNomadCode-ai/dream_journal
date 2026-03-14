'use client'

import { useEffect, useState } from 'react'

import TimeWheelPicker from '@/components/TimeWheelPicker'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push-notifications'
import { useProfile } from '@/lib/ProfileContext'
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default')
  const { refreshProfile, setProfile } = useProfile()

  useEffect(() => {
    setWakeTime(toInput(initialWakeTime || '07:00:00'))
    setSleepTime(toInput(initialSleepTime || '23:00:00'))
  }, [initialSleepTime, initialWakeTime])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    setNotifStatus(Notification.permission)
  }, [])

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaveMessage(null)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaveMessage('Could not verify your session.')
      setSaving(false)
      return
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        target_wake_time: `${wakeTime}:00`,
        target_sleep_time: `${sleepTime}:00`,
        timezone,
        wake_timezone: timezone,
      })

    if (error) {
      setSaveMessage('Could not save. Try again.')
      setSaving(false)
      return
    }

    const { data: refreshedProfile } = await supabase
      .from('profiles')
      .select('target_wake_time,target_sleep_time')
      .eq('id', user.id)
      .maybeSingle()

    if (refreshedProfile) {
      setWakeTime(toInput(refreshedProfile.target_wake_time || `${wakeTime}:00`))
      setSleepTime(toInput(refreshedProfile.target_sleep_time || `${sleepTime}:00`))
      setProfile((current) => {
        if (!current) return current
        return {
          ...current,
          target_wake_time: refreshedProfile.target_wake_time,
          target_sleep_time: refreshedProfile.target_sleep_time,
        }
      })
    }

    await refreshProfile()
    setSaveMessage('Saved ✓')
    setSaving(false)
  }

  const handleEnableNotifications = async () => {
    alert('handleEnableNotifications called')

    try {
      const result = await subscribeToPush()
      alert('subscribeToPush result: ' + JSON.stringify(result))

      if (result.success) {
        setNotifStatus('granted')
      } else {
        alert('Failed: ' + result.error)
      }
    } catch (err: any) {
      alert('Exception: ' + err.message)
    }
  }

  async function handleDisableNotifications() {
    await unsubscribeFromPush()
    // Treat unsubscribed as app-level disabled, even if browser permission remains granted.
    setNotifStatus('default')
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
              onClick={() => {
                console.log('Button tapped')
                alert('Button tapped - starting subscription')
                void handleEnableNotifications()
              }}
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

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Wake time</p>
        <TimeWheelPicker
          value={wakeTime}
          label="Wake time"
          onChange={setWakeTime}
        />
      </section>

      <section style={{ border: '1px solid #2a1f45', background: '#0f0a20', borderRadius: 14, padding: 18 }}>
        <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 11, color: '#a993cd', marginBottom: 12 }}>Sleep time</p>
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
      {saveMessage ? <p style={{ color: '#e8dbff' }}>{saveMessage}</p> : null}
      </div>
    </>
  )
}
