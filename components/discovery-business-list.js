'use client'

import { useEffect, useId, useRef } from 'react'
import { createBusinessListAdvanceGate, observeBusinessListEnd } from '../lib/discovery/list-pagination.mjs'

// Businesses use normal page flow. Categories keep their existing horizontal
// rail, including its keyboard controls and native swipe behavior.
export function DiscoveryBusinessList({ title, locale = 'bg', action, children, headingRef, busy = false, message, footer, onNearEnd, hasMore = false, pending = false, requireScrollIntent = false, resetKey, pageKey }) {
  const id = useId(), sentinel = useRef(null), gate = useRef(null)
  if (!gate.current) gate.current = createBusinessListAdvanceGate()
  const currentKey = JSON.stringify([resetKey ?? null, pageKey ?? null])
  const latest = useRef(null)
  latest.current = { key: currentKey, load: onNearEnd, busy }
  const enabled = typeof onNearEnd === 'function' && !busy
  function advance() {
    const current = latest.current
    if (current.key === currentKey && !current.busy) gate.current.request(currentKey, current.load)
  }
  useEffect(() => {
    if (!enabled) return
    return observeBusinessListEnd(sentinel.current, advance, window, { requireScrollIntent })
    // Callback changes alone must not re-register the observer while typing.
    // Every callback checks the latest generation before requesting a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, enabled, requireScrollIntent])
  return <section className="home-discovery-section home-businesses" data-layout="vertical" aria-labelledby={`${id}-title`} aria-busy={busy}>
    <header className="home-section-heading"><h2 id={`${id}-title`} ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2>{action && <div className="home-section-actions">{action}</div>}</header>
    {message}
    <ul className="home-business-grid" id={id} role="list" aria-label={title}>{children}</ul>
    <div className="home-business-list-end" ref={sentinel} aria-hidden="true"/>
    <button type="button" className="home-business-list-keyboard-load" onClick={advance} aria-controls={id} aria-disabled={!enabled} tabIndex={enabled ? 0 : -1}>{pending ? (locale === 'en' ? 'Loading businesses…' : 'Зареждаме бизнеси…') : !hasMore ? (locale === 'en' ? 'All businesses are loaded' : 'Всички бизнеси са заредени') : (locale === 'en' ? 'Load the next businesses' : 'Зареди следващите бизнеси')}</button>
    {footer}
  </section>
}
