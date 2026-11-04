'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'

// A native scroll region: no autoplay, cloned items, provider requests or
// carousel dependency. Every card stays reachable by swipe, Tab and arrows.
export function DiscoveryHomeRail({ title, locale, kind, action, children }) {
  const id = useId(), rail = useRef(null), copy = HOME_DISCOVERY_COPY[locale]
  const [ends, setEnds] = useState({ start: true, end: true })
  const measure = () => { const node = rail.current; if (node) setEnds({ start: node.scrollLeft <= 2, end: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2 }) }
  useEffect(() => {
    measure()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    if (rail.current) observer?.observe(rail.current)
    window.addEventListener('resize', measure)
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure) }
  }, [children])
  function scroll(direction) {
    const node = rail.current
    if (!node) return
    node.scrollBy({ left: direction * node.clientWidth * .8, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <section className={`home-discovery-section home-${kind}`} aria-labelledby={`${id}-title`}>
    <header className="home-section-heading"><h2 id={`${id}-title`}>{title}</h2><div className="home-section-actions">{action}<div className="home-rail-arrows"><button type="button" onClick={() => scroll(-1)} disabled={ends.start} aria-label={`${copy.previous} · ${title}`} aria-controls={id}><Icon name="back"/></button><button type="button" onClick={() => scroll(1)} disabled={ends.end} aria-label={`${copy.next} · ${title}`} aria-controls={id}><Icon name="arrow"/></button></div></div></header>
    <ul className="home-discovery-rail" id={id} ref={rail} onScroll={measure} tabIndex={0} aria-label={title}>{children}</ul>
  </section>
}
