const DB_NAME = 'somnia-sw'
const DB_VERSION = 1
const STORE_NAME = 'schedule'

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      e.target.result
        .createObjectStore(STORE_NAME)
    }
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

async function saveSchedule(data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME)
      .put(data, 'schedule')
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

async function getSchedule() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME)
      .get('schedule')
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = reject
  })
}

async function getFiredToday() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME)
      .get('firedToday')
    req.onsuccess = e =>
      resolve(e.target.result || {})
    req.onerror = reject
  })
}

async function setFiredToday(data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME)
      .put(data, 'firedToday')
    tx.oncomplete = resolve
    tx.onerror = reject
  })
}

// Listen for schedule messages
self.addEventListener('message', async (e) => {
  console.log('[SW] Message received:', e.data)
  if (e.data.type === 'SCHEDULE_ALL') {
    await saveSchedule(e.data)
    console.log('[SW] Schedule saved:', e.data)
  }
})

// Check every 30 seconds for accuracy
setInterval(async () => {
  const schedule = await getSchedule()
  if (!schedule) return

  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const today = now.toDateString()

  console.log('[SW] Tick:',
    ${h}:, 'schedule:', schedule)

  const fired = await getFiredToday()

  // Reset fired log if new day
  if (fired.date !== today) {
    await setFiredToday({ date: today })
  }

  const firedToday = fired.date === today
    ? fired : { date: today }

  // Check morning notification
  const wake = schedule.wake
  if (
    wake &&
    h === wake.hour &&
    m === wake.minute &&
    !firedToday.morning
  ) {
    console.log('[SW] Firing morning notification')
    await self.registration.showNotification(
      'Your dream window is open.', {
        body: 'You have 5 minutes to capture last night.',
        icon: '/icons/icon-192x192.png',
        tag: 'morning',
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { url: '/morning' }
      }
    )
    firedToday.morning = true
    await setFiredToday(firedToday)
  }

  // Check evening notification
  // Evening fires 30 min before sleep time
  const sleep = schedule.sleep
  if (sleep) {
    let eveningH = sleep.hour
    let eveningM = sleep.minute - 30
    if (eveningM < 0) {
      eveningM += 60
      eveningH -= 1
      if (eveningH < 0) eveningH += 24
    }

    if (
      h === eveningH &&
      m === eveningM &&
      !firedToday.evening
    ) {
      console.log('[SW] Firing evening notification')
      await self.registration.showNotification(
        'Time to plant tonight\'s seed.', {
          body: 'Your 5 minute planting window is open.',
          icon: '/icons/icon-192x192.png',
          tag: 'evening',
          requireInteraction: true,
          vibrate: [100, 50, 100],
          data: { url: '/evening' }
        }
      )
      firedToday.evening = true
      await setFiredToday(firedToday)
    }
  }
}, 30000) // Every 30 seconds

// Handle notification clicks
self.addEventListener(
  'notificationclick', (e) => {
  console.log('[SW] Notification clicked:',
    e.notification.tag)
  e.notification.close()
  e.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      const url = e.notification.data?.url || '/'
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url.includes(
          self.location.origin) &&
          'focus' in client) {
          client.focus()
          client.navigate(url)
          return
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

self.addEventListener('install', e => {
  console.log('[SW] Installing')
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  console.log('[SW] Activated')
  e.waitUntil(clients.claim())
})
