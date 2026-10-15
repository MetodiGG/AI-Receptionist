'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { cityLabel, findCity, NEIGHBOURHOODS, searchCities, transliterate } from '../lib/business-location.mjs'

function CheckedSelect({ label, value, options, onChange, placeholder, searchLabel, empty, required = false }) {
  const id = useId()
  const details = useRef(null)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const filtered = options.filter((option) => option.value === '__custom__' || `${option.label} ${option.search || ''}`.toLocaleLowerCase('bg').includes(query.trim().toLocaleLowerCase('bg')))
  useEffect(() => {
    const close = (event) => { if (details.current && !details.current.contains(event.target)) details.current.open = false }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  return <div className="location-field"><span className="location-label" id={`${id}-label`}>{label}{required ? ' *' : ''}</span><details className="checked-select" ref={details} onToggle={(event) => { if (!event.currentTarget.open) setQuery('') }} onKeyDown={(event) => { if (event.key === 'Escape') { details.current.open = false; details.current.querySelector('summary').focus() } }}>
    <summary aria-labelledby={`${id}-label ${id}-value`}><span id={`${id}-value`}>{selected?.label || placeholder}</span><span aria-hidden="true">⌄</span></summary>
    <div className="checked-select-panel"><input type="search" aria-label={searchLabel} placeholder={searchLabel} value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" /><fieldset><legend className="visually-hidden">{label}</legend>{filtered.map((option) => <label className={`checked-option ${value === option.value ? 'chosen' : ''}`} key={option.value}><input type="radio" name={id} value={option.value} checked={value === option.value} onChange={() => { onChange(option.value); details.current.open = false; details.current.querySelector('summary').focus() }} /><span className="selection-check" aria-hidden="true">{value === option.value && <Icon name="check" />}</span><span>{option.label}</span></label>)}{!filtered.length && <p>{empty}</p>}</fieldset></div>
  </details></div>
}

export function BusinessLocationFields({ cityCode = '', neighborhood = '', onChange, locale = 'bg', required = false }) {
  const en = locale === 'en'
  const [custom, setCustom] = useState(false)
  const city = findCity(cityCode)
  const areas = NEIGHBOURHOODS[cityCode] || []
  const known = areas.includes(neighborhood)
  const customArea = custom || Boolean(neighborhood && !known)
  const cityOptions = searchCities('', locale).map((item) => ({ value: item.code, label: cityLabel(item, locale), search: `${item.name} ${item.nameEn} ${item.region} ${item.code}` }))
  const areaOptions = [{ value: '', label: en ? 'No neighbourhood specified' : 'Без избран квартал' }, ...areas.map((area) => ({ value: area, label: en ? transliterate(area) : area, search: area })), { value: '__custom__', label: en ? 'Other — enter a neighbourhood' : 'Друг — въведи квартал' }]
  return <div className="business-location-fields">
    <CheckedSelect label={en ? 'City in Bulgaria' : 'Град в България'} value={cityCode} options={cityOptions} required={required} placeholder={en ? 'Choose a city' : 'Избери град'} searchLabel={en ? 'Search all 257 cities…' : 'Търси сред всички 257 града…'} empty={en ? 'No matching city.' : 'Няма намерен град.'} onChange={(value) => { setCustom(false); onChange({ city_ekatte: value, neighborhood: '' }) }} />
    {city && <CheckedSelect label={en ? 'Neighbourhood / area (optional)' : 'Квартал / район (незадължително)'} value={customArea ? '__custom__' : neighborhood} options={areaOptions} placeholder={en ? 'Choose a neighbourhood' : 'Избери квартал'} searchLabel={en ? 'Search neighbourhoods…' : 'Търси квартал…'} empty={en ? 'Choose Other to enter a missing neighbourhood.' : 'Избери „Друг“, за да въведеш липсващ квартал.'} onChange={(value) => { setCustom(value === '__custom__'); onChange({ neighborhood: value === '__custom__' ? '' : value }) }} />}
    {city && customArea && <label className="location-field"><span>{en ? 'Neighbourhood name' : 'Име на квартала'}</span><input value={neighborhood} maxLength={120} onChange={(event) => onChange({ neighborhood: event.target.value })} placeholder={en ? 'Enter your neighbourhood' : 'Въведи своя квартал'} /></label>}
    <small className="location-source">{en ? 'City list: ' : 'Градове: '}<a href="https://www.nsi.bg/nrnm/ekatte/territorial-units" target="_blank" rel="noreferrer">{en ? 'NSI / EKATTE' : 'НСИ / ЕКАТТЕ'}</a>. {en ? 'Neighbourhood suggestions are not exhaustive; use Other if yours is missing.' : 'Кварталите са предложения; ако твоят липсва, избери „Друг“.'}</small>
  </div>
}
