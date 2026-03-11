// Local schedule fallback state (kept for backward compatibility with existing onboarding flows).
let notifSchedule = {
  morning: null,
  evening: null,
}

function normalizeMinutes(total) {
  const day = 24 * 60
  return ((total % day) + day) % day
}

function toHHMM(totalMinutes) {
  const normalized = normalizeMinutes(totalMinutes)
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    notifSchedule.morning = e.data.morningTime
    notifSchedule.evening = e.data.eveningTime
  }

  if (e.data?.type === 'SCHEDULE_ALL') {
    const wake = e.data.wake
    const sleep = e.data.sleep
    if (wake) {
      notifSchedule.morning = toHHMM((wake.hour * 60 + wake.minute) - 120)
    }
    if (sleep) {
      notifSchedule.evening = toHHMM((sleep.hour * 60 + sleep.minute) - 10)
    }
  }

  if (e.data?.type === 'CLEAR_ALL') {
    notifSchedule.morning = null
    notifSchedule.evening = null
  }
})

// Web Push payload handler (iOS 16.4+ and Android Chrome PWA supported).
self.addEventListener('push', (e) => {
  if (!e.data) return

  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: data.tag,
      data: { url: data.url },
      requireInteraction: false,
      vibrate: [200, 100, 200],
    })
  )
})

// Optional local fallback checks when the app is actively fetching.
let lastCheck = 0
self.addEventListener('fetch', () => {
  const now = Date.now()
  if (now - lastCheck > 60000) {
    lastCheck = now
    checkAndNotify()
  }
})

async function checkAndNotify() {
  if (!notifSchedule.morning && !notifSchedule.evening) return

  const now = new Date()
  const current = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  if (clients.length > 0) return

  if (current === notifSchedule.morning) {
    self.registration.showNotification('Somnia', {
      body: 'Your morning window is open. Write before it fades.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'morning',
      data: { url: '/morning' },
    })
  }

  if (current === notifSchedule.evening) {
    self.registration.showNotification('Somnia', {
      body: 'Your planting window is open. What do you want to dream tonight?',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'evening',
      data: { url: '/evening' },
    })
  }
}

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const appClient = clients.find((c) => c.url.includes('somniavault.me'))
      if (appClient) {
        appClient.focus()
        appClient.navigate(url)
      } else {
        self.clients.openWindow(`https://www.somniavault.me${url}`)
      }
    })
  )
})
