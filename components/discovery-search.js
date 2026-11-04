'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DateTime } from 'luxon'
import { Icon } from './icon'
import { BULGARIAN_CITIES } from '../lib/business-location.mjs'
import { DISCOVERY_CATEGORIES, categoryById } from '../lib/discovery/categories.mjs'
import { neighborhoodChoices } from '../lib/discovery/intent.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'
import { clearDiscoveryDraft, peekDiscoveryDraft, setDiscoveryDraft } from '../lib/discovery/draft.mjs'
import { DEFAULT_DISCOVERY_CITY, DISCOVERY_SHORTCUTS, discoveryCategorySelection, discoveryCitySelection, discoverySearchInput, requestDiscoveryLocation } from '../lib/discovery/search-ui.mjs'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { GoogleDiscoveryList } from './google-discovery-list'
import { DiscoveryRouteArt } from './discovery-route-art'
import { BusinessCategoryIcon } from './business-category-icon'
import { DiscoveryNearbyMore } from './discovery-nearby-more'
import { focusDiscoveryResults } from '../lib/discovery/results-navigation.mjs'
import { isExternalBooking } from '../lib/booking-mode.mjs'
import { OutboundBookingButton } from './outbound-booking-button'
import { ExternalPlaceBooking } from './external-place-booking'
import { validPlaceId } from '../lib/outbound-booking.mjs'

