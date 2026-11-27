'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { discoveryTilePhotoStyle } from './discovery-tile-photo-style.mjs'
import { categoryById } from '../lib/discovery/categories.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { INLINE_DISCOVERY_COPY } from '../lib/discovery/inline-copy.mjs'

const NARROW_CATEGORY_GRID = '(max-width:699px)'
const MOBILE_IMMEDIATE_PHOTOS = 8
// Transparent backing lets the existing reserved frame show through without a
// network request or a second category photograph.
const EMPTY_PHOTO = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function CategoryPhoto({ category, priority = false, deferOnMobile = false, selected = false }) {
  const [failed, setFailed] = useState(null)
  const [released, setReleased] = useState(false), pictureRef = useRef(null)
  const waiting = deferOnMobile && !selected && !released
  const source = category.photoLarge || category.photo2x
  const sources = `${category.photo} 160w, ${category.photo2x} 240w${category.photoLarge ? `, ${category.photoLarge} 640w` : ''}`
  useEffect(() => {
    if (selected && deferOnMobile && !released) setReleased(true)
    if (!waiting) return
    const media = window.matchMedia?.(NARROW_CATEGORY_GRID)
    const tile = pictureRef.current?.closest('button')
    if (!media?.matches || !tile || typeof window.IntersectionObserver !== 'function') {
      setReleased(true)
      return
    }
    const reveal = () => setReleased(true)
    // Native lazy loading can fetch nearly the whole grid on a limited
    // connection. Ask for the rest just before it reaches this viewport.
    const observer = new window.IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) reveal()
    }, { rootMargin: '160px 0px' })
    observer.observe(tile)
    if (tile === document.activeElement) reveal()
    else tile.addEventListener('focus', reveal, { once: true })
    tile.addEventListener('pointerdown', reveal, { once: true, passive: true })
    return () => {
      observer.disconnect()
      tile.removeEventListener('focus', reveal)
      tile.removeEventListener('pointerdown', reveal)
    }
  }, [deferOnMobile, released, selected, waiting])

  if (failed === source) return <span className="inline-category-photo is-unavailable" aria-hidden="true"/>
  const image = <img className="inline-category-photo" src={source} srcSet={sources} sizes="(max-width:699px)50vw,(max-width:999px)33vw,280px" width={240} height={category.photoHeight || 240} style={category.photoPosition ? { objectFit: 'cover', objectPosition: category.photoPosition } : undefined} alt="" loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" onError={event => {
    if (event?.currentTarget?.currentSrc?.startsWith('data:')) setReleased(true)
    else setFailed(source)
  }}/>
  // Preserve the original desktop src/srcset and keep the same image node
  // when the mobile source is released.
  return deferOnMobile ? <picture ref={pictureRef}>{waiting && <source media={`${NARROW_CATEGORY_GRID} and (scripting: enabled)`} srcSet={EMPTY_PHOTO}/>}{image}</picture> : image
}

// A persistent presentation of the existing fourteen category identifiers.
// Selection/toggling belongs to the search parent; this grid never navigates.
export function InlineCategoryGrid({ locale = 'bg', category = '', onSelect }) {
  const language = locale === 'en' ? 'en' : 'bg'
  const copy = INLINE_DISCOVERY_COPY[language], titleId = useId()
  return <section className="inline-discovery-categories" lang={language} aria-labelledby={titleId}>
    <h2 id={titleId}>{copy.categories}</h2>
    <ul className="inline-category-grid">{homeCategories(language).map((item, index) => {
      const label = categoryById(item.id)?.[language] || item[language]
      return <li key={item.id}><button type="button" className="inline-category-option" aria-pressed={category === item.id} onClick={() => onSelect(item.id)}>
        <span className="inline-category-photo-frame" style={discoveryTilePhotoStyle(item.photo)} aria-hidden="true"><CategoryPhoto category={item} priority={index < 2} deferOnMobile={index >= MOBILE_IMMEDIATE_PHOTOS} selected={category === item.id}/></span>
        <span className="inline-category-caption"><span className="inline-category-label">{label}</span></span>
        <span className="inline-tile-chevron" aria-hidden="true"><Icon name="chevronDown"/></span>
        {category === item.id && <span className="inline-tile-check" aria-hidden="true"><Icon name="check"/></span>}
      </button></li>
    })}</ul>
  </section>
}
