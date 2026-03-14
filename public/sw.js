self.addEventListener('install', (event) => {
  console.log('Minimal SW installing')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Minimal SW activated')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Somnia', {
      body: data.body || 'Your window is open.',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-96.png',
      vibrate: data.vibrate || [100, 50, 200],
      tag: data.tag || 'somnia',
      renotify: data.renotify || true,
      data: { url: data.url || data.data?.url || '/dashboard' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url.includes('somniavault.me') &&
            'focus' in client) {
          client.focus()
          client.navigate(
            'https://www.somniavault.me' + url
          )
          return
        }
      }
      return clients.openWindow(
        'https://www.somniavault.me' + url
      )
    })
  )
})