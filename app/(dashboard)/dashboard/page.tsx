'use client'

import { useEffect, useState } from 'react'

import DreamCycleDashboard from '../../../components/dashboard/DreamCycleDashboard'
import { useApp } from '@/context/AppContext'
import { getAllDreams, getAllSeeds, getStats, type DreamEntry, type SeedEntry } from '@/lib/local-db'

export default function DashboardPage() {
  const { profile } = useApp()
  const [dreams, setDreams] = useState<DreamEntry[]>([])
  const [seeds, setSeeds] = useState<SeedEntry[]>([])
  const [streak, setStreak] = useState(0)
  const [successRate, setSuccessRate] = useState(0)
  const [totalSeeds, setTotalSeeds] = useState(0)
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [dreamRows, seedRows, stats] = await Promise.all([
        getAllDreams(),
        getAllSeeds(),
        getStats(),
      ])

      setDreams(dreamRows)
      setSeeds(seedRows)
      setStreak(stats.streak)
      setSuccessRate(stats.successRate)
      setTotalSeeds(stats.totalSeeds)
    }

    void load()
  }, [])

  useEffect(() => {
    const shown = localStorage.getItem('somnia_privacy_notice_shown')
    if (!shown) {
      setShowPrivacyNotice(true)
    }
  }, [])

  function closePrivacyNotice() {
    localStorage.setItem('somnia_privacy_notice_shown', 'true')
    setShowPrivacyNotice(false)
  }

  const wakeTime = profile?.target_wake_time ?? '07:00:00'
  const sleepTime = profile?.target_sleep_time ?? '23:00:00'
  const showNotificationReminderBanner = profile?.notification_permission_granted === false
  const isProOrTrial =
    profile?.tier === 'pro' ||
    profile?.tier === 'lifetime' ||
    (profile?.tier === 'free' && Boolean(profile?.trial_ends_at) && new Date(profile?.trial_ends_at ?? '').getTime() > Date.now())

  return (
    <div className="page-content page-enter">
      <DreamCycleDashboard
        wakeTime={wakeTime}
        sleepTime={sleepTime}
        dreams={dreams}
        seeds={seeds}
        streak={streak}
        successRate={successRate}
        totalSeeds={totalSeeds}
        showNotificationReminderBanner={showNotificationReminderBanner}
        isProOrTrial={isProOrTrial}
      />

      {showPrivacyNotice ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,4,15,0.92)', display: 'grid', placeItems: 'center', zIndex: 99, padding: 24 }}>
          <div style={{ width: 'min(640px, 100%)', background: '#100a22', border: '1px solid #2a1f45', borderRadius: 16, padding: 24 }}>
            <h2 style={{ fontFamily: "'Cormorant', Georgia, serif", fontStyle: 'italic', fontSize: 42, marginBottom: 10 }}>
              Your dreams stay here.
            </h2>
            <p style={{ color: '#d5c8eb', lineHeight: 1.7, marginBottom: 18 }}>
              Somnia stores everything on this device. Your dream entries never leave your phone. If you uninstall the app your entries will be deleted. This is intentional.
            </p>
            <button className="btn-gold" onClick={closePrivacyNotice}>I understand</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
