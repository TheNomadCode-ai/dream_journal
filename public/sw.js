const DB_NAME = 'somnia-local-notifications'
const DB_VERSION = 1
const STORE = 'schedule'
const KEY = 'wake'
const DIGEST_KEY = 'digest'

let checkTimer = null
let lastNotifiedDate = null
let lastWeeklyDigestDate = null

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function setSchedule(data) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(data, KEY)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function getSchedule() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const request = tx.objectStore(STORE).get(KEY)
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
  })
}

async function clearSchedule() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(KEY)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function maybeFireNotification() {
  const schedule = await getSchedule()
  const digest = await (async () => {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const request = tx.objectStore(STORE).get(DIGEST_KEY)
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    })
  })()

  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const hour = now.getHours()
  const minute = now.getMinutes()

  if (schedule && hour === schedule.hour && minute === schedule.minute && lastNotifiedDate !== todayKey) {
    lastNotifiedDate = todayKey
    self.registration.showNotification('🌙 Good morning. Your window is open.', {
      body: 'You have 5 minutes to capture your dream.',
      icon: '/icons/icon-192x192.png',
      tag: 'morning-alarm',
      requireInteraction: true,
      data: { url: '/journal/new' },
    })
  }

  // Sunday digest at 9:00 local time.
  if (
    digest &&
    now.getDay() === 0 &&
    hour === 9 &&
    minute === 0 &&
    lastWeeklyDigestDate !== todayKey
  ) {
    lastWeeklyDigestDate = todayKey
    self.registration.showNotification('Your week in review 🌙', {
      body: `${digest.morningsLogged} mornings logged · ${digest.streak} day streak · ${digest.minutesCloser} min closer to target`,
      icon: '/icons/icon-192x192.png',
      tag: 'weekly-digest',
      data: { url: '/dashboard' },
    })
  }
}

function startTicker() {
  if (checkTimer) clearInterval(checkTimer)
  checkTimer = setInterval(() => {
    void maybeFireNotification()
  }, 60 * 1000)
  void maybeFireNotification()
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
  startTicker()
})

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'SCHEDULE_ALARM') {
    const { hour, minute } = event.data
    void setSchedule({ hour, minute }).then(() => {
      startTicker()
    })
  }

  if (event.data.type === 'CANCEL_ALARM') {
    void clearSchedule()
  }

  if (event.data.type === 'SCHEDULE_WEEKLY_DIGEST') {
    const { morningsLogged, streak, minutesCloser } = event.data
    void (async () => {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ morningsLogged, streak, minutesCloser }, DIGEST_KEY)
    })()
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/journal/new'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.includes(targetUrl))
      if (existing) return existing.focus()
      if (clients.openWindow) return clients.openWindow(targetUrl)
      return undefined
    })
  )
})
