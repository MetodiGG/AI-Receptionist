'use client'

import { useEffect, useId, useState } from 'react'
import { Icon } from './icon'
import { discoveryTilePhotoStyle } from './discovery-tile-photo-style.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

const localPhoto = source => typeof source === 'string' && /^\/service-photos\/[a-z0-9-]+\.webp$/.test(source)

function SubcategoryPhoto({ src }) {
  const [failed, setFailed] = useState(null)
  // A failed image never becomes an unrelated activity or platform emoji.
  return src && failed !== src
    ? <img className="discovery-subcategory-photo" src={src} width={40} height={40} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)}/>
    : <span className="discovery-subcategory-photo is-unavailable" aria-hidden="true"/>
}

export function DiscoverySubcategories({ category, title, options = [], selected = '', selectedLabel = '', locale = 'bg', loading = false, onSelect, navigationRef, inline = false, onClearCategory }) {
  const listId = useId(), [expanded, setExpanded] = useState(false), [collapsedLimit, setCollapsedLimit] = useState(4), en = locale === 'en'
  useEffect(() => setExpanded(false), [category])
  useEffect(() => {
    // Server HTML and the first client render agree; measure only after mount.
    if (inline || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(min-width: 760px)')
    const update = () => setCollapsedLimit(media.matches ? 6 : 4)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [inline])
  const choices = options.filter(item => item.category === category && typeof item.id === 'string' && localPhoto(item.photo) && (inline ? Number.isFinite(item.count) && item.count > 0 : !Number.isFinite(item.count) || item.count > 0))
  if (inline) {
    const language = en ? 'en' : 'bg', copy = INLINE_DISCOVERY_COPY[language]
    const parent = homeCategories(language).find(item => item.id === category)
    // A settled empty category does not fabricate a service menu or counts.
    // Pending service discovery has an honest status and inert placeholders.
    if (!parent || (!choices.length && !loading)) return null
    const needsWideLabels = choices.some(item => /\p{L}{14,}/u.test(item[language] || item.label || ''))
    return <section className="discovery-subcategories is-inline" ref={navigationRef} tabIndex={navigationRef ? -1 : undefined} lang={language} aria-labelledby={`${listId}-title`} aria-busy={loading}>
      <header className="inline-subcategories-header">
        <h2 id={`${listId}-title`}>{copy.services}</h2>
      </header>
      <ul className="inline-service-grid" id={listId} data-long-label={needsWideLabels ? 'true' : undefined}>
        {choices.map(item => <li key={item.id}><button type="button" className="inline-service-tile" aria-pressed={selected === item.id} onClick={() => onSelect(item.id)}>
          <span className="inline-service-photo-frame" style={discoveryTilePhotoStyle(item.photo)} aria-hidden="true"><SubcategoryPhoto src={item.photo}/></span>
          <span className="inline-service-caption"><span className="inline-service-label">{item[language] || item.label}</span>{Number.isFinite(item.count) && item.count > 0 && <span className="inline-service-count">{item.count} {item.count === 1 ? copy.business : copy.businesses}</span>}</span>
          <span className="inline-tile-chevron" aria-hidden="true"><Icon name="chevronDown"/></span>
          {selected === item.id && <span className="inline-tile-check" aria-hidden="true"><Icon name="check"/></span>}
        </button></li>)}
      </ul>
      {loading && <>
        <p className="inline-services-loading" role="status">{copy.loading}</p>
        <div className="inline-services-skeleton" aria-hidden="true"><div className="inline-service-skeleton"/><div className="inline-service-skeleton"/></div>
      </>}
    </section>
  }
  if (!category || (!choices.length && !selected)) return null
  const first = choices.slice(0, collapsedLimit), selectedItem = choices.find(item => item.id === selected)
  if (selectedItem && !first.some(item => item.id === selected)) first[first.length - 1] = selectedItem
  const visible = expanded ? choices : first
  const extra = choices.length - first.length
  return <section className="discovery-subcategories" ref={navigationRef} tabIndex={navigationRef ? -1 : undefined} lang={locale} aria-label={en ? `${title} subcategories` : `Подкатегории · ${title}`} aria-busy={loading}>
    <h3 className="sr-only">{title}</h3>
    {choices.length > 0 ? <ul className="discovery-subcategory-grid" id={listId}>{visible.map(item => <li key={item.id}><button type="button" className="discovery-subcategory-option" aria-pressed={selected === item.id} disabled={loading} onClick={() => onSelect(item.id)}><SubcategoryPhoto src={item.photo}/><span>{item[locale] || item.label}</span></button></li>)}</ul> : selectedLabel && <p className="discovery-subcategory-selected">{en ? 'Selected: ' : 'Избрано: '}{selectedLabel}</p>}
    <div className="discovery-subcategory-controls">
      {extra > 0 && <button type="button" className="discovery-subcategory-more" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)}>{expanded ? (en ? 'Show less' : 'По-малко') : (en ? `More (${extra})` : `Още (${extra})`)}<Icon name="chevronDown"/></button>}
      <button type="button" className="discovery-subcategory-all" aria-pressed={!selected} disabled={loading} onClick={() => onSelect('')}>{en ? 'All' : 'Всички'}</button>
    </div>
  </section>
}
