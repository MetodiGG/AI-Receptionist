'use client'

import { useEffect } from 'react'

// Installing a PWA fetches its own cache of icons and shell assets. Don't
// make a fresh visit race that work against the visible homepage.
export function schedulePwaRegistration(win, doc, register) {
  let cancelled = false, idle = null, timeout = null
  const start = () => { if (!cancelled) register() }
  const schedule = () => {
    if (cancelled) return
    if (typeof win.requestIdleCallback === 'function') {
      idle = win.requestIdleCallback(start, { timeout: 1800 })
    } else {
      timeout = win.setTimeout(start, 200)
    }
  }
  if (doc.readyState === 'complete') schedule()
  else win.addEventListener('load', schedule, { once: true })
  return () => {
    cancelled = true
    win.removeEventListener('load', schedule)
    if (idle !== null) win.cancelIdleCallback?.(idle)
    if (timeout !== null) win.clearTimeout(timeout)
  }
}

export function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || process.env.NODE_ENV !== 'production') return
    return schedulePwaRegistration(window, document, () => {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.error('PWA registration failed.', error))
    })
  }, [])
  return null
}

