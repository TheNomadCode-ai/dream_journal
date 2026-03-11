export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === 'undefined') {
      return { success: false, error: 'No browser window' }
    }

    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'No service worker support' }
    }

    if (!('PushManager' in window)) {
      return { success: false, error: 'No PushManager support' }
    }

    const permission = await Notification.requestPermission()
    console.log('Permission after request:', permission)

    if (permission !== 'granted') {
      return { success: false, error: `Permission is: ${permission}` }
    }

    console.log('Waiting for SW...')
    const reg = await navigator.serviceWorker.ready
    console.log('SW ready, scope:', reg.scope)

    console.log('Getting existing subscription...')
    let sub = await reg.pushManager.getSubscription()
    console.log('Existing sub:', sub ? 'yes' : 'none')

    if (sub) {
      console.log('Unsubscribing existing...')
      await sub.unsubscribe()
    }

    console.log('Creating new subscription...')
    const vapidKeyRaw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    console.log('VAPID key available:', !!vapidKeyRaw)
    console.log('VAPID key length:', vapidKeyRaw?.length)

    if (!vapidKeyRaw) {
      return { success: false, error: 'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY' }
    }

    const vapidKey = vapidKeyRaw
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    console.log('Subscription created:', sub.endpoint.slice(0, 50))

    console.log('Sending to server...')
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sub.toJSON()),
    })

    console.log('Response status:', res.status)
    const responseText = await res.text()
    console.log('Response body:', responseText)

    if (!res.ok) {
      return { success: false, error: `Server ${res.status}: ${responseText}` }
    }

    return { success: true }
  } catch (err: any) {
    console.error('subscribeToPush error:', err)
    return { success: false, error: err?.message || String(err) }
  }
}

export async function unsubscribeFromPush() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const reg = await navigator.serviceWorker.ready
  const subscription = await reg.pushManager.getSubscription()

  if (subscription) {
    await subscription.unsubscribe()
    await fetch('/api/push/subscribe', {
      method: 'DELETE',
    })
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = atob(base64)
  return Uint8Array.from([...rawData], (c) => c.charCodeAt(0))
}
