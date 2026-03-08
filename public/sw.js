const DB_NAME = 'somnia-notification-state'
const DB_VERSION = 1
const STORE = 'kv'
const SCHEDULE_KEY = 'schedule'

let schedule = null

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

async function putValue(key, value) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(value, key)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => resolve(false)
  })
}

async function getValue(key) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const request = tx.objectStore(STORE).get(key)

  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(request.result ?? null)
    tx.onerror = () => resolve(null)
  })
}

async function deleteValue(key) {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(key)
  return new Promise((resolve) => {
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => resolve(false)
  })
}

function dateKey(now) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function shouldStartToday(target) {
  if (!target?.firstTriggerAt) return true
  return new Date() >= new Date(target.firstTriggerAt)
}

async function didFire(tag, now) {
  const key = `fired:${tag}:${dateKey(now)}`
  const value = await getValue(key)
  return value === true
}

async function markFired(tag, now) {
  const key = `fired:${tag}:${dateKey(now)}`
  await putValue(key, true)
}

async function maybeFire(type, target) {
  if (!target) return
  if (!shouldStartToday(target)) return

  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  console.log('[SW] Checking time:', {
    now: currentTime,
    wake: schedule?.wake,
    evening: schedule?.evening,
  })

  if (now.getHours() !== target.hour || now.getMinutes() !== target.minute) {
    return
  }

  const tag = type === 'morning' ? 'morning' : 'evening'
  const firedToday = await didFire(tag, now)
  if (firedToday) return

  console.log('[SW] Firing notification:', type)

  if (type === 'morning') {
    await self.registration.showNotification('Your dream window is open.', {
      body: '5 minutes to capture last night.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'morning',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: '/morning', type: 'morning' },
    })
  } else {
    await self.registration.showNotification("Time to plant tonight's seed.", {
      body: 'What do you want to dream about?',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'evening',
      requireInteraction: true,
      vibrate: [100, 50, 100],
      data: { url: '/evening', type: 'evening' },
    })
  }

  await markFired(tag, now)
}

async function tick() {
  if (!schedule) {
    schedule = await getValue(SCHEDULE_KEY)
  }

  if (!schedule) return

  await maybeFire('morning', schedule.wake)
  await maybeFire('evening', schedule.evening)
}

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return

  if (event.data.type === 'SCHEDULE_ALL') {
    schedule = {
      wake: event.data.wake,
      evening: event.data.evening,
    }
    void putValue(SCHEDULE_KEY, schedule)
  }

  if (event.data.type === 'SCHEDULE_WAKE') {
    schedule = {
      wake: {
        hour: event.data.hour,
        minute: event.data.minute,
        firstTriggerAt: event.data.firstTriggerAt,
      },
      evening: schedule?.evening ?? null,
    }
    void putValue(SCHEDULE_KEY, schedule)
  }

  if (event.data.type === 'CLEAR_ALL' || event.data.type === 'CLEAR_WAKE') {
    schedule = null
    void deleteValue(SCHEDULE_KEY)
  }
})

setInterval(() => {
  void tick()
}, 60000)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/dashboard'))
})
