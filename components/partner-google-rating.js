'use client'

import { useEffect, useRef, useState } from 'react'
import { loadPlacesLibrary } from '../lib/discovery/google-ui-loader.mjs'
import { createPartnerRatingWidget } from '../lib/discovery/partner-rating-widget.mjs'

export function PartnerGoogleRating({ slug, locale = 'bg', preview = false }) {
  const host = useRef(null), [status, setStatus] = useState('idle')
  useEffect(() => {
    if (preview || !/^[a-z0-9-]{2,64}$/.test(slug || '')) return
    setStatus('idle')
    let active = true, started = false, widget, timer, deadline
    const abort = new AbortController()
    const load = () => {
      if (started || !active) return
      started = true
      // Deferral also prevents React Strict Mode's discarded effect from
      // reserving a second provider request. No automatic retry on timeout.
      timer = setTimeout(async () => {
        try {
          deadline = setTimeout(() => { abort.abort(); if (active) { widget?.remove(); setStatus('unavailable') } }, 15000)
          const response = await fetch(`/api/public/${slug}/google-rating`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }), signal: abort.signal, cache: 'no-store' })
          if (!response.ok) throw new Error('RATING_UNAVAILABLE')
          const { plan } = await response.json()
          if (!active || abort.signal.aborted) return
          if (!plan) { clearTimeout(deadline); setStatus('unavailable'); return }
          if (plan.mode !== 'ui_kit_rating' || plan.locale !== locale || typeof plan.browserKey !== 'string' || !plan.browserKey) throw new Error('INVALID_RATING_PLAN')
          setStatus('loading')
          await loadPlacesLibrary(plan.browserKey, plan.locale)
          await customElements.whenDefined('gmp-advanced-place-details')
          if (!active || abort.signal.aborted || !host.current) return
          widget = createPartnerRatingWidget(document, plan)
          widget.addEventListener('gmp-load', () => { if (active && !abort.signal.aborted) { clearTimeout(deadline); setStatus('ready') } })
          widget.addEventListener('gmp-error', () => { if (active) { clearTimeout(deadline); widget.remove(); setStatus('unavailable') } })
          host.current.replaceChildren(widget)
        } catch { clearTimeout(deadline); if (active) { widget?.remove(); setStatus('unavailable') } }
      }, 0)
    }
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load() } }) : null
    if (observer && host.current) observer.observe(host.current)
    else load()
    return () => { active = false; observer?.disconnect(); abort.abort(); clearTimeout(timer); clearTimeout(deadline); widget?.remove() }
  }, [slug, locale, preview])
  return <div className="partner-google-rating" data-status={status}>
    {(status === 'loading' || status === 'ready') && <span className="reputation-source" translate="no">Google Maps</span>}
    {status === 'loading' && <span className="review-summary-muted" role="status">{locale === 'en' ? 'Loading Google rating…' : 'Зареждане на Google оценката…'}</span>}
    <div ref={host} className="partner-google-rating-host" aria-label={status === 'loading' || status === 'ready' ? (locale === 'en' ? 'Rating from Google Maps' : 'Оценка от Google Maps') : undefined}/>
  </div>
}
