'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import '../app/inline-discovery-panel.css'

// Presence is presentation only: logical selection and its callbacks always
// belong to the parent. Closing briefly retains only committed visual content.
export function InlineDiscoveryPanel({ children, open = false }) {
  const [retainedChildren, setRetainedChildren] = useState(() => open ? children : null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const exitTimer = useRef(null)

  useLayoutEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useLayoutEffect(() => {
    if (open) setRetainedChildren(() => children)
  }, [open, children])

  useLayoutEffect(() => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current)
    exitTimer.current = null
    if (open) return
    if (reducedMotion) { setRetainedChildren(null); return }
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null
      setRetainedChildren(null)
    }, 200)
    return () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current)
      exitTimer.current = null
    }
  }, [open, reducedMotion])

  function finishExit(event) {
    if (open || event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') return
    if (exitTimer.current !== null) clearTimeout(exitTimer.current)
    exitTimer.current = null
    setRetainedChildren(null)
  }

  return <div className="inline-discovery-panel" data-open={open ? 'true' : 'false'} inert={!open ? true : undefined} aria-hidden={!open ? true : undefined} onTransitionEnd={finishExit}>
    <div className="inline-discovery-panel-inner">{open ? children : retainedChildren}</div>
  </div>
}
