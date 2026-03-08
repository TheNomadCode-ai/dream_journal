'use client'

import { useEffect } from 'react'

import { scheduleWeeklyDigestNotification } from '@/lib/notifications'

type Props = {
  morningsLogged: number
  streak: number
  lightPercent: number
  averageMinutesFromTarget: number
}

export default function WeeklyDigestScheduler({ morningsLogged, streak, lightPercent, averageMinutesFromTarget }: Props) {
  useEffect(() => {
    void scheduleWeeklyDigestNotification({ morningsLogged, streak, lightPercent, averageMinutesFromTarget })
  }, [morningsLogged, streak, lightPercent, averageMinutesFromTarget])

  return null
}
