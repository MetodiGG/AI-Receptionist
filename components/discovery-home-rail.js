'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { railScrollState, railScrollTarget } from '../lib/discovery/rail-scroll.mjs'
import { createRailAdvanceGate } from '../lib/discovery/rail-advance.mjs'

// A native scroll region: no autoplay, cloned items, provider requests or
// carousel dependency. Every card stays reachable by swipe, Tab and arrows.
export function DiscoveryHomeRail({ title, locale, kind, action, children, headingRef, busy = false, message, onNearEnd, uniformCards = false, resetKey }) {
  const id = useId(), rail = useRef(null), frame = useRef(null), copy = HOME_DISCOVERY_COPY[locale]
  const advance = useRef(null), lastLeft = useRef(0)
  if (!advance.current) advance.current = createRailAdvanceGate()
  const [ends, setEnds] = useState({ start: true, end: true })
  const measure = () => { const node = rail.current; if (node) { const { start, end } = railScrollState(node); setEnds(current => current.start === start && current.end === end ? current : { start, end }) } }
  useEffect(() => {
    advance.current.reset(); lastLeft.current = 0
    rail.current?.scrollTo({ left: 0, behavior: 'instant' }); measure()
  }, [resetKey])
  useEffect(() => {
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    if (rail.current) { observer?.observe(rail.current); for (const child of rail.current.children) observer?.observe(child) }
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); cancelAnimationFrame(frame.current); frame.current = null }
  }, [children])
  function scroll(direction) {
    const node = rail.current
    if (!node) return
    if (direction > 0) {
      advance.current.arm()
      if (railScrollState(node).end && onNearEnd && advance.current.consume(node, { explicit: true })) { onNearEnd(); return }
    } else advance.current.reset()
    node.scrollTo({ left: railScrollTarget(node, direction), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  function onScroll() {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null; measure()
      const node = rail.current
      if (!node) return
      const left = railScrollState(node).left, movingRight = left > lastLeft.current
      lastLeft.current = left
      if (movingRight && onNearEnd && advance.current.consume(node)) onNearEnd()
    })
  }
  function onKeyDown(event) {
    if (['ArrowRight', 'PageDown', 'End', 'Tab'].includes(event.key) && !event.shiftKey) advance.current.arm()
    if (['ArrowLeft', 'Home'].includes(event.key)) advance.current.reset()
    if (event.key === 'End' && event.target === event.currentTarget) {
      event.preventDefault()
      const node = rail.current
      node.scrollTo({ left: railScrollState(node).max, behavior: 'instant' })
      if (onNearEnd && advance.current.consume(node, { explicit: true })) onNearEnd()
    }
  }
  return <section className={`home-discovery-section home-${kind}`} aria-labelledby={`${id}-title`} aria-busy={busy} data-uniform-cards={uniformCards || undefined}>
    <header className="home-section-heading"><h2 id={`${id}-title`} ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2><div className="home-section-actions">{action}<div className="home-rail-arrows"><button type="button" onClick={() => scroll(-1)} disabled={ends.start} aria-label={`${copy.previous} · ${title}`} aria-controls={id}><Icon name="back"/></button><button type="button" onClick={() => scroll(1)} disabled={ends.end && !onNearEnd} aria-label={`${copy.next} · ${title}`} aria-controls={id}><Icon name="arrow"/></button></div></div></header>
    {message}
    <ul className="home-discovery-rail" id={id} ref={rail} onScroll={onScroll} onWheel={event => { if (event.deltaX > 0 || (event.shiftKey && event.deltaY > 0)) advance.current.arm() }} onPointerDown={event => { if (event.button === 0) advance.current.arm() }} onKeyDown={onKeyDown} tabIndex={0} aria-label={title}>{children}</ul>
  </section>
}
