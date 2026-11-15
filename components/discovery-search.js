'use client'

import { BrandLoading } from './brand-loading'
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './icon'
import { BULGARIAN_CITIES } from '../lib/business-location.mjs'
import { DISCOVERY_CATEGORIES, categoryById } from '../lib/discovery/categories.mjs'
import { neighborhoodChoices } from '../lib/discovery/location-query.mjs'
import { DISCOVERY_COPY, discoveryLocationMessage } from '../lib/discovery/copy.mjs'
import { DEFAULT_DISCOVERY_RADIUS_KM, DISCOVERY_RADIUS_CHOICES } from '../lib/discovery/defaults.mjs'
import { clearDiscoveryDraft, peekDiscoveryDraft, setDiscoveryDraft } from '../lib/discovery/draft.mjs'
import { DEFAULT_DISCOVERY_CITY, DISCOVERY_SHORTCUTS, discoveryCategorySelection, discoveryCitySelection, discoveryInitialInput, discoverySearchInput, requestDiscoveryLocation, subcategorySelection, subcategoryById } from '../lib/discovery/search-ui.mjs'
import { DiscoveryRouteArt } from './discovery-route-art'
import { BusinessCategoryIcon } from './business-category-icon'
import { focusDiscoveryResults } from '../lib/discovery/results-navigation.mjs'
import { DiscoveryHomeRail } from './discovery-home-rail'
import { DiscoveryHomeBusinesses } from './discovery-home-browse'
import { DiscoverySubcategories } from './discovery-subcategories'
import { DiscoveryFilterSheet } from './discovery-filter-sheet'
import { applyHomeFilters, homeCategories, homeFilterCount, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { mergeCataloguePage } from '../lib/discovery/catalogue-pagination.mjs'
import { DISCOVERY_LOCATION_MAX_AGE_MS, discoveryLocationError, discoveryLocationRetryMessage, freshDiscoveryLocation, sameDiscoveryOrigin } from '../lib/discovery/geolocation.mjs'
import { DiscoveryAutocomplete } from './discovery-autocomplete'
import { trackSearchEvent } from '../lib/search-analytics-client'

const cities = [...BULGARIAN_CITIES].sort((a, b) => a.name.localeCompare(b.name, 'bg'))
const duplicateCityNames = new Set(cities.filter((city, index) => cities.findIndex(other => other.name === city.name) !== index).map(city => city.name))
export function DiscoverySearch({ locale = 'bg', compact = false, preview = false, cataloguePreview = false, locationProvider = requestDiscoveryLocation, home = false, directoryData }) {
  const copy = DISCOVERY_COPY[locale], en = locale === 'en', router = useRouter()
  const homeCopy = HOME_DISCOVERY_COPY[locale], filterId = useId(), filterTrigger = useRef(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const Title = compact ? 'h2' : 'h1'
  const SearchPanel = home ? 'div' : Fragment
  const LocationPanel = home && !compact ? 'div' : Fragment
  const [initial] = useState(() => compact ? null : peekDiscoveryDraft())
  const initialInput = discoveryInitialInput(initial, { home, compact })
  const [entryCategory, setEntryCategory] = useState(!initial && home && !compact)
  const initialCoordinates = freshDiscoveryLocation(initialInput?.coordinates)
  const [query, setQuery] = useState(initialInput?.query || ''), [category, setCategory] = useState(initialInput?.category || '')
  const [subcategory, setSubcategory] = useState(initialInput?.subcategory && subcategoryById(initialInput.subcategory)?.category === initialInput.category ? initialInput.subcategory : '')
  const [subcategoryOptions, setSubcategoryOptions] = useState([]), subcategoryScope = useRef(null)
  const [cityCode, setCityCode] = useState(initialInput?.cityCode || DEFAULT_DISCOVERY_CITY), [neighborhood, setNeighborhood] = useState(initialInput?.neighborhood || '')
  const [cityWasChosen, setCityWasChosen] = useState(initial?.cityWasChosen || false)
  const [radiusKm, setRadius] = useState(initialInput?.radiusKm ?? DEFAULT_DISCOVERY_RADIUS_KM), [coordinates, setCoordinates] = useState(initialCoordinates)
  const [locationEnabled, setLocationEnabled] = useState(Boolean(initialCoordinates))
  const [locating, setLocating] = useState(false), [locationError, setLocationError] = useState(initial?.locationExpired || (initialInput?.coordinates && !initialCoordinates) ? 'LOCATION_STALE' : ''), [loading, setLoading] = useState(!compact && (home || Boolean(initial)))
  const [result, setResult] = useState(null), [error, setError] = useState(''), [settledQuery, setSettledQuery] = useState(query)
  const [resultOrigin, setResultOrigin] = useState(null), [resultCity, setResultCity] = useState(''), coordinatesRef = useRef(initialCoordinates)
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
    // Render a usable city-centre catalogue immediately, without waiting up to
    // eleven seconds for a permission dialog. Only an existing in-memory,
    // consented point or a deliberate map-button press enables nearby search.
    const entryVersion = searchVersion.current
    const timer = setTimeout(() => {
      if (!mounted.current || entryVersion !== searchVersion.current) return
      if (!initial && !home) return
      if (initial) clearDiscoveryDraft()
      const input = payload({ ...initialInput, coordinates: coordinates || null, ...(coordinates ? { neighborhood: '' } : {}) })
      void search(input, { navigate: Boolean(initial) })
    }, 0)
    return () => clearTimeout(timer)
    // Initial navigation is consumed once, not every locale/filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial, compact])
  useEffect(() => {
    if (!coordinates) return
    const expire = () => {
      if (coordinatesRef.current === coordinates && !freshDiscoveryLocation(coordinates)) expireLocation()
    }
    const timer = setTimeout(expire, Math.max(0, coordinates.observedAt + DISCOVERY_LOCATION_MAX_AGE_MS - Date.now()))
    // Suspended mobile tabs may delay timers. Recheck on return, never request
    // another position or permission in the background.
    window.addEventListener?.('focus', expire)
    if (typeof document !== 'undefined') document.addEventListener?.('visibilitychange', expire)
    return () => {
      clearTimeout(timer); window.removeEventListener?.('focus', expire)
      if (typeof document !== 'undefined') document.removeEventListener?.('visibilitychange', expire)
    }
    // Reschedule from the original observedAt, not from a later filter edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates, query, category, subcategory, cityCode, cityWasChosen, neighborhood, radiusKm, home, compact, locale])

  function payload(patch = {}) {
    const next = { query, locale, cityCode, cityWasChosen, neighborhood, category, subcategory, coordinates, radiusKm, expandNearby: true, ...patch }
    return discoverySearchInput({ ...next, categoryBrowse: home, browse: home && !next.query.trim() })
  }
  function canDiscover(text = query) { return text.trim().length >= 2 || (home && !text.trim()) }
  function expireLocation() {
    locationVersion.current++; locationInFlight.current = false; coordinatesRef.current = null
    searchVersion.current++; controller.current?.abort(); pageController.current?.abort()
    inFlight.current = false; pageInFlight.current = false
    setCoordinates(null); setLocationEnabled(false); setLocating(false); setNeighborhood(''); setLocationError('LOCATION_STALE'); clearSubcategoryOptions()
    setResult(null); setResultOrigin(null); setError(''); setLoading(false); setLoadingMore(false); setMoreError('')
    // Expiry is not a new user navigation/scroll action. A compact control
    // only clears its point; the full page may refresh its city browse quietly.
    if (canDiscover() && !compact) void search(payload({ coordinates: null, neighborhood: '' }), { navigate: false })
  }
  function cancelPendingLocation() {
    if (!locationInFlight.current) return
    locationVersion.current++; locationInFlight.current = false
    setLocating(false); setLocationEnabled(Boolean(coordinates))
  }
  function clearSubcategoryOptions() { subcategoryScope.current = null; setSubcategoryOptions([]) }
  function changeQuery(value) {
    cancelPendingLocation()
    // Hair is a starting point, not a hidden restriction on the first typed
    // search. Explicit category/subcategory choices retain their usual scope.
    if (entryCategory) { setCategory(''); setEntryCategory(false) }
    setQuery(value); setSubcategory(''); clearSubcategoryOptions()
  }
  function chooseCategory(id) {
    cancelPendingLocation()
    setEntryCategory(false)
    const selected = discoveryCategorySelection(query, id, locale)
    setCategory(selected.category); setSubcategory(''); clearSubcategoryOptions(); setQuery(selected.query); setResult(null); setError('')
    if ((home || coordinates) && selected.category) execute(payload({ ...selected, subcategory: '' }), { navigate: false })
  }
  function chooseSubcategory(id) {
    cancelPendingLocation()
    setEntryCategory(false)
    const selected = subcategorySelection(query, category, id, locale)
    setSubcategory(selected.subcategory); setQuery(selected.query); setResult(null); setError('')
    execute(payload(selected), { navigate: false })
  }
  function execute(input, options) {
    if (compact) {
      const point = freshDiscoveryLocation(coordinatesRef.current)
      setDiscoveryDraft({ request: input, cityWasChosen, ...(input.coordinates && point ? { locationMetadata: { accuracyMeters: point.accuracyMeters, observedAt: point.observedAt } } : {}) })
      router.push(`/search?lang=${locale}`)
    }
    else void search(input, options)
  }
  async function search(input = payload(), { navigate = true } = {}) {
    if (input.coordinates && (!freshDiscoveryLocation(coordinatesRef.current) || !sameDiscoveryOrigin(input, { coordinates: coordinatesRef.current }))) { expireLocation(); return }
    if (inFlight.current && JSON.stringify(input) === JSON.stringify(lastInput.current)) return
    // Facets describe the parent/category and submitted location, not just the
    // current result page. Keep that accepted scope stable during child picks.
    const facetKey = JSON.stringify({ query: input.query, category: input.category, cityCode: input.cityCode, neighborhood: input.neighborhood, coordinates: input.coordinates, radiusKm: input.radiusKm })
    if (subcategoryScope.current !== facetKey) { subcategoryScope.current = facetKey; setSubcategoryOptions([]) }
    // Each accepted response is tied to the actual submitted origin. A newer
    // search supersedes every success/error/finally path of its predecessor.
    const version = ++searchVersion.current, startedAt = Date.now()
    setResultKey(version); lastInput.current = input
    pageController.current?.abort(); pageInFlight.current = false; setLoadingMore(false); setMoreError('')
    scrollAfterSearch.current = navigate
    inFlight.current = true; setLoading(true); setError(''); setResult(null); setResultOrigin(null)
    const abort = new AbortController(); controller.current?.abort(); controller.current = abort
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; abort.abort() }, 20000)
    try {
      const response = await fetch(preview ? cataloguePreview ? '/dev/sofia-catalogue/search' : '/dev/discovery/search' : '/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: abort.signal, body: JSON.stringify(input) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.code || 'SEARCH_UNAVAILABLE')
      if (!Array.isArray(data.results) || typeof data.externalStatus !== 'string') throw new Error('SEARCH_UNAVAILABLE')
      if (!sameDiscoveryOrigin(input, data.intent)) throw new Error('SEARCH_UNAVAILABLE')
      if (input.subcategory && input.subcategory !== data.intent?.subcategory) throw new Error('SEARCH_UNAVAILABLE')
      if (mounted.current && !abort.signal.aborted && version === searchVersion.current) {
        if (input.coordinates && !freshDiscoveryLocation(coordinatesRef.current)) { expireLocation(); return }
        setResultOrigin(input.coordinates || null); setResultCity(data.intent?.cityCode || input.cityCode || ''); setResult(data)
        if (subcategoryScope.current === facetKey) setSubcategoryOptions(Array.isArray(data.subcategoryOptions) ? data.subcategoryOptions : [])
        trackSearchEvent({ event: 'search', query: input.query, locale, resultCount: data.results.length, durationMs: Date.now() - startedAt })
      }
    } catch (failure) { if (mounted.current && version === searchVersion.current && (!abort.signal.aborted || timedOut)) { setError(failure.message === 'RATE_LIMITED' ? 'RATE_LIMITED' : failure.message === 'VALIDATION_ERROR' ? 'VALIDATION_ERROR' : 'SEARCH_UNAVAILABLE'); trackSearchEvent({ event: 'search', query: input.query, locale, failed: true, durationMs: Date.now() - startedAt }) } }
    finally { clearTimeout(timer); if (version === searchVersion.current) { inFlight.current = false; if (mounted.current) setLoading(false) } }
  }
  async function loadMore() {
    const offset = result?.cataloguePage?.nextOffset
    if (loading || pageInFlight.current || offset == null || !lastInput.current) return
    const input = lastInput.current
    if (input.coordinates && (!freshDiscoveryLocation(coordinatesRef.current) || !sameDiscoveryOrigin(input, { coordinates: coordinatesRef.current }))) { expireLocation(); return }
    const version = searchVersion.current, abort = new AbortController()
    pageController.current = abort; pageInFlight.current = true
    scrollAfterSearch.current = false; setLoadingMore(true); setMoreError('')
    const timer = setTimeout(() => abort.abort(), 20000)
    try {
      const response = await fetch(preview ? cataloguePreview ? '/dev/sofia-catalogue/search' : '/dev/discovery/search' : '/api/public/discovery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: abort.signal, body: JSON.stringify({ ...input, catalogueOffset: offset }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.code || 'SEARCH_UNAVAILABLE')
      if (!sameDiscoveryOrigin(input, data.intent)) throw new Error('SEARCH_UNAVAILABLE')
      if (mounted.current && !abort.signal.aborted && version === searchVersion.current && input.coordinates && !freshDiscoveryLocation(coordinatesRef.current)) { expireLocation(); return }
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
    if (query.trim().length < 2) return
    cancelPendingLocation()
    execute(payload())
  }
  function selectSuggestion(item) {
    cancelPendingLocation()
    setEntryCategory(false)
    trackSearchEvent({ event: 'selection', query, locale, selection: item.kind })
    if (item.kind === 'business') { trackSearchEvent({ event: 'profile', query, locale }); router.push(item.href); return }
    const selected = item.kind === 'category' ? { category: item.category, subcategory: '', query: categoryById(item.category)?.[locale] || item.label } : { category: '', subcategory: '', query: item.query }
    if (coordinates && item.neighborhood) selected.query = `${selected.query} ${item.neighborhood}`
    setCategory(selected.category); setSubcategory(''); clearSubcategoryOptions(); setQuery(selected.query); setResult(null); setError('')
    const location = { cityCode: item.cityCode || cityCode, cityWasChosen: true, neighborhood: item.neighborhood || neighborhood }
    if (!coordinates) { setCityCode(location.cityCode); setCityWasChosen(true); setNeighborhood(location.neighborhood) }
    execute(item.kind === 'category' && !coordinates ? { ...payload({ ...selected, ...location, query: '' }), browse: true } : payload({ ...selected, ...location }))
  }
  function allSuggestions() { trackSearchEvent({ event: 'selection', query, locale, selection: 'all' }); cancelPendingLocation(); execute(payload()) }
  async function locate({ automatic = false, searchAfter = true } = {}) {
    if (loading) return null
    if (!automatic && locationEnabled) {
      // Turning the control off drops the in-memory point and unmounts the
      // old nearby results. The next request must not contain coordinates.
      locationVersion.current++; locationInFlight.current = false
      coordinatesRef.current = null
      setLocationEnabled(false); setLocating(false); setCoordinates(null); setNeighborhood(''); setLocationError(''); setResult(null); setResultOrigin(null); setError(''); clearSubcategoryOptions()
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
      const positionError = discoveryLocationError(position)
      if (positionError) throw Error(positionError)
      coordinatesRef.current = position
      setCoordinates(position); setNeighborhood('')
      // The browser has granted access. Use its actual point, never a guessed
      // city origin. Empty home searches use the bounded deterministic browse.
      if (searchAfter && canDiscover()) execute(payload({ coordinates: position, neighborhood: '' }))
      return position
    } catch (failure) { if (mounted.current && version === locationVersion.current) { coordinatesRef.current = null; setLocationEnabled(false); setCoordinates(null); setLocationError(failure.message); if (searchAfter && canDiscover() && !result) execute(payload({ coordinates: null })) } return null }
    finally { if (version === locationVersion.current) { locationInFlight.current = false; if (mounted.current) setLocating(false) } }
  }
  const selectedCity = useMemo(() => {
    if (coordinates) return ''
    // Show the city of this exact settled response, not a town word inside a
    // verified branch name. Never reuse it for edited text or a manual filter.
    const resultCity = lastInput.current?.query === query.trim() ? result?.intent?.cityCode : null
    if (!cityWasChosen && resultCity && BULGARIAN_CITIES.some(city => city.code === resultCity)) return resultCity
    return discoveryCitySelection(settledQuery, cityCode, cityWasChosen)
  }, [coordinates, settledQuery, cityCode, cityWasChosen, query, result])
  const homeFilters = { cityCode: selectedCity, neighborhood, category, subcategory, radiusKm, nearby: Boolean(coordinates) }
  const activeFilters = homeFilterCount(homeFilters)
  const locationAction = locationEnabled ? homeCopy.locationOff : homeCopy.locationOn
  function openFilters(event) { filterTrigger.current = event.currentTarget; setFiltersOpen(true) }
  function applyFilters(draft) {
    cancelPendingLocation()
    setEntryCategory(false)
    const next = applyHomeFilters({ query, category, subcategory, cityCode, cityWasChosen, coordinates, neighborhood, radiusKm }, draft, locale)
    setQuery(next.query); setCategory(next.category); setSubcategory(next.subcategory || ''); setCityCode(next.cityCode); setCityWasChosen(next.cityWasChosen)
    coordinatesRef.current = next.coordinates
    setCoordinates(next.coordinates); setNeighborhood(next.neighborhood); setRadius(next.radiusKm); setLocationError(''); setFiltersOpen(false); setResult(null); setResultOrigin(null); setError('')
    locationVersion.current++; setLocationEnabled(Boolean(next.coordinates))
    if (canDiscover(next.query)) execute(payload(next))
  }
  const locationMessage = discoveryLocationRetryMessage(locationError, locale) || discoveryLocationMessage(locationError, { disabled: home && !locationEnabled && !locating }, locale)
  const contextCity = cities.find(city => city.code === selectedCity)
  const locationContext = coordinates ? (en ? 'Around you' : 'Около Вас') : contextCity ? `${en ? contextCity.nameEn : contextCity.name} · ${en ? 'city centre' : 'от центъра'}` : (en ? 'Selected area' : 'Избраният район')
  return <section className={`discovery-search ${compact ? 'discovery-compact' : ''}${home ? ' discovery-home' : ''}`} aria-labelledby={compact ? 'home-discovery-title' : 'discovery-title'}>
    <SearchPanel {...(home ? { className: 'home-search-panel' } : {})}>
    <header className={home ? 'home-discovery-heading' : compact ? '' : 'discovery-hero'}>
      <div className="discovery-intro"><Title id={compact ? 'home-discovery-title' : 'discovery-title'}>{home ? homeCopy.title : copy.title}</Title>{!compact && !home && <p className="discovery-intro-hint">{copy.intro}</p>}</div>
      {!compact && !home && <DiscoveryRouteArt locale={locale}/>}
    </header>
    {preview && !home && <p className="discovery-notice discovery-test" role="note">{copy.mock}</p>}
    <form className="discovery-form" onSubmit={submit}>
      <div className="discovery-query">
        {home && <button className="home-search-trigger" type="submit" aria-label={loading ? copy.searching : copy.search} aria-busy={loading} disabled={query.trim().length < 2}>{loading ? <BrandLoading size={20} decorative/> : <Icon name="search"/>}</button>}
        <label className="sr-only" htmlFor={compact ? 'home-ai-query' : 'ai-query'}>{home ? homeCopy.title : copy.title}</label><DiscoveryAutocomplete id={compact ? 'home-ai-query' : 'ai-query'} value={query} onChange={changeQuery} onSelect={selectSuggestion} onAll={allSuggestions} locale={locale} cityCode={selectedCity || cityCode || DEFAULT_DISCOVERY_CITY} neighborhood={neighborhood} category={category} placeholder={copy.placeholder} dismissKey={resultKey} preview={preview}><input id={compact ? 'home-ai-query' : 'ai-query'} value={query} maxLength={300} placeholder={copy.placeholder} autoComplete="off" enterKeyHint="search" disabled={false} onChange={event => changeQuery(event.target.value)} required minLength={2}/></DiscoveryAutocomplete>
        {home && <><button className={`home-inline-control${activeFilters ? ' has-filters' : ''}`} type="button" onClick={openFilters} disabled={loading} aria-label={homeCopy.filters} aria-haspopup="dialog" aria-expanded={filtersOpen} aria-controls={filterId}><Icon name="sliders"/></button><button className={`home-inline-control home-inline-location${locationEnabled ? ' is-active' : ''}`} type="button" disabled={loading} onClick={locate} title={locating ? copy.locating : locationAction} aria-label={locating ? copy.locating : homeCopy.location} aria-describedby="location-info" aria-pressed={locationEnabled} aria-busy={locating}>{locating ? <BrandLoading size={20} decorative/> : <Icon name="map"/>}{coordinates && <span className="home-location-check" aria-hidden="true"><Icon name="check"/></span>}</button></>}
        {!home && <button className="discovery-submit" aria-label={loading ? copy.searching : copy.search} aria-busy={loading} disabled={query.trim().length < 2} type="submit">{loading ? <BrandLoading size={20} decorative/> : <Icon name="arrow"/>}<span>{copy.search}</span></button>}
      </div>
      {!home && <><div className="discovery-controls">
        <label className="discovery-city"><span className="sr-only">{copy.city}</span><Icon name="pin"/><select value={selectedCity} disabled={loading} onChange={event => { cancelPendingLocation(); clearSubcategoryOptions(); locationVersion.current++; coordinatesRef.current = null; setLocationEnabled(false); setCityCode(event.target.value); setCityWasChosen(true); setNeighborhood(''); setCoordinates(null); setLocationError(''); setResult(null); setResultOrigin(null) }}><option value="" disabled>{coordinates ? copy.changeCity : copy.anyCity}</option>{cities.map(city => <option key={city.code} value={city.code}>{en ? city.nameEn : city.name}{duplicateCityNames.has(city.name) ? ` · ${city.region}` : ''}</option>)}</select></label>
        <button className={`discovery-location ${coordinates ? 'selected' : ''}`} type="button" disabled={loading} onClick={locate} title={locating ? copy.locating : locationAction} aria-describedby={compact ? 'home-location-info' : 'location-info'} aria-label={locating ? copy.locating : copy.nearby} aria-pressed={Boolean(coordinates)}><Icon name="map"/>{locating ? copy.locating : copy.nearby}</button>
      </div>
      <div className="discovery-shortcuts" aria-label={en ? 'Service shortcuts' : 'Категории услуги'}>{DISCOVERY_SHORTCUTS.map(id => { const item = categoryById(id); return <button key={id} type="button" disabled={loading} className={category === id ? 'selected' : ''} aria-pressed={category === id} onClick={() => chooseCategory(id)}><BusinessCategoryIcon category={id} size={44} eager/>{item[locale]}</button> })}</div>
      <details className="discovery-filters"><summary>{copy.filters}</summary><div className="discovery-refine">
        <label><span>{copy.neighborhood}</span><select value={neighborhood} disabled={!selectedCity || loading} onChange={event => { cancelPendingLocation(); clearSubcategoryOptions(); setCityCode(selectedCity); setCityWasChosen(true); setNeighborhood(event.target.value) }}><option value="">{copy.anyNeighborhood}</option>{neighborhoodChoices(selectedCity).map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>{en ? 'Category' : 'Категория'}<select value={category} disabled={loading} onChange={event => chooseCategory(event.target.value)}><option value="">{en ? 'From my description' : 'От описанието'}</option>{DISCOVERY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item[locale]}</option>)}</select></label>
        <label>{copy.radius}<select value={radiusKm} disabled={loading} onChange={event => { cancelPendingLocation(); clearSubcategoryOptions(); setRadius(Number(event.target.value)); setResult(null) }}>{DISCOVERY_RADIUS_CHOICES.map(radius => <option key={radius} value={radius}>{radius} km</option>)}</select></label>
      </div></details></>}
      <span className="sr-only" id={compact ? 'home-location-info' : 'location-info'}>{copy.locationInfo}</span>
      <LocationPanel {...(home && !compact ? { className: 'home-search-context' } : {})}>
      {home && !compact && <span className="home-location-context"><Icon name="pin"/>{locationContext}</span>}
      {locationMessage && (home && !compact && !locationError ? <details className="home-location-help"><summary>{en ? 'About location' : 'За локацията'}<Icon name="chevronDown"/></summary><p>{locationMessage}</p></details> : <p className="discovery-notice" role="status">{locationMessage}</p>)}
      </LocationPanel>
      {home && coordinates && <span className="sr-only" role="status">{homeCopy.locationEnabled}</span>}
      <span className="sr-only" aria-live="polite">{settledQuery.length >= 2 && !loading ? (en ? 'Press Find to search.' : 'Натисни Намери за търсене.') : ''}</span>
    </form>
    </SearchPanel>
    {home && filtersOpen && <DiscoveryFilterSheet id={filterId} initialValues={homeFilters} locale={locale} onApply={applyFilters} onClose={() => setFiltersOpen(false)} triggerRef={filterTrigger}/>}
    {home && <><DiscoveryHomeRail title={homeCopy.categories} locale={locale} kind="categories" hideHeading>{homeCategories(locale).map((item, index) => <li key={item.id}><button type="button" disabled={loading} className={category === item.id ? 'selected' : ''} aria-pressed={category === item.id} onClick={() => chooseCategory(item.id)}><img src={item.photo} srcSet={`${item.photo} 160w, ${item.photo2x} 240w`} sizes="80px" width="160" height="160" alt="" loading={index < 4 ? 'eager' : 'lazy'} decoding="async"/><span>{item.label}</span></button></li>)}</DiscoveryHomeRail></>}
    {!compact && <DiscoverySubcategories category={category} title={categoryById(category)?.[locale]} options={subcategoryOptions} selected={subcategory} selectedLabel={subcategoryById(subcategory)?.[locale]} locale={locale} loading={loading} onSelect={chooseSubcategory}/>}
    {!compact && <DiscoveryHomeBusinesses locale={locale} filters={{ ...homeFilters, cityCode: result ? resultCity : homeFilters.cityCode, coordinates: result ? resultOrigin : coordinates }} preview={preview} data={directoryData} result={result} resultKey={resultKey} loading={loading} error={error} onRetry={() => execute(payload())} headingRef={resultHeading} onLoadMore={loadMore} loadingMore={loadingMore} moreError={moreError} directoryEnabled={!home} initialPreview={entryCategory} quickChoice={home}/>}
  </section>
}
