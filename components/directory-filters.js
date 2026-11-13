'use client'

import { Icon } from './icon'
import { BrandLoading } from './brand-loading'
import { changeDirectoryFilter, directoryChoices } from '../lib/directory.mjs'

export function DirectoryFilters({ rows, filters, onChange, locale, loading = false, hero = false }) {
  const en = locale === 'en', choices = directoryChoices(rows,filters,locale)
  const update = (field,value) => onChange(changeDirectoryFilter(filters,field,value))
  return <div className={`directory-selects ${hero ? 'hero-directory-picker' : ''}`}>
    <label><span><Icon name="scissors"/>{en ? 'Service' : 'Услуга'}{loading && <BrandLoading size={16} locale={locale}/>}</span><select disabled={loading} value={filters.service} onChange={event => update('service',event.target.value)}><option value="">{en ? 'All services' : 'Всички услуги'}</option>{choices.services.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label><span><Icon name="pin"/>{en ? 'City / town' : 'Населено място'}</span><select disabled={loading} value={filters.city} onChange={event => update('city',event.target.value)}><option value="">{en ? 'All locations' : 'Всички населени места'}</option>{choices.cities.map(city => <option key={city} value={city}>{city}</option>)}</select></label>
    <label><span><Icon name="house"/>{en ? 'Neighbourhood' : 'Квартал'}</span><select disabled={loading || !filters.city || !choices.neighborhoods.length} value={filters.neighborhood} onChange={event => update('neighborhood',event.target.value)}><option value="">{!filters.city ? (en ? 'Choose a location first' : 'Първо избери населено място') : !choices.neighborhoods.length ? (en ? 'No neighbourhoods listed' : 'Няма посочени квартали') : (en ? 'All neighbourhoods' : 'Всички квартали')}</option>{choices.neighborhoods.map(neighborhood => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}</select></label>
  </div>
}
