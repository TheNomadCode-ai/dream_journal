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
}

export async function scheduleWeeklyDigestNotification(data: {
  morningsLogged: number
  streak: number
  minutesCloser: number
}) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage({
    type: 'SCHEDULE_WEEKLY_DIGEST',
    ...data,
  })
}
