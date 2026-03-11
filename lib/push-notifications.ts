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
    alert('Permission result: ' + permission)

    if (permission !== 'granted') {
      return { success: false, error: `Permission: ${permission}` }
    }

    alert('Getting SW...')
    let reg: ServiceWorkerRegistration

    try {
      const existingReg = await navigator.serviceWorker.getRegistration('/')

      if (existingReg) {
        alert('Using existing SW reg')
        reg = existingReg
      } else {
        alert('No existing SW, registering...')
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        alert('SW registered: ' + reg.scope)
      }

      if (!reg.active) {
        alert('SW not active, waiting...')
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('SW activation timeout'))
          }, 5000)

          const sw = reg.installing || reg.waiting
          if (sw) {
            if (sw.state === 'activated') {
              clearTimeout(timeout)
              resolve()
              return
            }

            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated') {
                clearTimeout(timeout)
                resolve()
              }
            })
          } else {
            clearTimeout(timeout)
            resolve()
          }
        })
      }

      alert('SW active, creating subscription...')
    } catch (swErr: any) {
      alert('SW error: ' + swErr.message)
      return { success: false, error: swErr.message }
    }

    alert('Getting existing subscription...')
    console.log('Getting existing subscription...')
    let sub = await reg.pushManager.getSubscription()
    console.log('Existing sub:', sub ? 'yes' : 'none')
    alert('Existing sub: ' + (sub ? 'yes' : 'none'))

    if (sub) {
      alert('Unsubscribing...')
      console.log('Unsubscribing existing...')
      await sub.unsubscribe()
      alert('Unsubscribed')
    }

    alert('Creating new subscription...')
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

    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      alert('Subscription created: ' + sub.endpoint.slice(0, 40))
    } catch (subErr: any) {
      alert('Subscribe error: ' + subErr.message)
      return { success: false, error: subErr.message }
    }
    console.log('Subscription created:', sub.endpoint.slice(0, 50))

    console.log('Sending to server...')
    alert('About to fetch /api/push/subscribe')
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(sub.toJSON()),
    })
    alert('Fetch done, status: ' + res.status)

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
