'use client'

import { useEffect } from 'react'

import { scheduleWeeklyDigestNotification } from '@/lib/notifications'

type Props = {
  morningsLogged: number
  streak: number
  minutesCloser: number
}

export default function WeeklyDigestScheduler({ morningsLogged, streak, minutesCloser }: Props) {
  useEffect(() => {
    void scheduleWeeklyDigestNotification({ morningsLogged, streak, minutesCloser })
  }, [morningsLogged, streak, minutesCloser])

  return null
}
