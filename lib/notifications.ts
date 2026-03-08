export async function scheduleWakeNotification(hour: number, minute: number) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (!('Notification' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SCHEDULE_ALARM',
    hour,
    minute,
  })
}

export async function scheduleWindDownNotification(sleepHour: number, sleepMinute: number) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (!('Notification' in window)) return

  let windDownHour = sleepHour
  let windDownMinute = sleepMinute - 60

  if (windDownMinute < 0) {
    windDownMinute += 60
    windDownHour -= 1
    if (windDownHour < 0) windDownHour += 24
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SCHEDULE_WIND_DOWN',
    hour: windDownHour,
    minute: windDownMinute,
  })
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
  registration.active?.postMessage({ type: 'CANCEL_ALARM' })
  registration.active?.postMessage({ type: 'CANCEL_WIND_DOWN' })
}

export async function scheduleWeeklyDigestNotification(data: {
  morningsLogged: number
  streak: number
  lightPercent: number
  averageMinutesFromTarget: number
}) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SCHEDULE_WEEKLY',
    ...data,
  })
}
