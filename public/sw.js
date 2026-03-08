const DB_NAME = 'somnia-wake-schedule'
const DB_VERSION = 1
const STORE = 'wake'
const WAKE_KEY = 'schedule'

let scheduledWake = null

function computeFirstTriggerAt(hour, minute) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }
  return target.toISOString()
}

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

async function storeWakeTime(wake) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(wake, WAKE_KEY)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function clearWakeTime() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(WAKE_KEY)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
  })
}

async function getStoredWakeTime() {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const request = tx.objectStore(STORE).get(WAKE_KEY)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(request.result ?? null)
    tx.onerror = () => resolve(null)
  })
}

async function maybeFireWakeNotification() {
  const wake = scheduledWake || await getStoredWakeTime()
  if (!wake) return

  const now = new Date()

  if (
    now.getHours() === wake.hour &&
    now.getMinutes() === wake.minute
  ) {
    self.registration.showNotification(wake.title, {
      body: wake.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'wake-notification',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: '/journal/new' },
    })
  }
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'SCHEDULE_WAKE') {
    scheduledWake = {
      hour: event.data.hour,
      minute: event.data.minute,
      firstTriggerAt: event.data.firstTriggerAt || computeFirstTriggerAt(event.data.hour, event.data.minute),
      title: event.data.title,
      body: event.data.body,
    }
    void storeWakeTime(scheduledWake)
  }

  if (event.data.type === 'CLEAR_WAKE') {
    scheduledWake = null
    void clearWakeTime()
  }
})

setInterval(() => {
  void maybeFireWakeNotification()
}, 60000)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  )
})
