'use client'

import { useEffect, useRef, useState } from 'react'

// Reveals an already bounded result batch. This component never fetches,
// changes radius, requests location or starts an unbounded provider loop.
export function DiscoveryNearbyMore({ children, locale, radiusKm }) {
  const [expanded, setExpanded] = useState(false), sentinel = useRef(null)
  useEffect(() => {
    if (expanded || !sentinel.current || !window.IntersectionObserver) return
    let startY = null, touchY = null
    let visible = false, scrolled = false
    const reveal = () => { if (visible && scrolled) setExpanded(true) }
    const markIntent = () => { startY ??= window.scrollY }
    const onWheel = event => { if (event.deltaY > 0) markIntent() }
    const onTouchStart = event => { touchY = event.touches[0]?.clientY ?? null }
    const onTouchMove = event => { if (touchY !== null && event.touches[0]?.clientY < touchY) markIntent() }
    const onKey = event => { if (['PageDown', 'ArrowDown', 'End', ' '].includes(event.key) && !event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) markIntent() }
    const onScroll = () => { scrolled ||= startY !== null && window.scrollY > startY + 120; reveal() }
    const observer = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); reveal() })
    observer.observe(sentinel.current)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      observer.disconnect(); window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel); window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('keydown', onKey)
    }
  }, [expanded])
  const en = locale === 'en'
  return <section ref={sentinel} className="discovery-nearby-more" aria-label={en ? 'A little further away' : 'Малко по-далеч'}>
    <header><h3>{en ? 'A little further away' : 'Малко по-далеч'}</h3><span>{en ? 'Up to' : 'До'} {radiusKm} km</span></header>
    {expanded ? children : <button type="button" className="secondary-button" onClick={() => setExpanded(true)}>{en ? 'Show more places' : 'Покажи още места'}<span aria-hidden="true"> ↓</span></button>}
  </section>
}
