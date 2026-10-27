'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTime } from 'luxon'
import { Icon } from './icon'
import { BULGARIAN_CITIES } from '../lib/business-location.mjs'
import { DISCOVERY_CATEGORIES, categoryById } from '../lib/discovery/categories.mjs'
import { neighborhoodChoices } from '../lib/discovery/intent.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { clearDiscoveryDraft, peekDiscoveryDraft, setDiscoveryDraft } from '../lib/discovery/draft.mjs'
import { GoogleDiscoveryList } from './google-discovery-list'

const cities = [...BULGARIAN_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
const duplicateCityNames = new Set(cities.filter((city, index) => cities.findIndex(other => other.name === city.name) !== index).map(city => city.name))
const shortcuts = ['barber', 'nails', 'car_wash', 'pets', 'fitness', 'education']
export function DiscoverySearch({ locale = 'bg', compact = false, preview = false }) {
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', router = useRouter()
  const Title = compact ? 'h2' : 'h1'
  const [initial] = useState(() => compact ? null : peekDiscoveryDraft())
  const [query, setQuery] = useState(initial?.query || ''), [category, setCategory] = useState(initial?.category || '')
  const [cityCode, setCityCode] = useState(initial?.cityCode || ''), [neighborhood, setNeighborhood] = useState(initial?.neighborhood || '')
  const [radiusKm, setRadius] = useState(initial?.radiusKm || 5), [coordinates, setCoordinates] = useState(initial?.coordinates || null)
  const [locating, setLocating] = useState(false), [locationError, setLocationError] = useState(''), [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null), [error, setError] = useState(''), [source, setSource] = useState('all'), [settledQuery, setSettledQuery] = useState(query)
  const controller = useRef(null), resultHeading = useRef(null), inFlight = useRef(false), mounted = useRef(true)
  useEffect(() => { const timer = setTimeout(() => setSettledQuery(query), 350); return () => clearTimeout(timer) }, [query])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort() } }, [])
  useEffect(() => {
    if (!initial || compact) return
    // Deferring one tick avoids a billable duplicate in React Strict Mode.
    const timer = setTimeout(() => { clearDiscoveryDraft(); void search(initial) }, 0)
    return () => clearTimeout(timer)
    // Initial navigation is consumed once, not every locale/filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, compact])

  function payload() { return { query: query.trim(), locale, radiusKm, ...(category ? { category } : {}), ...(cityCode ? { cityCode } : {}), ...(neighborhood ? { neighborhood } : {}), ...(coordinates ? { coordinates } : {}) } }
  async function search(input = payload()) {
    if (inFlight.current) return
    inFlight.current = true; setLoading(true); setError(''); setResult(null); setSource('all')
    const abort = new AbortController(); controller.current?.abort(); controller.current = abort
    const timer = setTimeout(() => abort.abort(), 20000)
    try {
      const response = await fetch(preview ? '/dev/discovery/search' : '/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: abort.signal, body: JSON.stringify(input) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.code || 'SEARCH_UNAVAILABLE')
      if (!Array.isArray(data.results) || typeof data.externalStatus !== 'string') throw new Error('SEARCH_UNAVAILABLE')
      if (mounted.current && !abort.signal.aborted) { setResult(data); requestAnimationFrame(() => resultHeading.current?.focus({ preventScroll: true })) }
    } catch (failure) { if (mounted.current) setError(failure.message === 'RATE_LIMITED' ? 'RATE_LIMITED' : failure.message === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'SEARCH_UNAVAILABLE') }
    finally { clearTimeout(timer); inFlight.current = false; if (mounted.current) setLoading(false) }
  }
  function submit(event) {
    event.preventDefault()
    if (query.trim().length < 2 || loading || locating) return
    if (compact) { setDiscoveryDraft(payload()); router.push(`/search?lang=${locale}`) }
    else void search()
  }
  function locate() {
    if (locating || loading) return
    setLocating(true); setLocationError('')
    if (!navigator.geolocation) { setLocating(false); setLocationError(copy.locationDenied); return }
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current) return
      const { latitude, longitude } = position.coords
      setLocating(false)
      if (latitude < 41 || latitude > 44.5 || longitude < 22 || longitude > 29) { setLocationError(copy.locationDenied); return }
      setCoordinates({ latitude, longitude, consent: true }); setCityCode(''); setNeighborhood('')
    }, () => { if (mounted.current) { setLocating(false); setLocationError(copy.locationDenied) } }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 })
  }
  const rows = result?.results.filter(row => source === 'all' || row.source === source) || []
  const status = result?.externalStatus
  const externalNotice = status === 'quota' ? copy.quota : status === 'unavailable' ? copy.unavailable : ['disabled', 'not_configured'].includes(status) ? copy.disabled : ''
  return <section className={`discovery-search ${compact ? 'discovery-compact' : ''}`} aria-labelledby={compact ? 'home-discovery-title' : 'discovery-title'}>
    <header><span className="discovery-eyebrow"><Icon name="spark"/>GoRez AI Search</span><Title id={compact ? 'home-discovery-title' : 'discovery-title'}>{copy.title}</Title></header>
    {preview && <p className="discovery-notice discovery-test" role="note">{copy.mock}</p>}
    <form className="discovery-form" onSubmit={submit}>
      <div className="discovery-query"><label className="sr-only" htmlFor={compact ? 'home-ai-query' : 'ai-query'}>{copy.title}</label><input id={compact ? 'home-ai-query' : 'ai-query'} value={query} maxLength={300} placeholder={copy.placeholder} autoComplete="off" enterKeyHint="search" onChange={event => setQuery(event.target.value)} required minLength={2} aria-describedby="discovery-query-help"/><button className="discovery-submit" aria-label={loading ? copy.searching : copy.search} disabled={loading || locating || query.trim().length < 2} type="submit">{loading ? <span className="button-spinner"/> : <Icon name="arrow"/>}<span>{copy.search}</span></button></div>
      <div className="discovery-shortcuts" aria-label={en ? 'Service shortcuts' : 'Категории услуги'}>{shortcuts.map(id => { const item = categoryById(id); return <button key={id} type="button" className={category === id ? 'selected' : ''} aria-pressed={category === id} onClick={() => { setCategory(category === id ? '' : id); if (!query.trim()) setQuery(item[locale]) }}><Icon name={item.icon}/>{item[locale]}</button> })}</div>
      <div className="discovery-controls">
        <label><span>{copy.city}</span><select value={cityCode} disabled={loading} onChange={event => { setCityCode(event.target.value); setNeighborhood(''); setCoordinates(null) }}><option value="">{copy.anyCity}</option>{cities.map(city => <option key={city.code} value={city.code}>{en ? city.nameEn : city.name}{duplicateCityNames.has(city.name) ? ` · ${city.region}` : ''}</option>)}</select></label>
        {!compact && <label><span>{copy.neighborhood}</span><select value={neighborhood} disabled={!cityCode || loading} onChange={event => setNeighborhood(event.target.value)}><option value="">{copy.anyNeighborhood}</option>{neighborhoodChoices(cityCode).map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
        <button className={`discovery-location ${coordinates ? 'selected' : ''}`} type="button" disabled={loading || locating} onClick={coordinates ? () => setCoordinates(null) : locate} aria-label={coordinates ? copy.clearLocation : copy.nearby}><Icon name="pin"/>{locating ? copy.locating : coordinates ? copy.locationSet : copy.nearby}</button>
      </div>
      {!compact && <div className="discovery-refine"><label>{en ? 'Category' : 'Категория'}<select value={category} disabled={loading} onChange={event => setCategory(event.target.value)}><option value="">{en ? 'From my description' : 'От описанието'}</option>{DISCOVERY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item[locale]}</option>)}</select></label><label>{copy.radius}<select value={radiusKm} disabled={loading || !coordinates} onChange={event => setRadius(Number(event.target.value))}>{[1, 3, 5, 10, 25].map(radius => <option key={radius} value={radius}>{radius} km</option>)}</select></label></div>}
      {!compact && !coordinates && <p className="discovery-help">{en ? 'Radius applies when you use Near me. Otherwise we search the selected city or neighbourhood.' : 'Радиусът важи при „Около мен“. Иначе търсим в избраното населено място или квартал.'}</p>}
      <p className="discovery-help" id="discovery-query-help">{copy.privacy} {coordinates || locating ? copy.locationInfo : ''}</p>
      {locationError && <p className="discovery-notice" role="status">{copy.locationDenied}</p>}
      <span className="sr-only" aria-live="polite">{settledQuery.length >= 2 && !loading ? (en ? 'Press Find to search.' : 'Натисни Намери за търсене.') : ''}</span>
    </form>
    {!compact && <div className="discovery-results" aria-busy={loading}>
      <h2 ref={resultHeading} tabIndex={-1} className="discovery-results-title">{copy.results}{result && !result.clarification ? ` · ${result.results.length}${result.external ? ' + Google Maps' : ''}` : ''}</h2>
      {loading && <div className="discovery-loading" role="status"><span className="button-spinner"/><p>{copy.searching}</p><div className="discovery-skeleton"><i/><i/></div></div>}
      {error && <p className="discovery-notice" role="alert">{error === 'RATE_LIMITED' ? copy.rate : error === 'VALIDATION_ERROR' ? copy.invalid : copy.error}</p>}
      {!loading && !result && !error && <div className="discovery-start"><Icon name="calendarSearch"/><h3>{copy.start}</h3><p>{copy.startHint}</p></div>}
      {result?.clarification && <p className="discovery-clarification" role="status"><Icon name="chat"/>{result.clarification.message}</p>}
      {result && !result.clarification && <>
        <div className="discovery-understood"><small>{copy.parsed} · {result.interpretation === 'model' ? copy.model : copy.rules}</small><div>{[categoryById(result.intent.category)?.[locale], result.intent.city, result.intent.neighborhood, result.intent.date, result.intent.timeFrom ? `≥ ${result.intent.timeFrom}` : '', result.intent.timeTo ? `≤ ${result.intent.timeTo}` : '', result.intent.budget ? `≤ ${result.intent.budget.max} ${result.intent.budget.currency}` : ''].filter(Boolean).map((value, index) => <span key={index}>{value}</span>)}</div>{result.intent.requirements?.includes('after_work_17') && <p>{copy.afterWork}</p>}{result.intent.requirements?.some(item => item !== 'after_work_17') && <p>{copy.preferences}</p>}</div>
        {externalNotice && <p className="discovery-notice" role="status">{externalNotice}</p>}
        {result.warnings.includes('internal_unavailable') && <p className="discovery-notice" role="status">{copy.internalUnavailable}</p>}
        {result.warnings.includes('matching_unavailable') && <p className="discovery-notice" role="status">{copy.matchingUnavailable}</p>}
        <div className="discovery-source-tabs" role="group" aria-label={en ? 'Result sources' : 'Източници на резултатите'}>{[['all', copy.all], ['gorez', copy.partners], ['google', copy.google]].map(([key, label]) => <button type="button" key={key} aria-pressed={source === key} className={source === key ? 'selected' : ''} onClick={() => setSource(key)}>{label}</button>)}</div>
        <div className="discovery-cards">{rows.map(row => <DiscoveryCard key={`${row.source}:${row.id}`} row={row} locale={locale} preview={preview}/>)}</div>
        {result.external && <div hidden={source === 'gorez'}><GoogleDiscoveryList plan={result.external} locale={locale}/></div>}
        {!rows.length && !(result.external && source !== 'gorez') && <div className="discovery-start"><h3>{copy.empty}</h3><p>{copy.emptyHint}</p></div>}
        <details className="discovery-ranking"><summary>{copy.ranking}</summary><p>{copy.rankingHint}</p>{result.external && <p>{en ? 'Google Maps places are displayed separately in their provider order, not re-ranked by GoRez.' : 'Местата от Google Maps се показват отделно, в реда на доставчика, без пренареждане от GoRez.'}</p>}</details>
      </>}
      <Link className="discovery-catalog-link" href={`/businesses?lang=${locale}`}>{copy.catalog}<Icon name="arrow"/></Link>
    </div>}
  </section>
}

