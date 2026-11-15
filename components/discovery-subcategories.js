'use client'

import { useEffect, useId, useState } from 'react'
import { Icon } from './icon'

const localPhoto = source => typeof source === 'string' && /^\/service-photos\/[a-z0-9-]+\.webp$/.test(source)

function SubcategoryPhoto({ src }) {
  const [failed, setFailed] = useState(null)
  // A failed image never becomes an unrelated activity or platform emoji.
  return src && failed !== src ? <img className="discovery-subcategory-photo" src={src} width={40} height={40} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)}/> : <span className="discovery-subcategory-photo is-unavailable" aria-hidden="true"/>
}

export function DiscoverySubcategories({ category, title, options = [], selected = '', selectedLabel = '', locale = 'bg', loading = false, onSelect }) {
  const listId = useId(), [expanded, setExpanded] = useState(false), en = locale === 'en'
  useEffect(() => setExpanded(false), [category])
  const choices = options.filter(item => item.category === category && typeof item.id === 'string' && localPhoto(item.photo) && (!Number.isFinite(item.count) || item.count > 0))
  if (!category || (!choices.length && !selected)) return null
  const first = choices.slice(0, 4), selectedItem = choices.find(item => item.id === selected)
  if (selectedItem && !first.some(item => item.id === selected)) first[first.length - 1] = selectedItem
  const visible = expanded ? choices : first
  const extra = choices.length - first.length
  return <section className="discovery-subcategories" aria-label={en ? `${title} subcategories` : `Подкатегории · ${title}`} aria-busy={loading}>
    <h3 className="sr-only">{title}</h3>
    {choices.length > 0 ? <ul className="discovery-subcategory-grid" id={listId}>{visible.map(item => <li key={item.id}><button type="button" className="discovery-subcategory-option" aria-pressed={selected === item.id} disabled={loading} onClick={() => onSelect(item.id)}><SubcategoryPhoto src={item.photo}/><span>{item[locale] || item.label}</span></button></li>)}</ul> : selectedLabel && <p className="discovery-subcategory-selected">{en ? 'Selected: ' : 'Избрано: '}{selectedLabel}</p>}
    <div className="discovery-subcategory-controls">
      <button type="button" className="discovery-subcategory-all" aria-pressed={!selected} disabled={loading} onClick={() => onSelect('')}>{en ? 'All' : 'Всички'}</button>
      {extra > 0 && <button type="button" className="discovery-subcategory-more" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(value => !value)}>{expanded ? (en ? 'Show less' : 'По-малко') : (en ? `More (${extra})` : `Още (${extra})`)}<Icon name="chevronDown"/></button>}
    </div>
  </section>
}
