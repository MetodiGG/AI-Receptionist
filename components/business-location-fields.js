'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from './icon'
import { cityLabel, findCity, NEIGHBOURHOODS, normalizeLocationQuery, searchCities, transliterate } from '../lib/business-location.mjs'

function CheckedSelect({ label, value, options, onChange, placeholder, searchLabel, empty, required = false, searchOptions }) {
  const id = useId()
  const root = useRef(null)
  const input = useRef(null)
  const panel = useRef(null)
  const list = useRef(null)
  const optionRefs = useRef([])
  const restoringFocus = useRef(false)
  const previousValue = useRef(value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => searchOptions ? searchOptions(query) : options.filter((option) =>
    option.value === '__custom__' || normalizeLocationQuery(`${option.label} ${option.search || ''}`).includes(normalizeLocationQuery(query))), [options, query, searchOptions])
  const active = filtered[activeIndex]
  const close = (restoreFocus = false) => {
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
    if (restoreFocus) {
      restoringFocus.current = true
      input.current?.focus()
      restoringFocus.current = false
    }
  }
  const show = () => {
    setQuery('')
    setActiveIndex(options.findIndex((option) => option.value === value))
    setOpen(true)
  }
  const choose = (option) => {
    // Typed text is a search query, never a new option or an arbitrary city.
    if (!option || !options.some((item) => item.value === option.value)) return
    onChange(option.value)
    close(true)
  }
  const keyDown = (event) => {
    if (event.isComposing || event.nativeEvent?.isComposing) return
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      close(true)
    } else if (event.key === 'Tab') {
      // Let the browser (or an enclosing dialog) perform normal focus travel.
      close()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        show()
        const initial = options.findIndex((option) => option.value === value)
        setActiveIndex(initial >= 0 ? initial : event.key === 'ArrowDown' ? 0 : options.length - 1)
      } else {
        setActiveIndex((index) => event.key === 'ArrowDown'
          ? Math.min(index + 1, filtered.length - 1)
          : index < 0 ? filtered.length - 1 : Math.max(0, index - 1))
      }
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open) choose(active || filtered[0])
      else show()
    }
  }
  useEffect(() => {
    const outside = (event) => {
      if (root.current && !root.current.contains(event.target)) {
        setOpen(false)
        setQuery('')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [])
  useEffect(() => { if (open) input.current?.focus() }, [open])
  useEffect(() => {
    // Filtering a previously scrolled list must reveal the new first result,
    // rather than retaining a clamped scroll position near its bottom.
    if (open) {
      if (list.current) list.current.scrollTop = 0
      if (panel.current) panel.current.scrollTop = 0
    }
  }, [open, query])
  useEffect(() => {
    if (open && activeIndex >= 0) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeIndex, query])
  useEffect(() => {
    // The first passive effect can run after an early hydrated input event.
    // Only a real controlled selection change should discard that query.
    if (previousValue.current === value) return
    previousValue.current = value
    setOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }, [value])
  return <div className="location-field"><span className="location-label" id={`${id}-label`}>{label}{required ? ' *' : ''}</span>
    <div className="checked-select" ref={root} data-open={open ? 'true' : 'false'} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close() }}>
      <div className="checked-select-control">
        <span className="checked-select-search-icon" aria-hidden="true"><Icon name="search" /></span>
        <input ref={input} type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-options` : undefined} aria-activedescendant={open && active ? `${id}-option-${activeIndex}` : undefined} aria-labelledby={`${id}-label`} aria-required={required || undefined} aria-describedby={open ? `${id}-search-hint` : undefined} value={open ? query : selected?.label || ''} placeholder={open ? searchLabel : placeholder} autoComplete="off" autoCapitalize="none" spellCheck={false} inputMode="search" onFocus={() => { if (!open && !restoringFocus.current) show() }} onClick={() => { if (!open) show() }} onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1) }} onKeyDown={keyDown} />
        <button className="checked-select-toggle" type="button" tabIndex={-1} aria-label={searchLabel} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-options` : undefined} onMouseDown={(event) => event.preventDefault()} onClick={() => open ? close(true) : show()}><Icon name="chevronDown" /></button>
      </div>
      {open && <div className="checked-select-panel" ref={panel}>
        <span id={`${id}-search-hint`} className="visually-hidden">{searchLabel}</span>
        <ul className="checked-select-options" ref={list} id={`${id}-options`} role="listbox" aria-labelledby={`${id}-label`}>
          {filtered.map((option, index) => <li role="presentation" key={option.value}><button type="button" role="option" tabIndex={-1} id={`${id}-option-${index}`} ref={(element) => { optionRefs.current[index] = element }} className={`checked-option${value === option.value ? ' chosen' : ''}${activeIndex === index ? ' active' : ''}`} aria-selected={value === option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(option)}><span className="selection-check" aria-hidden="true">{value === option.value && <Icon name="check" />}</span><span>{option.label}</span></button></li>)}
        </ul>
        {!filtered.length && <p role="status">{empty}</p>}
      </div>}
    </div>
  </div>
}

