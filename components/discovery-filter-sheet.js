'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'
import { DISCOVERY_CATEGORIES } from '../lib/discovery/categories.mjs'
import { DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { defaultHomeFilters, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { neighborhoodChoices } from '../lib/discovery/intent.mjs'
import { BULGARIAN_CITIES } from '../lib/business-location.mjs'
import { containDialogTab } from '../lib/dialog-focus.mjs'

const cities = [...BULGARIAN_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
const duplicateNames = new Set(cities.filter((city, index) => cities.findIndex(other => other.name === city.name) !== index).map(city => city.name))

export function DiscoveryFilterSheet({ initialValues, locale, onApply, onClose, triggerRef, id }) {
  const copy = HOME_DISCOVERY_COPY[locale], searchCopy = DISCOVERY_COPY[locale], en = locale === 'en'
  const [draft, setDraft] = useState(initialValues), dialog = useRef(null)
  useEffect(() => {
    const node = dialog.current, overflow = document.body.style.overflow
    node.showModal(); document.body.style.overflow = 'hidden'
    node.querySelector('select')?.focus()
    return () => { node.close(); document.body.style.overflow = overflow; triggerRef.current?.focus() }
  }, [triggerRef])
  const change = (key, value) => setDraft(current => ({ ...current, [key]: value, reset: false, ...(key === 'cityCode' ? { neighborhood: '' } : {}) }))
  return <dialog id={id} ref={dialog} className="discovery-filter-sheet" aria-labelledby={`${id}-title`} onKeyDown={event => containDialogTab(event, event.currentTarget)} onCancel={onClose} onClick={event => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}>
    <form onSubmit={event => { event.preventDefault(); onApply(draft) }}>
      <header><h2 id={`${id}-title`}>{copy.filters}</h2><button type="button" onClick={onClose} aria-label={copy.close}><Icon name="close"/></button></header>
      <div className="home-filter-fields">
        <label>{searchCopy.city}<select value={draft.cityCode} onChange={event => change('cityCode', event.target.value)}>{!draft.cityCode && <option value="">{initialValues.nearby ? searchCopy.nearby : searchCopy.anyCity}</option>}{cities.map(city => <option value={city.code} key={city.code}>{en ? city.nameEn : city.name}{duplicateNames.has(city.name) ? ` · ${city.region}` : ''}</option>)}</select></label>
        <label>{searchCopy.neighborhood}<select value={draft.neighborhood} disabled={!draft.cityCode} onChange={event => change('neighborhood', event.target.value)}><option value="">{searchCopy.anyNeighborhood}</option>{neighborhoodChoices(draft.cityCode).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>{en ? 'Category' : 'Категория'}<select value={draft.category} onChange={event => change('category', event.target.value)}><option value="">{en ? 'From my description' : 'От описанието'}</option>{DISCOVERY_CATEGORIES.map(category => <option key={category.id} value={category.id}>{category[locale]}</option>)}</select></label>
        <label>{searchCopy.radius}<select value={draft.radiusKm} onChange={event => change('radiusKm', Number(event.target.value))}>{DISCOVERY_RADIUS_CHOICES.map(radius => <option key={radius} value={radius}>{radius} km</option>)}</select></label>
      </div>
      <footer><button className="home-filter-reset" type="button" onClick={() => setDraft({ ...defaultHomeFilters(), reset: true })}>{copy.reset}</button><button className="home-filter-apply" type="submit">{copy.apply}<Icon name="check"/></button></footer>
    </form>
  </dialog>
}
