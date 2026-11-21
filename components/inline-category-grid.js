'use client'

import { useId, useState } from 'react'
import { Icon } from './icon'
import { discoveryTilePhotoStyle } from './discovery-tile-photo-style.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

function CategoryPhoto({ category }) {
  const [failed, setFailed] = useState(null)
  const source = category.photo2x
  return failed !== source ? <img className="inline-category-photo" src={source} srcSet={`${category.photo} 160w, ${category.photo2x} 240w`} sizes="(max-width:699px)50vw,(max-width:999px)33vw,280px" width={240} height={240} alt="" loading="lazy" decoding="async" onError={() => setFailed(source)}/> : <span className="inline-category-photo is-unavailable" aria-hidden="true"/>
}

// A persistent presentation of the existing fourteen category identifiers.
// Selection/toggling belongs to the search parent; this grid never navigates.
export function InlineCategoryGrid({ locale = 'bg', category = '', onSelect }) {
  const language = locale === 'en' ? 'en' : 'bg'
  const copy = INLINE_DISCOVERY_COPY[language], titleId = useId()
  return <section className="inline-discovery-categories" lang={language} aria-labelledby={titleId}>
    <h2 id={titleId}>{copy.categories}</h2>
    <ul className="inline-category-grid">{homeCategories(language).map(item => {
      const label = categoryById(item.id)?.[language] || item[language]
      return <li key={item.id}><button type="button" className="inline-category-option" aria-pressed={category === item.id} onClick={() => onSelect(item.id)}>
        <span className="inline-category-photo-frame" style={discoveryTilePhotoStyle(item.photo)} aria-hidden="true"><CategoryPhoto category={item}/></span>
        <span className="inline-category-caption"><span className="inline-category-label">{label}</span></span>
        <span className="inline-tile-chevron" aria-hidden="true"><Icon name="chevronDown"/></span>
        {category === item.id && <span className="inline-tile-check" aria-hidden="true"><Icon name="check"/></span>}
      </button></li>
    })}</ul>
  </section>
}
