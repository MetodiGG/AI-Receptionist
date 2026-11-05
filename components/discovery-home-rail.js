'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { railScrollState, railScrollTarget } from '../lib/discovery/rail-scroll.mjs'

// A native scroll region: no autoplay, cloned items, provider requests or
// carousel dependency. Every card stays reachable by swipe, Tab and arrows.
export function DiscoveryHomeRail({ title, locale, kind, action, children, headingRef, busy = false, message, onNearEnd }) {
  const id = useId(), rail = useRef(null), frame = useRef(null), copy = HOME_DISCOVERY_COPY[locale]
  const [ends, setEnds] = useState({ start: true, end: true })
  const measure = () => { const node = rail.current; if (node) { const { start, end } = railScrollState(node); setEnds(current => current.start === start && current.end === end ? current : { start, end }) } }
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
    node.scrollTo({ left: railScrollTarget(node, direction), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  function onScroll() {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null; measure()
      const node = rail.current
      if (node && node.scrollLeft > 4 && node.scrollLeft + node.clientWidth >= node.scrollWidth - 80) onNearEnd?.()
    })
  }
  return <section className={`home-discovery-section home-${kind}`} aria-labelledby={`${id}-title`} aria-busy={busy}>
    <header className="home-section-heading"><h2 id={`${id}-title`} ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{title}</h2><div className="home-section-actions">{action}<div className="home-rail-arrows"><button type="button" onClick={() => scroll(-1)} disabled={ends.start} aria-label={`${copy.previous} · ${title}`} aria-controls={id}><Icon name="back"/></button><button type="button" onClick={() => scroll(1)} disabled={ends.end} aria-label={`${copy.next} · ${title}`} aria-controls={id}><Icon name="arrow"/></button></div></div></header>
    {message}
    <ul className="home-discovery-rail" id={id} ref={rail} onScroll={onScroll} tabIndex={0} aria-label={title}>{children}</ul>
  </section>
}
