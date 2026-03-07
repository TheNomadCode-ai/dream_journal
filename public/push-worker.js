self.addEventListener('push', (event) => {
  let payload = {
    title: 'Somnia',
    body: 'Your dreams are fading. You have 60 seconds.',
    url: '/capture?from=notification',
  }

  try {
    const json = event.data?.json()
    if (json) payload = { ...payload, ...json }
  } catch {
    // ignore malformed payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url || '/capture?from=notification' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/capture?from=notification'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => client.url.includes(targetUrl))
      if (existing) {
        return existing.focus()
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }

      return undefined
    })
  )
})
