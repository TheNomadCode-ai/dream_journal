const DB_NAME = 'somnia-local-notifications'
const DB_VERSION = 1
const STORE = 'schedule'
const WAKE_KEY = 'wake'
const WIND_DOWN_KEY = 'wind-down'
const DIGEST_KEY = 'digest'

let checkTimer = null
let lastWakeNotifiedDate = null
let lastWindDownNotifiedDate = null
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
  tx.objectStore(STORE).put(data.value, data.key)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function getSchedule() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const store = tx.objectStore(STORE)
  const wakeRequest = store.get(WAKE_KEY)
  const windDownRequest = store.get(WIND_DOWN_KEY)
  const digestRequest = store.get(DIGEST_KEY)

  return new Promise((resolve) => {
    tx.oncomplete = () => {
      resolve({
        wake: wakeRequest.result ?? null,
        windDown: windDownRequest.result ?? null,
        digest: digestRequest.result ?? null,
      })
    }
    tx.onerror = () => resolve({ wake: null, windDown: null, digest: null })
  })
}

async function clearSchedule(key) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(key)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function maybeFireNotification() {
  const schedules = await getSchedule()

  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const hour = now.getHours()
  const minute = now.getMinutes()

  if (schedules.wake && hour === schedules.wake.hour && minute === schedules.wake.minute && lastWakeNotifiedDate !== todayKey) {
    lastWakeNotifiedDate = todayKey
    self.registration.showNotification('🌙 Good morning. Your window is open.', {
      body: 'You have 5 minutes to capture your dream.',
      icon: '/icons/icon-192x192.png',
      tag: 'morning-alarm',
      requireInteraction: true,
      data: { url: '/journal/new' },
    })
  }

  if (schedules.windDown && hour === schedules.windDown.hour && minute === schedules.windDown.minute && lastWindDownNotifiedDate !== todayKey) {
    lastWindDownNotifiedDate = todayKey
    self.registration.showNotification('🌙 Wind down time.', {
      body: 'Your bedtime is in 60 minutes. Put your phone down soon.',
      icon: '/icons/icon-192x192.png',
      tag: 'wind-down',
      requireInteraction: false,
      silent: false,
      data: { url: '/dashboard' },
    })
  }

  // Sunday digest at 9:00 local time.
  if (
    schedules.digest &&
    now.getDay() === 0 &&
    hour === 9 &&
    minute === 0 &&
    lastWeeklyDigestDate !== todayKey
  ) {
    lastWeeklyDigestDate = todayKey
    self.registration.showNotification('Your week in review 🌙', {
      body: `${schedules.digest.morningsLogged} mornings logged\n${schedules.digest.streak} day streak\n${schedules.digest.lightPercent}% mornings with light\nAvg ${schedules.digest.averageMinutesFromTarget} min from target`,
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
    void setSchedule({ key: WAKE_KEY, value: { hour, minute } }).then(() => {
      startTicker()
    })
  }

  if (event.data.type === 'SCHEDULE_WIND_DOWN') {
    const { hour, minute } = event.data
    void setSchedule({ key: WIND_DOWN_KEY, value: { hour, minute } }).then(() => {
      startTicker()
    })
  }

  if (event.data.type === 'CANCEL_ALARM') {
    void clearSchedule(WAKE_KEY)
  }

  if (event.data.type === 'CANCEL_WIND_DOWN') {
    void clearSchedule(WIND_DOWN_KEY)
  }

  if (event.data.type === 'SCHEDULE_WEEKLY' || event.data.type === 'SCHEDULE_WEEKLY_DIGEST') {
    const { morningsLogged, streak, lightPercent, averageMinutesFromTarget } = event.data
    void (async () => {
      const db = await openDb()
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ morningsLogged, streak, lightPercent, averageMinutesFromTarget }, DIGEST_KEY)
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