export function BusinessLocationFields({ cityCode = '', neighborhood = '', onChange, locale = 'bg', required = false, neighborhoodRequired = false }) {
  const en = locale === 'en'
  const [custom, setCustom] = useState(false)
  const city = findCity(cityCode)
  const areas = NEIGHBOURHOODS[cityCode] || []
  const known = areas.includes(neighborhood)
  const customArea = custom || Boolean(neighborhood && !known)
  const cityOptions = useMemo(() => searchCities('', locale).map((item) => ({ value: item.code, label: cityLabel(item, locale) })), [locale])
  const searchCityOptions = useCallback((query) => searchCities(query, locale).map((item) => ({ value: item.code, label: cityLabel(item, locale) })), [locale])
  const areaOptions = [...(neighborhoodRequired ? [] : [{ value: '', label: en ? 'No neighbourhood specified' : 'Без избран квартал' }]), ...areas.map((area) => ({ value: area, label: en ? transliterate(area) : area, search: area })), { value: '__custom__', label: en ? 'Other — enter a neighbourhood' : 'Друг — въведи квартал' }]
  return <div className="business-location-fields">
    <CheckedSelect label={en ? 'City in Bulgaria' : 'Град в България'} value={cityCode} options={cityOptions} searchOptions={searchCityOptions} required={required} placeholder={en ? 'Choose a city' : 'Избери град'} searchLabel={en ? 'Search all 257 cities…' : 'Търси сред всички 257 града…'} empty={en ? 'No matching city.' : 'Няма намерен град.'} onChange={(value) => { if (!findCity(value)) return; setCustom(false); onChange({ city_ekatte: value, neighborhood: '' }) }} />
    {city && <CheckedSelect required={neighborhoodRequired} label={neighborhoodRequired ? (en ? 'Neighbourhood / area' : 'Квартал / район') : (en ? 'Neighbourhood / area (optional)' : 'Квартал / район (незадължително)')} value={customArea ? '__custom__' : neighborhood} options={areaOptions} placeholder={en ? 'Choose a neighbourhood' : 'Избери квартал'} searchLabel={en ? 'Search neighbourhoods…' : 'Търси квартал…'} empty={en ? 'Choose Other to enter a missing neighbourhood.' : 'Избери „Друг“, за да въведеш липсващ квартал.'} onChange={(value) => { setCustom(value === '__custom__'); onChange({ neighborhood: value === '__custom__' ? '' : value }) }} />}
    {city && customArea && <label className="location-field"><span>{en ? 'Neighbourhood name' : 'Име на квартала'}{neighborhoodRequired ? ' *' : ''}</span><input required={neighborhoodRequired} aria-required={neighborhoodRequired || undefined} value={neighborhood} maxLength={120} onChange={(event) => onChange({ neighborhood: event.target.value })} placeholder={en ? 'Enter your neighbourhood' : 'Въведи своя квартал'} /></label>}
  </div>
}
