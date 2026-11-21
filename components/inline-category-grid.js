'use client'

import { useId, useState } from 'react'
import { categoryById } from '../lib/discovery/categories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

function CategoryPhoto({ category }) {
  const [failed, setFailed] = useState(null)
  return failed !== category.photo ? <img className="inline-category-photo" src={category.photo} srcSet={`${category.photo} 1x, ${category.photo2x} 2x`} width={80} height={80} alt="" loading="lazy" decoding="async" onError={() => setFailed(category.photo)}/> : <span className="inline-category-photo is-unavailable" aria-hidden="true"/>
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
        <span className="inline-category-photo-frame" aria-hidden="true"><CategoryPhoto category={item}/></span>
        <span className="inline-category-label">{label}</span>
      </button></li>
    })}</ul>
  </section>
}
