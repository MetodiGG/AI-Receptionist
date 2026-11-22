'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'
import { categoryById } from '../lib/discovery/categories.mjs'
import { subcategoryById } from '../lib/discovery/subcategories.mjs'
import { orderedRailRows } from '../lib/discovery/rail.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

export function InlineDiscoverySummary({ locale = 'bg', category = '', subcategory = '', result = null, loading = false, onClearCategory, onClearService }) {
  const language = locale === 'en' ? 'en' : 'bg', copy = INLINE_DISCOVERY_COPY[language]
  const summaryRef = useRef(null), [stickySafe, setStickySafe] = useState(false)
  useEffect(() => {
    const summary = summaryRef.current, shell = summary?.closest('.discovery-home')
    if (!summary || !shell || typeof window === 'undefined') return
    const property = '--inline-summary-offset'
    const previous = shell.style.getPropertyValue(property), priority = shell.style.getPropertyPriority(property)
    let active = true
    const supportsObserver = typeof ResizeObserver === 'function'
    const measure = () => {
      if (!active) return
      const height = summary.getBoundingClientRect().height, viewport = window.innerHeight
      // A tall summary remains in normal flow. Without resize observation we
      // cannot guarantee safety after text enlargement, so do not make it sticky.
      const safe = supportsObserver && Number.isFinite(height) && height > 0 && Number.isFinite(viewport) && viewport > 0 && height <= Math.min(240, viewport * .3)
      shell.style.setProperty(property, `${safe ? Math.ceil(height) + 24 : 0}px`)
      setStickySafe(safe)
    }
    const observer = supportsObserver ? new ResizeObserver(measure) : null
    observer?.observe(summary)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      active = false
      observer?.disconnect()
      window.removeEventListener('resize', measure)
      if (previous) shell.style.setProperty(property, previous, priority)
      else shell.style.removeProperty(property)
    }
  }, [])
  const parent = categoryById(category), child = subcategoryById(subcategory)
  const selectedService = parent && child?.category === parent.id ? child : null
  const parentLabel = parent?.[language], serviceLabel = selectedService?.[language]
  const catalogueMode = ['catalogue', 'sofia_only'].includes(result?.externalStatus)
  const rows = orderedRailRows(!result?.clarification && Array.isArray(result?.results) ? result.results : [], { preserveOrder: catalogueMode })
  // cataloguePage.total precedes native hydration/revocation checks, so it
  // cannot safely be presented as an exact final-displayable match total.
  const shown = new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'bg-BG').format(rows.length)
  const nextOffset = result?.cataloguePage?.nextOffset
  const hasMore = !result?.clarification && Number.isSafeInteger(nextOffset) && nextOffset > 0

  return <section className="inline-summary" ref={summaryRef} data-sticky-safe={stickySafe ? 'true' : undefined} aria-label={copy.activeFilters} aria-busy={loading} lang={language}>
    <div className="inline-summary-filters">
      {parentLabel ? <button type="button" className="inline-summary-chip inline-summary-chip--category" onClick={onClearCategory} disabled={typeof onClearCategory !== 'function'} aria-label={`${copy.clearCategory} · ${parentLabel}`}><span className="inline-summary-chip-label">{parentLabel}</span><Icon name="close"/></button> : <span className="inline-summary-all">{copy.allCategories}</span>}
      {serviceLabel && <span className="inline-summary-service"><span className="inline-summary-separator" aria-hidden="true"><Icon name="chevronDown"/></span><button type="button" className="inline-summary-chip inline-summary-chip--service" onClick={onClearService} disabled={typeof onClearService !== 'function'} aria-label={`${copy.clearService} · ${serviceLabel}`}><span className="inline-summary-chip-label">{serviceLabel}</span><Icon name="close"/></button></span>}
    </div>
    <p className="inline-summary-count" role="status" aria-live="polite" aria-atomic="true">{loading ? copy.loading : result ? <><span aria-label={`${copy.count}: ${shown}`}><strong>{shown}</strong> {copy.shown}</span>{hasMore && <span className="inline-summary-more">{copy.moreAvailable}</span>}</> : copy.results}</p>
  </section>
}