function GoogleAttribution({ rows = [] }) {
  return <div className="discovery-attribution"><span translate="no">Google Maps</span>{rows.map((row, index) => row.url ? <a key={index} href={row.url} target="_blank" rel="noopener noreferrer">{row.name}</a> : <span key={index}>{row.name}</span>)}</div>
}
export function DiscoveryCard({ row, locale, preview = false }) {
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', internal = row.source === 'gorez', category = categoryById(row.category)
  const href = `/book/${row.slug}?lang=${locale}`
  return <article className={`discovery-card ${internal ? 'discovery-partner' : 'discovery-external'}`}>
    <div className="discovery-card-top"><span className="discovery-card-symbol"><Icon name={category?.icon || 'store'}/></span><span className="discovery-source">{internal ? <><Icon name="check"/>{copy.partner}</> : <>{copy.external} <span translate="no">Google Maps</span></>}</span></div>
    <small className="discovery-category">{category?.[locale]}</small><h3>{row.name}</h3><p className="discovery-address"><Icon name="pin"/>{row.address || (en ? 'Address not supplied' : 'Няма посочен адрес')}{row.distanceKm !== null && <span> · {row.distanceKm} km</span>}</p>
    {internal ? <>
      <div className="discovery-services">{row.services.slice(0, 3).map(service => <div key={service.id}><span>{service.name}<small>{service.durationMin} {copy.minutes}</small></span><strong>{service.price == null ? copy.priceUnknown : new Intl.NumberFormat(en ? 'en-IE' : 'bg-BG', { style: 'currency', currency: service.currency }).format(service.price)}</strong></div>)}</div>
      {row.availability.status === 'verified' ? <div className="discovery-availability"><small><Icon name="clock"/>{copy.verified} · {row.availability.date}</small><div>{row.availability.slots.map((slot, index) => <span key={`${slot.startsAt}:${index}`}>{DateTime.fromISO(slot.startsAt).setZone(row.availability.timezone).toFormat('HH:mm')}</span>)}</div><p>{copy.recheck}</p></div> : <p className="discovery-availability-unknown"><Icon name="clock"/>{row.availability.status === 'none' ? copy.none : copy.seeTimes}</p>}
      {row.hours?.some(day => day.periods.length) && <details className="discovery-hours"><summary>{en ? 'Opening hours' : 'Работно време'}</summary>{row.hours.map(day => <div key={day.weekday}><span>{DateTime.fromISO('2026-10-26').plus({ days: day.weekday - 1 }).setLocale(locale).toFormat('cccc')}</span><span>{day.periods.join(', ') || (en ? 'Closed' : 'Почивен ден')}</span></div>)}</details>}
      {preview ? <span className="discovery-card-cta" aria-disabled="true">{en ? 'Test result · booking disabled' : 'Тестов резултат · без резервация'}</span> : <Link className="discovery-card-cta" href={href}>{copy.book}<Icon name="arrow"/></Link>}
    </> : <><p className="discovery-external-note">{copy.externalHint}</p><p className="discovery-availability-unknown"><Icon name="clock"/>{copy.unknown}</p><a className="discovery-card-cta" href={row.mapsUrl} target="_blank" rel="noopener noreferrer">{copy.maps}<Icon name="external"/></a><GoogleAttribution rows={row.attributions}/><details className="discovery-claim"><summary>{copy.claim}</summary><p>{copy.claimHint}</p><Link href={`/for-businesses?lang=${locale}`}>{en ? 'Start application' : 'Към регистрацията'}</Link></details></>}
  </article>
}
