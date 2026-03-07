'use client'

import { useEffect } from 'react'

const INTERACTIVE_SELECTOR = 'button, a, [role="button"]'

function getInteractiveElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null
  return target.closest(INTERACTIVE_SELECTOR)
}

export default function TouchFeedback() {
  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      const element = getInteractiveElement(event.target)
      if (!element) return
      element.classList.add('touching')
    }

    const clearTouch = (event: TouchEvent) => {
      const element = getInteractiveElement(event.target)
      if (!element) return
      window.setTimeout(() => {
        element.classList.remove('touching')
      }, 150)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', clearTouch, { passive: true })
    document.addEventListener('touchcancel', clearTouch, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', clearTouch)
      document.removeEventListener('touchcancel', clearTouch)
    }
  }, [])

  return null
}
