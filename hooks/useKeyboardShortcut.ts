'use client'

import { useEffect, useRef } from 'react'

type Modifier = 'Meta' | 'Control' | 'Alt' | 'Shift'

/**
 * useKeyboardShortcut — registers a global keydown listener for the given shortcut(s).
 *
 * @param shortcuts - One or more shortcut strings like "Meta+k", "Control+k"
 * @param callback  - Handler called when the shortcut fires
 *
 * @example
 * useKeyboardShortcut(['Meta+k', 'Control+k'], (e) => {
 *   e.preventDefault()
 *   openSearch()
 * })
 */
export function useKeyboardShortcut(
  shortcuts: string[],
  callback: (e: KeyboardEvent) => void
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const parts = shortcut.split('+')
        const key = parts[parts.length - 1]
        const modifiers = parts.slice(0, -1) as Modifier[]

        const modifierMatch = modifiers.every((mod) => {
          switch (mod) {
            case 'Meta':    return e.metaKey
            case 'Control': return e.ctrlKey
            case 'Alt':     return e.altKey
            case 'Shift':   return e.shiftKey
            default:        return false
          }
        })

        // Also ensure no extra modifiers are pressed beyond those specified
        const noExtraModifiers =
          (modifiers.includes('Meta') || !e.metaKey) &&
          (modifiers.includes('Control') || !e.ctrlKey) &&
          (modifiers.includes('Alt') || !e.altKey) &&
          (modifiers.includes('Shift') || !e.shiftKey)

        if (modifierMatch && noExtraModifiers && e.key.toLowerCase() === key.toLowerCase()) {
          callbackRef.current(e)
          return
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
