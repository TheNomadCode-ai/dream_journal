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

    alert('Checking for existing SW...')

    // Poll for an active SW registration
    // next-pwa registers it automatically
    const getActiveReg = (): Promise<ServiceWorkerRegistration> => {
      return new Promise((resolve, reject) => {
        let attempts = 0
        const check = async () => {
          attempts++
          const regs = await navigator.serviceWorker.getRegistrations()
          alert(
            `Attempt ${attempts}: ${regs.length} regs, states: ${regs
              .map((r) => r.active?.state || r.waiting?.state || r.installing?.state || 'none')
              .join(', ')}`
          )

          const activeReg = regs.find((r) => r.active)
          if (activeReg) {
            resolve(activeReg)
            return
          }

          if (attempts >= 10) {
            reject(new Error(`No active SW after ${attempts} attempts`))
            return
          }

          setTimeout(check, 1000)
        }
        check()
      })
    }

    const reg = await getActiveReg()
    alert('Found active SW: ' + reg.scope)

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

    // Now subscribe
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    alert('Sub created: ' + sub.endpoint.slice(0, 50))
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
