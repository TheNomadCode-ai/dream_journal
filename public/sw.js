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
      icon: '/icons/icon-192.png',
      data: { url: data.url || '/dashboard' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(
      event.notification.data.url || '/dashboard'
    )
  )
})