const cities = [...BULGARIAN_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
const duplicateCityNames = new Set(cities.filter((city, index) => cities.findIndex(other => other.name === city.name) !== index).map(city => city.name))
export function DiscoverySearch({ locale = 'bg', compact = false, preview = false, locationProvider = requestDiscoveryLocation }) {
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', router = useRouter()
  const Title = compact ? 'h2' : 'h1'
  const [initial] = useState(() => compact ? null : peekDiscoveryDraft())
  const initialInput = initial?.request || initial
  const [query, setQuery] = useState(initialInput?.query || ''), [category, setCategory] = useState(initialInput?.category || '')
  const [cityCode, setCityCode] = useState(initialInput?.cityCode || DEFAULT_DISCOVERY_CITY), [neighborhood, setNeighborhood] = useState(initialInput?.neighborhood || '')
  const [cityWasChosen, setCityWasChosen] = useState(initial?.cityWasChosen || false)
  const [radiusKm, setRadius] = useState(initialInput?.radiusKm ?? DEFAULT_DISCOVERY_RADIUS_KM), [coordinates, setCoordinates] = useState(initialInput?.coordinates || null)
  const [locating, setLocating] = useState(false), [locationError, setLocationError] = useState(''), [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null), [error, setError] = useState(''), [source, setSource] = useState('all'), [settledQuery, setSettledQuery] = useState(query)
  const controller = useRef(null), resultHeading = useRef(null), inFlight = useRef(false), locationInFlight = useRef(false), mounted = useRef(true)
  useEffect(() => { const timer = setTimeout(() => setSettledQuery(query), 350); return () => clearTimeout(timer) }, [query])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort() } }, [])
  useEffect(() => {
    if (compact || loading || (!result && !error)) return
    // After React commits the response: move to results/clarification/error,
    // not the loading shell. Typing and source filters never retrigger this.
    const frame = requestAnimationFrame(() => focusDiscoveryResults(resultHeading.current, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
    return () => cancelAnimationFrame(frame)
  }, [result, error, loading, compact])
  useEffect(() => {
    if (!initial || compact) return
    // Deferring one tick avoids a billable duplicate in React Strict Mode.
    const timer = setTimeout(() => { clearDiscoveryDraft(); void search(initialInput) }, 0)
    return () => clearTimeout(timer)
    // Initial navigation is consumed once, not every locale/filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, compact])

  function payload(patch = {}) { return discoverySearchInput({ query, locale, cityCode, cityWasChosen, neighborhood, category, coordinates, radiusKm, expandNearby: true, ...patch }) }
  function chooseCategory(id) {
    const selected = discoveryCategorySelection(query, id, locale)
    setCategory(selected.category); setQuery(selected.query); setResult(null); setError('')
    if (coordinates && selected.category) execute(payload(selected))
  }
  function execute(input) {
    if (compact) { setDiscoveryDraft({ request: input, cityWasChosen }); router.push(`/search?lang=${locale}`) }
    else void search(input)
  }
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
      if (mounted.current && !abort.signal.aborted) setResult(data)
    } catch (failure) { if (mounted.current) setError(failure.message === 'RATE_LIMITED' ? 'RATE_LIMITED' : failure.message === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'SEARCH_UNAVAILABLE') }
    finally { clearTimeout(timer); inFlight.current = false; if (mounted.current) setLoading(false) }
  }
  function submit(event) {
    event.preventDefault()
    if (query.trim().length < 2 || loading || locating) return
    execute(payload())
  }
  async function locate() {
    if (locationInFlight.current || loading) return
    if (coordinates) return // Already active: never toggle off, re-prompt or bill twice.
    locationInFlight.current = true
    setLocating(true); setLocationError('')
    try {
      const position = await locationProvider(navigator.geolocation, { secure: window.isSecureContext })
      if (!mounted.current) return
      setCoordinates(position); setNeighborhood('')
      // This is the same explicit user gesture, not a second button press or
      // a request on typing. Use the returned coordinates, not stale state.
      if (query.trim().length >= 2) execute(payload({ coordinates: position, neighborhood: '' }))
    } catch (failure) { if (mounted.current) setLocationError(failure.message) }
    finally { locationInFlight.current = false; if (mounted.current) setLocating(false) }
  }
  const selectedCity = useMemo(() => coordinates ? '' : discoveryCitySelection(settledQuery, cityCode, cityWasChosen), [coordinates, settledQuery, cityCode, cityWasChosen])
  const locationMessage = locationError === 'LOCATION_DENIED' ? copy.locationDenied : locationError === 'LOCATION_TIMEOUT' ? copy.locationTimeout : locationError === 'LOCATION_OUTSIDE' ? copy.locationOutside : copy.locationUnavailable
  const allRows = result?.results.filter(row => source === 'all' || row.source === source) || []
  const rows = allRows.filter(row => row.proximityBand !== 'further'), fartherRows = allRows.filter(row => row.proximityBand === 'further')
  // Keep the same source ordering in both the REST/dev cards and EEA UI Kit
  // layouts. Server eligibility decides who is a relevant, local partner.
  const partnerRows = rows.filter(row => row.source === 'gorez'), externalRows = rows.filter(row => row.source === 'google')
  const status = result?.externalStatus
  const externalNotice = status === 'quota' ? copy.quota : status === 'unavailable' ? copy.unavailable : ['disabled', 'not_configured'].includes(status) ? copy.disabled : ''
  return <section className={`discovery-search ${compact ? 'discovery-compact' : ''}`} aria-labelledby={compact ? 'home-discovery-title' : 'discovery-title'}>
    <header className={compact ? '' : 'discovery-hero'}>
      <div className="discovery-intro"><Title id={compact ? 'home-discovery-title' : 'discovery-title'}>{copy.title}</Title>{!compact && <p className="discovery-intro-hint">{copy.intro}</p>}</div>
      {!compact && <DiscoveryRouteArt locale={locale}/>}
    </header>
    {preview && <p className="discovery-notice discovery-test" role="note">{copy.mock}</p>}
    <form className="discovery-form" onSubmit={submit}>
      <div className="discovery-query"><label className="sr-only" htmlFor={compact ? 'home-ai-query' : 'ai-query'}>{copy.title}</label><input id={compact ? 'home-ai-query' : 'ai-query'} value={query} maxLength={300} placeholder={copy.placeholder} autoComplete="off" enterKeyHint="search" disabled={loading || locating} onChange={event => setQuery(event.target.value)} required minLength={2}/><button className="discovery-submit" aria-label={loading ? copy.searching : copy.search} disabled={loading || locating || query.trim().length < 2} type="submit">{loading ? <span className="button-spinner"/> : <Icon name="arrow"/>}<span>{copy.search}</span></button></div>
      <div className="discovery-controls">
        <label className="discovery-city"><span className="sr-only">{copy.city}</span><Icon name="pin"/><select value={selectedCity} disabled={loading || locating} onChange={event => { setCityCode(event.target.value); setCityWasChosen(true); setNeighborhood(''); setCoordinates(null); setLocationError(''); setResult(null) }}><option value="" disabled>{coordinates ? copy.changeCity : copy.anyCity}</option>{cities.map(city => <option key={city.code} value={city.code}>{en ? city.nameEn : city.name}{duplicateCityNames.has(city.name) ? ` · ${city.region}` : ''}</option>)}</select></label>
        <button className={`discovery-location ${coordinates ? 'selected' : ''}`} type="button" disabled={loading || locating} onClick={locate} title={copy.locationInfo} aria-describedby={compact ? 'home-location-info' : 'location-info'} aria-label={locating ? copy.locating : copy.nearby} aria-pressed={Boolean(coordinates)}><Icon name={coordinates ? 'check' : 'pin'}/>{locating ? copy.locating : copy.nearby}</button>
      </div>
      <div className="discovery-shortcuts" aria-label={en ? 'Service shortcuts' : 'Категории услуги'}>{DISCOVERY_SHORTCUTS.map(id => { const item = categoryById(id); return <button key={id} type="button" disabled={loading || locating} className={category === id ? 'selected' : ''} aria-pressed={category === id} onClick={() => chooseCategory(id)}><BusinessCategoryIcon category={id} size={44} eager/>{item[locale]}</button> })}</div>
      <details className="discovery-filters"><summary>{copy.filters}</summary><div className="discovery-refine">
        <label><span>{copy.neighborhood}</span><select value={neighborhood} disabled={!selectedCity || loading || locating} onChange={event => { setCityCode(selectedCity); setCityWasChosen(true); setNeighborhood(event.target.value) }}><option value="">{copy.anyNeighborhood}</option>{neighborhoodChoices(selectedCity).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>{en ? 'Category' : 'Категория'}<select value={category} disabled={loading || locating} onChange={event => chooseCategory(event.target.value)}><option value="">{en ? 'From my description' : 'От описанието'}</option>{DISCOVERY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item[locale]}</option>)}</select></label>
        <label>{copy.radius}<select value={radiusKm} disabled={loading || locating} onChange={event => { setRadius(Number(event.target.value)); setResult(null) }}>{DISCOVERY_RADIUS_CHOICES.map(radius => <option key={radius} value={radius}>{radius} km</option>)}</select></label>
      </div></details>
      <span className="sr-only" id={compact ? 'home-location-info' : 'location-info'}>{copy.locationInfo}</span>
      {locationError && <p className="discovery-notice" role="status">{locationMessage}</p>}
      <span className="sr-only" aria-live="polite">{settledQuery.length >= 2 && !loading ? (en ? 'Press Find to search.' : 'Натисни Намери за търсене.') : ''}</span>
    </form>
    {!compact && <div className="discovery-partner-entry"><Link href={`/partners?lang=${locale}`} prefetch={false}><img src="/gorez-symbol.svg?v=3" width="36" height="36" alt="" aria-hidden="true"/><span><strong>{copy.partners}</strong><span>{en ? 'Browse businesses by category' : 'Разгледай бизнесите по категории'}</span></span><Icon name="arrow"/></Link><Link className="discovery-business-cta" href={`/for-businesses?lang=${locale}`}><span>{copy.registerBusiness}</span><Icon name="arrow"/></Link></div>}
    {!compact && (loading || result || error) && <div className="discovery-results" aria-busy={loading}>
      <h2 ref={resultHeading} tabIndex={-1} className="discovery-results-title">{copy.results}{result && !result.clarification && !result.external ? ` · ${result.results.length}` : ''}</h2>
      {loading && <div className="discovery-loading" role="status"><span className="button-spinner"/><p>{copy.searching}</p><div className="discovery-skeleton"><i/><i/></div></div>}
      {error && <p className="discovery-notice" role="alert">{error === 'RATE_LIMITED' ? copy.rate : error === 'VALIDATION_ERROR' ? copy.invalid : copy.error}</p>}
      {!loading && !result && !error && <div className="discovery-start"><Icon name="calendarSearch"/><h3>{copy.start}</h3><p>{copy.startHint}</p></div>}
      {result?.clarification && <p className="discovery-clarification" role="status"><Icon name="chat"/>{result.clarification.message}</p>}
      {result && !result.clarification && <>
        <div className="discovery-understood"><div>{[categoryById(result.intent.category)?.[locale], result.intent.coordinates ? copy.nearby : result.intent.city, result.intent.neighborhood, result.intent.date ? DateTime.fromISO(result.intent.date).setLocale(locale).toFormat('d LLLL') : '', result.intent.timeFrom ? `${result.intent.timeFrom === result.intent.timeTo ? '' : en ? 'from ' : 'от '}${result.intent.timeFrom}` : '', result.intent.timeTo && result.intent.timeTo !== result.intent.timeFrom ? `${en ? 'until' : 'до'} ${result.intent.timeTo}` : '', result.intent.budget ? `≤ ${result.intent.budget.max} ${result.intent.budget.currency}` : ''].filter(Boolean).map((value, index) => <span key={index}>{value}</span>)}</div>{result.intent.requirements?.includes('after_work_17') && <p>{copy.afterWork}</p>}{result.intent.requirements?.some(item => item !== 'after_work_17') && <p>{copy.preferences}</p>}</div>
        {externalNotice && <p className="discovery-notice" role="status">{externalNotice}</p>}
        {result.appointmentClarification && <p className="discovery-clarification" role="status">{result.appointmentClarification.message}</p>}
        {result.warnings.includes('internal_unavailable') && <p className="discovery-notice" role="status">{copy.internalUnavailable}</p>}
        {result.warnings.includes('matching_unavailable') && <p className="discovery-notice" role="status">{copy.matchingUnavailable}</p>}
        {result.results.length > 0 && (result.external || result.results.some(row => row.source === 'google')) && <div className="discovery-source-tabs" role="group" aria-label={en ? 'Result sources' : 'Източници на резултатите'}>{[['all', copy.all], ['gorez', copy.partners]].map(([key, label]) => <button type="button" key={key} aria-pressed={source === key} className={source === key ? 'selected' : ''} onClick={() => setSource(key)}>{label}</button>)}</div>}
        {partnerRows.length > 0 && <section className="discovery-partner-results" aria-labelledby="discovery-partners-heading"><header className="discovery-result-group-heading"><h3 id="discovery-partners-heading">{copy.partnerResults}</h3><span>{partnerRows.length}</span></header><div className="discovery-cards discovery-partner-compact-grid">{partnerRows.map(row => <DiscoveryCard key={`gorez:${row.id}`} row={row} locale={locale} preview={preview} compact/>)}</div></section>}
        {externalRows.length > 0 && <section className="discovery-external-results" aria-labelledby="discovery-external-heading"><header className="discovery-result-group-heading"><h3 id="discovery-external-heading">{copy.otherResults}</h3></header><div className="discovery-cards">{externalRows.map(row => <DiscoveryCard key={`google:${row.id}`} row={row} locale={locale} preview={preview}/>)}</div></section>}
        {result.external && <div hidden={source === 'gorez'}><GoogleDiscoveryList plan={result.external} locale={locale} onRetry={() => execute(payload())}/></div>}
        {!rows.length && !(result.external && source !== 'gorez') && <div className="discovery-start"><h3>{copy.empty}</h3><p>{copy.emptyHint}</p></div>}
        {result.nearbyExpansion && (result.results.some(row => row.proximityBand === 'further') || result.furtherExternal) && <div hidden={!fartherRows.length && (source === 'gorez' || !result.furtherExternal)}><DiscoveryNearbyMore key={result.checkedAt} locale={locale} radiusKm={result.nearbyExpansion.outerRadiusKm}>
          {fartherRows.filter(row => row.source === 'gorez').length > 0 && <div className="discovery-cards discovery-partner-compact-grid">{fartherRows.filter(row => row.source === 'gorez').map(row => <DiscoveryCard key={`further:${row.id}`} row={row} locale={locale} preview={preview} compact/>)}</div>}
          {fartherRows.some(row => row.source === 'google') && <div className="discovery-cards">{fartherRows.filter(row => row.source === 'google').map(row => <DiscoveryCard key={`further:${row.id}`} row={row} locale={locale} preview={preview}/>)}</div>}
          {result.furtherExternal && <div hidden={source === 'gorez'}><GoogleDiscoveryList plan={result.furtherExternal} locale={locale}/></div>}
        </DiscoveryNearbyMore></div>}
        <details className="discovery-ranking"><summary>{copy.searchDetails}</summary><p>{copy.parsed} · {result.interpretation === 'model' ? copy.model : copy.rules}</p><p>{copy.rankingHint}</p>{result.external && <p>{en ? 'Google Maps places keep the provider’s distance order within each area. Further-away places appear separately below.' : 'Местата от Google Maps запазват реда по близост на доставчика в съответния район. По-далечните места са отделени по-долу.'}</p>}</details>
      </>}
    </div>}
  </section>
}

