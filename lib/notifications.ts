import { minusMinutes } from '@/lib/dream-cycle'

export async function scheduleNotifications(
  wakeHour: number,
  wakeMinute: number,
  sleepHour: number,
  sleepMinute: number
) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const evening = minusMinutes(sleepHour, sleepMinute, 30)

  console.log('[Notification] Scheduled wake:', { hour: wakeHour, minute: wakeMinute })
  console.log('[Notification] Scheduled evening:', { hour: evening.hour, minute: evening.minute })

  registration.active?.postMessage({
    type: 'SCHEDULE_ALL',
    wake: {
      hour: wakeHour,
      minute: wakeMinute,
    },
    sleep: {
      hour: sleepHour,
      minute: sleepMinute,
    },
  })
}

export async function scheduleWakeNotification(hour: number, minute: number) {
  await scheduleNotifications(hour, minute, 23, 0)
}

export async function scheduleWindDownNotification(sleepHour: number, sleepMinute: number) {
  await scheduleNotifications(7, 0, sleepHour, sleepMinute)
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function cancelWakeNotification() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({ type: 'CLEAR_ALL' })
}
