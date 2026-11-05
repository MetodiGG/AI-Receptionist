'use client'

import Link from 'next/link'
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './icon'
import { BrandMark } from './brand-logo'
import { BULGARIAN_CITIES } from '../lib/business-location.mjs'
import { DISCOVERY_CATEGORIES, categoryById } from '../lib/discovery/categories.mjs'
import { neighborhoodChoices } from '../lib/discovery/intent.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'
import { clearDiscoveryDraft, peekDiscoveryDraft, setDiscoveryDraft } from '../lib/discovery/draft.mjs'
import { DEFAULT_DISCOVERY_CITY, DISCOVERY_SHORTCUTS, discoveryCategorySelection, discoveryCitySelection, discoverySearchInput, requestDiscoveryLocation } from '../lib/discovery/search-ui.mjs'
import { DiscoveryRouteArt } from './discovery-route-art'
import { BusinessCategoryIcon } from './business-category-icon'
import { focusDiscoveryResults } from '../lib/discovery/results-navigation.mjs'
import { DiscoveryHomeRail } from './discovery-home-rail'
import { DiscoveryHomeBusinesses, DiscoveryHomeBottom } from './discovery-home-browse'
import { DiscoveryFilterSheet } from './discovery-filter-sheet'
import { applyHomeFilters, homeCategories, homeFilterCount, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { laboratoryShortcuts } from '../lib/discovery/laboratories.mjs'
import { mergeCataloguePage } from '../lib/discovery/catalogue-pagination.mjs'

const cities = [...BULGARIAN_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
const duplicateCityNames = new Set(cities.filter((city, index) => cities.findIndex(other => other.name === city.name) !== index).map(city => city.name))
export function DiscoverySearch({ locale = 'bg', compact = false, preview = false, cataloguePreview = false, locationProvider = requestDiscoveryLocation, home = false, directoryData }) {
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', router = useRouter()
  const homeCopy = HOME_DISCOVERY_COPY[locale], filterId = useId(), filterTrigger = useRef(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const Title = compact ? 'h2' : 'h1'
  const SearchPanel = home ? 'div' : Fragment
  const [initial] = useState(() => compact ? null : peekDiscoveryDraft())
  const initialInput = initial?.request || initial
  const [query, setQuery] = useState(initialInput?.query || ''), [category, setCategory] = useState(initialInput?.category || '')
  const [cityCode, setCityCode] = useState(initialInput?.cityCode || DEFAULT_DISCOVERY_CITY), [neighborhood, setNeighborhood] = useState(initialInput?.neighborhood || '')
  const [cityWasChosen, setCityWasChosen] = useState(initial?.cityWasChosen || false)
  const [radiusKm, setRadius] = useState(initialInput?.radiusKm ?? DEFAULT_DISCOVERY_RADIUS_KM), [coordinates, setCoordinates] = useState(initialInput?.coordinates || null)
  const [locationEnabled, setLocationEnabled] = useState(home || Boolean(initialInput?.coordinates))
  const [locating, setLocating] = useState(false), [locationError, setLocationError] = useState(''), [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null), [error, setError] = useState(''), [settledQuery, setSettledQuery] = useState(query)
  const [loadingMore, setLoadingMore] = useState(false), [moreError, setMoreError] = useState(''), [resultKey, setResultKey] = useState(0)
  const pageController = useRef(null), pageInFlight = useRef(false), searchVersion = useRef(0), lastInput = useRef(null)
  const controller = useRef(null), resultHeading = useRef(null), inFlight = useRef(false), locationInFlight = useRef(false), locationVersion = useRef(0), mounted = useRef(true), scrollAfterSearch = useRef(false)
  useEffect(() => { const timer = setTimeout(() => setSettledQuery(query), 350); return () => clearTimeout(timer) }, [query])
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); pageController.current?.abort() } }, [])
  useEffect(() => {
    if (compact || loading || !scrollAfterSearch.current || (!result && !error)) return
    // After React commits the response: move to results/clarification/error,
    // not the loading shell. Typing and source filters never retrigger this.
    const frame = requestAnimationFrame(() => focusDiscoveryResults(resultHeading.current, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
    return () => cancelAnimationFrame(frame)
  }, [result, error, loading, compact])
  useEffect(() => {
    if (compact) return
    // One browser permission request on entry, deferred so Strict Mode's first
    // setup/cleanup cannot prompt twice. Wait for permission (or denial) before
    // the single initial search, rather than loading city and nearby in turn.
    const entryVersion = locationVersion.current
    const timer = setTimeout(async () => {
      if (entryVersion !== locationVersion.current) return
      const automatic = home && !coordinates && locationEnabled
      const position = automatic ? await locate({ automatic: true, searchAfter: false }) : coordinates
      if (!mounted.current || locationVersion.current !== entryVersion + Number(automatic)) return
      if (!initial && !home) return
      if (initial) clearDiscoveryDraft()
      const input = payload({ ...initialInput, coordinates: position || null, ...(position ? { neighborhood: '' } : {}) })
      void search(input, { navigate: Boolean(initial) })
    }, 0)
    return () => clearTimeout(timer)
    // Initial navigation is consumed once, not every locale/filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, compact])

  function payload(patch = {}) {
    const next = { query, locale, cityCode, cityWasChosen, neighborhood, category, coordinates, radiusKm, expandNearby: true, ...patch }
    return discoverySearchInput({ ...next, browse: home && !next.query.trim() })
  }
  function canDiscover(text = query) { return text.trim().length >= 2 || (home && !text.trim()) }
  function chooseCategory(id) {
    const selected = discoveryCategorySelection(query, id, locale)
    setCategory(selected.category); setQuery(selected.query); setResult(null); setError('')
    if ((home || coordinates) && selected.category && !(home && selected.category === 'other')) execute(payload(selected))
  }
  function chooseLaboratory(item) {
    setCategory('other'); setQuery(item.query); setResult(null); setError('')
    execute(payload({ category: 'other', query: item.query }))
  }
  function execute(input) {
    if (compact) { setDiscoveryDraft({ request: input, cityWasChosen }); router.push(`/search?lang=${locale}`) }
    else void search(input)
  }
  async function search(input = payload(), { navigate = true } = {}) {
    if (inFlight.current) return
    const version = ++searchVersion.current
    setResultKey(version); lastInput.current = input
    pageController.current?.abort(); pageInFlight.current = false; setLoadingMore(false); setMoreError('')
    scrollAfterSearch.current = navigate
    inFlight.current = true; setLoading(true); setError(''); setResult(null)
    const abort = new AbortController(); controller.current?.abort(); controller.current = abort
    const timer = setTimeout(() => abort.abort(), 20000)
    try {
      const response = await fetch(preview ? cataloguePreview ? '/dev/sofia-catalogue/search' : '/dev/discovery/search' : '/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: abort.signal, body: JSON.stringify(input) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.code || 'SEARCH_UNAVAILABLE')
      if (!Array.isArray(data.results) || typeof data.externalStatus !== 'string') throw new Error('SEARCH_UNAVAILABLE')
      if (mounted.current && !abort.signal.aborted && version === searchVersion.current) setResult(data)
    } catch (failure) { if (mounted.current) setError(failure.message === 'RATE_LIMITED' ? 'RATE_LIMITED' : failure.message === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'SEARCH_UNAVAILABLE') }
    finally { clearTimeout(timer); inFlight.current = false; if (mounted.current) setLoading(false) }
  }
  async function loadMore() {
    const offset = result?.cataloguePage?.nextOffset
    if (loading || pageInFlight.current || offset == null || !lastInput.current) return
    const version = searchVersion.current, abort = new AbortController()
    pageController.current = abort; pageInFlight.current = true
    scrollAfterSearch.current = false; setLoadingMore(true); setMoreError('')
    const timer = setTimeout(() => abort.abort(), 20000)
    try {
      const response = await fetch(preview ? cataloguePreview ? '/dev/sofia-catalogue/search' : '/dev/discovery/search' : '/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: abort.signal, body: JSON.stringify({ ...lastInput.current, catalogueOffset: offset }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.code || 'SEARCH_UNAVAILABLE')
      const merged = mergeCataloguePage(result, data)
      if (mounted.current && !abort.signal.aborted && version === searchVersion.current) setResult(merged)
    } catch (failure) {
      if (mounted.current && version === searchVersion.current) setMoreError(failure.message === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'SEARCH_UNAVAILABLE')
    } finally {
      clearTimeout(timer)
      if (version === searchVersion.current) { pageInFlight.current = false; if (mounted.current) setLoadingMore(false) }
    }
  }
  function submit(event) {
    event.preventDefault()
    if (query.trim().length < 2 || loading || locating) return
    execute(payload())
  }
  async function locate({ automatic = false, searchAfter = true } = {}) {
    if (loading) return null
    if (!automatic && locationEnabled) {
      // Turning the control off drops the in-memory point and unmounts the
      // old nearby results. The next request must not contain coordinates.
      locationVersion.current++; locationInFlight.current = false
      setLocationEnabled(false); setLocating(false); setCoordinates(null); setNeighborhood(''); setLocationError(''); setResult(null); setError('')
      if (canDiscover()) execute(payload({ coordinates: null, neighborhood: '' }))
      return null
    }
    if (locationInFlight.current) return null
    const version = ++locationVersion.current
    locationInFlight.current = true
    setLocationEnabled(true); setLocating(true); setLocationError('')
    try {
      const position = await locationProvider(navigator.geolocation, { secure: window.isSecureContext })
      if (!mounted.current || version !== locationVersion.current) return null
      setCoordinates(position); setNeighborhood('')
      // The browser has granted access. Use its actual point, never a guessed
      // city origin. Empty home searches use the bounded deterministic browse.
      if (searchAfter && canDiscover()) execute(payload({ coordinates: position, neighborhood: '' }))
      return position
    } catch (failure) { if (mounted.current && version === locationVersion.current) { setLocationEnabled(false); setCoordinates(null); setLocationError(failure.message); if (searchAfter && canDiscover()) execute(payload({ coordinates: null })) } return null }
    finally { if (version === locationVersion.current) { locationInFlight.current = false; if (mounted.current) setLocating(false) } }
  }
  const selectedCity = useMemo(() => coordinates ? '' : discoveryCitySelection(settledQuery, cityCode, cityWasChosen), [coordinates, settledQuery, cityCode, cityWasChosen])
  const homeFilters = { cityCode: selectedCity, neighborhood, category, radiusKm, nearby: Boolean(coordinates) }
  const activeFilters = homeFilterCount(homeFilters)
  const locationAction = locationEnabled ? homeCopy.locationOff : homeCopy.locationOn
  function openFilters(event) { filterTrigger.current = event.currentTarget; setFiltersOpen(true) }
  function applyFilters(draft) {
    const next = applyHomeFilters({ query, category, cityCode, cityWasChosen, coordinates, neighborhood, radiusKm }, draft, locale)
    setQuery(next.query); setCategory(next.category); setCityCode(next.cityCode); setCityWasChosen(next.cityWasChosen)
    setCoordinates(next.coordinates); setNeighborhood(next.neighborhood); setRadius(next.radiusKm); setLocationError(''); setFiltersOpen(false); setResult(null); setError('')
    locationVersion.current++; setLocationEnabled(Boolean(next.coordinates))
    if (canDiscover(next.query)) execute(payload(next))
  }
  const locationMessage = locationError === 'LOCATION_DENIED' ? copy.locationDenied : locationError === 'LOCATION_TIMEOUT' ? copy.locationTimeout : locationError === 'LOCATION_OUTSIDE' ? copy.locationOutside : copy.locationUnavailable
  return <section className={`discovery-search ${compact ? 'discovery-compact' : ''}${home ? ' discovery-home' : ''}`} aria-labelledby={compact ? 'home-discovery-title' : 'discovery-title'}>
    <SearchPanel {...(home ? { className: 'home-search-panel' } : {})}>
    <header className={home ? 'home-discovery-heading' : compact ? '' : 'discovery-hero'}>
      <div className="discovery-intro"><Title id={compact ? 'home-discovery-title' : 'discovery-title'}>{home ? homeCopy.title : copy.title}</Title>{!compact && !home && <p className="discovery-intro-hint">{copy.intro}</p>}</div>
      {!compact && !home && <DiscoveryRouteArt locale={locale}/>}
    </header>
    {preview && !home && <p className="discovery-notice discovery-test" role="note">{copy.mock}</p>}
    <form className="discovery-form" onSubmit={submit}>
      <div className="discovery-query">
        {home && <button className="home-search-trigger" type="submit" aria-label={loading ? copy.searching : copy.search} disabled={loading || locating || query.trim().length < 2}>{loading ? <span className="button-spinner"/> : <Icon name="search"/>}</button>}
        <label className="sr-only" htmlFor={compact ? 'home-ai-query' : 'ai-query'}>{home ? homeCopy.title : copy.title}</label><input id={compact ? 'home-ai-query' : 'ai-query'} value={query} maxLength={300} placeholder={copy.placeholder} autoComplete="off" enterKeyHint="search" disabled={loading || locating} onChange={event => setQuery(event.target.value)} required minLength={2}/>
        {home && <><button className={`home-inline-control${activeFilters ? ' has-filters' : ''}`} type="button" onClick={openFilters} disabled={loading || locating} aria-label={homeCopy.filters} aria-haspopup="dialog" aria-expanded={filtersOpen} aria-controls={filterId}><Icon name="sliders"/></button><button className={`home-inline-control home-inline-location${locationEnabled ? ' is-active' : ''}`} type="button" disabled={loading} onClick={locate} title={locating ? copy.locating : locationAction} aria-label={locating ? copy.locating : homeCopy.location} aria-describedby="location-info" aria-pressed={locationEnabled} aria-busy={locating}>{locating ? <span className="button-spinner"/> : <Icon name="map"/>}{coordinates && <span className="home-location-check" aria-hidden="true"><Icon name="check"/></span>}</button></>}
        {!home && <button className="discovery-submit" aria-label={loading ? copy.searching : copy.search} disabled={loading || locating || query.trim().length < 2} type="submit">{loading ? <span className="button-spinner"/> : <Icon name="arrow"/>}<span>{copy.search}</span></button>}
      </div>
      {!home && <><div className="discovery-controls">
        <label className="discovery-city"><span className="sr-only">{copy.city}</span><Icon name="pin"/><select value={selectedCity} disabled={loading || locating} onChange={event => { locationVersion.current++; setLocationEnabled(false); setCityCode(event.target.value); setCityWasChosen(true); setNeighborhood(''); setCoordinates(null); setLocationError(''); setResult(null) }}><option value="" disabled>{coordinates ? copy.changeCity : copy.anyCity}</option>{cities.map(city => <option key={city.code} value={city.code}>{en ? city.nameEn : city.name}{duplicateCityNames.has(city.name) ? ` · ${city.region}` : ''}</option>)}</select></label>
        <button className={`discovery-location ${coordinates ? 'selected' : ''}`} type="button" disabled={loading || locating} onClick={locate} title={locating ? copy.locating : locationAction} aria-describedby={compact ? 'home-location-info' : 'location-info'} aria-label={locating ? copy.locating : copy.nearby} aria-pressed={Boolean(coordinates)}><Icon name="map"/>{locating ? copy.locating : copy.nearby}</button>
      </div>
      <div className="discovery-shortcuts" aria-label={en ? 'Service shortcuts' : 'Категории услуги'}>{DISCOVERY_SHORTCUTS.map(id => { const item = categoryById(id); return <button key={id} type="button" disabled={loading || locating} className={category === id ? 'selected' : ''} aria-pressed={category === id} onClick={() => chooseCategory(id)}><BusinessCategoryIcon category={id} size={44} eager/>{item[locale]}</button> })}</div>
      <details className="discovery-filters"><summary>{copy.filters}</summary><div className="discovery-refine">
        <label><span>{copy.neighborhood}</span><select value={neighborhood} disabled={!selectedCity || loading || locating} onChange={event => { setCityCode(selectedCity); setCityWasChosen(true); setNeighborhood(event.target.value) }}><option value="">{copy.anyNeighborhood}</option>{neighborhoodChoices(selectedCity).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>{en ? 'Category' : 'Категория'}<select value={category} disabled={loading || locating} onChange={event => chooseCategory(event.target.value)}><option value="">{en ? 'From my description' : 'От описанието'}</option>{DISCOVERY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item[locale]}</option>)}</select></label>
        <label>{copy.radius}<select value={radiusKm} disabled={loading || locating} onChange={event => { setRadius(Number(event.target.value)); setResult(null) }}>{DISCOVERY_RADIUS_CHOICES.map(radius => <option key={radius} value={radius}>{radius} km</option>)}</select></label>
      </div></details></>}
      <span className="sr-only" id={compact ? 'home-location-info' : 'location-info'}>{copy.locationInfo}</span>
      {locationError && <p className="discovery-notice" role="status">{locationMessage}</p>}
      {home && <span className="sr-only" role="status">{coordinates ? homeCopy.locationEnabled : homeCopy.locationDisabled}</span>}
      <span className="sr-only" aria-live="polite">{settledQuery.length >= 2 && !loading ? (en ? 'Press Find to search.' : 'Натисни Намери за търсене.') : ''}</span>
    </form>
    </SearchPanel>
    {home && filtersOpen && <DiscoveryFilterSheet id={filterId} initialValues={homeFilters} locale={locale} onApply={applyFilters} onClose={() => setFiltersOpen(false)} triggerRef={filterTrigger}/>}
    {home && <><DiscoveryHomeRail title={homeCopy.categories} locale={locale} kind="categories">{homeCategories(locale).map((item, index) => <li key={item.id}><button type="button" disabled={loading || locating} className={category === item.id ? 'selected' : ''} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)}><img src={item.photo} srcSet={`${item.photo} 160w, ${item.photo2x} 240w`} sizes="80px" width="160" height="160" alt="" loading={index < 4 ? 'eager' : 'lazy'} decoding="async"/><span>{item.label}</span></button></li>)}</DiscoveryHomeRail></>}
    {home && category === 'other' && <div className="laboratory-shortcuts" role="group" aria-label={en ? 'Other appointment services' : 'Други услуги с часове'}>{laboratoryShortcuts(locale).map(item => <button key={item.id} type="button" className="secondary-button" disabled={loading || locating} onClick={() => chooseLaboratory(item)}>{item.label}</button>)}</div>}
    {!home && !compact && <div className="discovery-partner-entry"><Link href={`/partners?lang=${locale}`} prefetch={false}><BrandMark size={36}/><span><strong>{copy.partners}</strong><span>{en ? 'Browse businesses by category' : 'Разгледай бизнесите по категории'}</span></span><Icon name="arrow"/></Link><Link className="discovery-business-cta" href={`/for-businesses?lang=${locale}`}><span>{copy.registerBusiness}</span><Icon name="arrow"/></Link></div>}
    {!compact && <DiscoveryHomeBusinesses locale={locale} filters={{ ...homeFilters, coordinates }} preview={preview} data={directoryData} result={result} resultKey={resultKey} loading={loading || locating} error={error} onRetry={() => execute(payload())} headingRef={resultHeading} onLoadMore={loadMore} loadingMore={loadingMore} moreError={moreError}/>}
    {home && <DiscoveryHomeBottom locale={locale}/>}
  </section>
}