function GoogleAttribution({ rows = [] }) {
  return <div className="discovery-attribution"><span translate="no">Google Maps</span>{rows.map((row, index) => row.url ? <a key={index} href={row.url} target="_blank" rel="noopener noreferrer">{row.name}</a> : <span key={index}>{row.name}</span>)}</div>
}
export function DiscoveryCard({ row, locale, preview = false, compact = false }) {
  const [checkBooking,setCheckBooking]=useState(false)
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', internal = row.source === 'gorez', category = categoryById(row.category)
  const href = `/book/${row.slug}?lang=${locale}`
  if (internal && compact) return <article className="discovery-card discovery-partner discovery-partner-compact">
    <div className="discovery-card-top"><span className="discovery-source discovery-partner-badge"><img src="/gorez-symbol.svg?v=3" alt="" aria-hidden="true" width="24" height="24"/><span>{copy.partner}</span></span>{Number.isFinite(row.distanceKm) && <span className="discovery-partner-distance">{row.distanceKm} km</span>}</div>
    <div className="discovery-card-identity">{row.photos?.[0] ? <img className="discovery-partner-thumb" src={row.photos[0].src} width="60" height="60" alt=""/> : <BusinessCategoryIcon category={row.category} size={52}/>}<div><h3>{row.name}</h3><p>{row.address}</p></div></div>
    <div className="discovery-partner-matched-services" aria-label={en ? 'Matching services' : 'Подходящи услуги'}>{row.services.slice(0, 3).map(service => <span key={service.id}>{service.name}</span>)}</div>
    {isExternalBooking(row)&&<p>{en?'Check available times on the business’s website':'Провери свободните часове в сайта на бизнеса'}</p>}
    {preview ? <span className="discovery-partner-book" aria-disabled="true">{en ? 'Test result · booking disabled' : 'Тестов резултат · без резервация'}</span> : isExternalBooking(row)?<><OutboundBookingButton business={row} locale={locale} className="discovery-partner-book"/><Link href={href}>{en?'View profile':'Виж профила'}</Link></>:<Link className="discovery-partner-book" href={href}>{copy.book}<Icon name="arrow"/></Link>}
  </article>
  return <article className={`discovery-card ${internal ? 'discovery-partner' : 'discovery-external'}`}>
    {internal && row.photos?.length > 0 && <BusinessPhotoGallery photos={row.photos} businessName={row.name} locale={locale} variant="directory"/>}
    <div className="discovery-card-top">{internal ? <span className="discovery-source discovery-partner-badge"><img src="/gorez-symbol.svg?v=3" alt="" aria-hidden="true" width="32" height="32"/><span>{copy.partner}</span></span> : <span className="discovery-source">{copy.external} <span translate="no">Google Maps</span></span>}</div>
    <div className="discovery-card-identity"><BusinessCategoryIcon category={row.category} size={64}/><div><span className="discovery-category">{category?.[locale]}</span><h3>{row.name}</h3></div></div><p className="discovery-address"><Icon name="pin"/><span>{row.address || (en ? 'Address not supplied' : 'Няма посочен адрес')}{Number.isFinite(row.distanceKm) && <span> · {row.distanceKm} km</span>}</span></p>
    {internal ? <>
      <div className="discovery-services">{row.services.slice(0, 3).map(service => <div key={service.id}><span>{service.name}{service.durationMin!=null&&<small>{service.durationMin} {copy.minutes}</small>}</span><strong>{service.price == null ? copy.priceUnknown : new Intl.NumberFormat(en ? 'en-IE' : 'bg-BG', { style: 'currency', currency: service.currency }).format(service.price)}</strong></div>)}</div>
      {row.availability.status === 'verified' ? <div className="discovery-availability"><small><Icon name="clock"/>{copy.verified} · {row.availability.date}</small><div>{row.availability.slots.map((slot, index) => <span key={`${slot.startsAt}:${index}`}>{DateTime.fromISO(slot.startsAt).setZone(row.availability.timezone).toFormat('HH:mm')}</span>)}</div><p>{copy.recheck}</p></div> : <p className="discovery-availability-unknown"><Icon name="clock"/>{isExternalBooking(row)?(en?'Check available times on the business’s website':'Провери свободните часове в сайта на бизнеса'):row.availability.status === 'none' ? copy.none : copy.seeTimes}</p>}
      {row.hours?.some(day => day.periods.length) && <details className="discovery-hours"><summary>{en ? 'Opening hours' : 'Работно време'}</summary>{row.hours.map(day => <div key={day.weekday}><span>{DateTime.fromISO('2026-10-26').plus({ days: day.weekday - 1 }).setLocale(locale).toFormat('cccc')}</span><span>{day.periods.join(', ') || (en ? 'Closed' : 'Почивен ден')}</span></div>)}</details>}
      {isExternalBooking(row)&&<p>{en?'Check available times on the business’s website':'Провери свободните часове в сайта на бизнеса'}</p>}
      {preview ? <span className="discovery-card-cta" aria-disabled="true">{en ? 'Test result · booking disabled' : 'Тестов резултат · без резервация'}</span> : isExternalBooking(row)?<><OutboundBookingButton business={row} locale={locale} className="discovery-card-cta"/><Link href={href}>{en?'View profile':'Виж профила'}</Link></>:<Link className="discovery-card-cta" href={href}>{copy.book}<Icon name="arrow"/></Link>}
    </> : <><p className="discovery-external-note">{copy.externalHint}</p><p className="discovery-availability-unknown"><Icon name="clock"/>{copy.unknown}</p><a className="discovery-card-cta" href={row.mapsUrl} target="_blank" rel="noopener noreferrer">{copy.maps}<Icon name="external"/></a>{!preview&&validPlaceId(row.placeId)&&(checkBooking?<ExternalPlaceBooking placeId={row.placeId} locale={locale}/>:<button type="button" className="secondary-button" onClick={()=>setCheckBooking(true)}>{en?'Check for a verified booking link':'Провери за потвърден линк за резервации'}</button>)}<GoogleAttribution rows={row.attributions}/><details className="discovery-claim"><summary>{copy.claim}</summary><p>{copy.claimHint}</p><Link href={`/for-businesses?lang=${locale}`}>{en ? 'Start application' : 'Към регистрацията'}</Link></details></>}
  </article>
}
