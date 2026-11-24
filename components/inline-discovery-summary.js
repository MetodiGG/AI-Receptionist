'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'
import { categoryById } from '../lib/discovery/categories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { subcategoryById } from '../lib/discovery/subcategories.mjs'
import { orderedRailRows } from '../lib/discovery/rail.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

function SelectionPhoto({ source }) {
  const [failed, setFailed] = useState(null)
  return source ? <span className="inline-summary-photo" aria-hidden="true">{failed !== source && <img src={source} alt="" width={72} height={72} loading="lazy" decoding="async" onError={() => setFailed(source)}/>}</span> : null
}

export function InlineDiscoverySummary({ locale = 'bg', category = '', subcategory = '', result = null, loading = false, onClearCategory, onClearService }) {
  const language = locale === 'en' ? 'en' : 'bg', copy = INLINE_DISCOVERY_COPY[language]
  const summaryRef = useRef(null)
  useEffect(() => {
    const summary = summaryRef.current, shell = summary?.closest('.discovery-home')
    if (!summary || !shell || typeof window === 'undefined') return
    const property = '--inline-summary-offset'
    const previous = shell.style.getPropertyValue(property), priority = shell.style.getPropertyPriority(property)
    let active = true
    const measure = () => {
      if (!active) return
      const height = summary.getBoundingClientRect().height, viewport = window.innerHeight
      // Normal flow only. This clearance keeps the context above the first
      // business after a deliberate selection; it never pins the summary.
      const room = Number.isFinite(height) && height > 0 && Number.isFinite(viewport) && viewport > 0
        ? Math.min(Math.ceil(height) + 24, Math.max(0, viewport - 240)) : 0
      shell.style.setProperty(property, `${room}px`)
    }
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
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
  }, [category, subcategory, result, loading])
  const parent = categoryById(category), child = subcategoryById(subcategory)
  const selectedService = parent && child?.category === parent.id ? child : null
  const parentLabel = parent?.[language], serviceLabel = selectedService?.[language]
  const parentPhoto = homeCategories(language).find(item => item.id === parent?.id)
  const photo = selectedService ? selectedService.photo : parentPhoto?.photo2x
  const catalogueMode = ['catalogue', 'sofia_only'].includes(result?.externalStatus)
  const rows = orderedRailRows(!result?.clarification && Array.isArray(result?.results) ? result.results : [], { preserveOrder: catalogueMode })
  // Only a freshly verified server count can be called a total. Cursor
  // candidate counts can include revoked or unavailable native profiles.
  const exact = !result?.clarification && Number.isSafeInteger(result?.exactTotal) && result.exactTotal >= rows.length ? result.exactTotal : null
  const number = new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'bg-BG').format(exact ?? rows.length)
  const unit = exact === null ? copy.shown : exact === 1 ? copy.business : copy.businesses
  const clear = (label, callback, name, primary) => <button type="button" className={`inline-summary-selection-label${primary ? ' is-primary' : ''}`} onClick={callback} disabled={typeof callback !== 'function'} aria-label={`${name} · ${label}`}><span>{label}</span><Icon name="close"/></button>

  return <section className="inline-summary" ref={summaryRef} aria-label={copy.activeFilters} aria-busy={loading} lang={language}>
    <div className="inline-summary-selection">
      <SelectionPhoto source={photo}/>
      {selectedService?.generatedPhoto && <span className="sr-only">{language === 'en' ? 'AI illustration' : 'AI илюстрация'}</span>}
      <div className="inline-summary-labels">
        {serviceLabel && clear(parentLabel, onClearCategory, copy.clearCategory, false)}
        {serviceLabel ? clear(serviceLabel, onClearService, copy.clearService, true)
          : parentLabel ? clear(parentLabel, onClearCategory, copy.clearCategory, true)
            : <strong className="inline-summary-all">{copy.allCategories}</strong>}
      </div>
    </div>
    <p className="inline-summary-count" role="status" aria-live="polite" aria-atomic="true" aria-label={loading ? copy.loading : result ? `${exact === null ? copy.count : copy.totalCount}: ${number}` : copy.results}>
      {loading ? <><span className="inline-summary-count-placeholder" aria-hidden="true">—</span><span>{copy.loading}</span></>
        : result ? <><strong>{number}</strong><span>{unit}</span></> : <span>{copy.results}</span>}
    </p>
  </section>
}
