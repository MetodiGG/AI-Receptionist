'use client'

import { BrandLoading } from './brand-loading'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Icon } from './icon'
import { DiscoveryBusinessList } from './discovery-business-list'
import { useDirectory } from '../hooks/use-directory'
import { homeBusinesses, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { orderedRailRows } from '../lib/discovery/rail.mjs'
import { DiscoveryBusinessCard } from './discovery-business-card'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { discoveryDistanceOrigin } from '../lib/discovery/distance-origin.mjs'
import { GUIDED_DISCOVERY_COPY } from '../lib/discovery/guided-copy.mjs'
const GoogleBusinessCard = dynamic(() => import('./google-business-card').then(module => module.GoogleBusinessCard))
const GoogleDiscoveryList = dynamic(() => import('./google-discovery-list').then(module => module.GoogleDiscoveryList))
const noDirectory = Object.freeze({ businesses: [], status: 'ready' })
const INTRO_BUSINESS_LIMIT = 8

export function DiscoveryHomeBusinesses({ locale, filters, title, onChangeService, onChangeArea, preview = false, initialPreview = false, quickChoice = false, data, result, resultKey, loading = false, error = '', onRetry, headingRef, onLoadMore, loadingMore = false, moreError = '', directoryEnabled = true }) {
  const copy = { ...HOME_DISCOVERY_COPY[locale], explore: title || HOME_DISCOVERY_COPY[locale].explore }, messages = DISCOVERY_COPY[locale], en = locale === 'en'
  // The homepage starts the authoritative, paged catalogue browse immediately;
  // a parallel partner-only directory request is redundant there. The legacy
  // non-home fallback and explicitly supplied local fixtures remain unchanged.
  const directory = useDirectory(preview ? data || noDirectory : directoryEnabled ? null : noDirectory)
  const [expanded, setExpanded] = useState(false)
  const [previewExpanded, setPreviewExpanded] = useState(false)
  useEffect(() => setExpanded(false), [resultKey ?? result?.checkedAt])
  useEffect(() => setPreviewExpanded(false), [initialPreview, resultKey])
  const catalogueMode = ['catalogue', 'sofia_only'].includes(result?.externalStatus)
  const rows = useMemo(() => result ? orderedRailRows(result.results, { preserveOrder: catalogueMode }) : homeBusinesses(directory.businesses || [], filters).map(row => ({ ...row, source: 'gorez' })),
    [result, catalogueMode, directory.businesses, filters.cityCode, filters.neighborhood, filters.category, filters.radiusKm, filters.nearby, filters.coordinates])
  const nearby = Boolean(result?.intent?.coordinates || (!result && filters.coordinates?.consent))
  const distanceOrigin = useMemo(() => discoveryDistanceOrigin({ coordinates: filters.coordinates, cityCode: result?.intent?.cityCode || filters.cityCode }), [filters.coordinates, result?.intent?.cityCode, filters.cityCode])
  // Deterministic own-catalogue relevance is already ranked before pagination.
  // Repartitioning it by distance would move a weaker near result ahead of an
  // exact farther match. Keep the existing provider bands for legacy Google.
  const [nearRows, farRows] = useMemo(() => catalogueMode ? [rows, []] : [rows.filter(row => row.proximityBand !== 'further'), rows.filter(row => row.proximityBand === 'further')], [rows, catalogueMode])
  const showFurther = catalogueMode || expanded || (!nearRows.length && !result?.external)
  const hiddenFurther = Boolean(farRows.length || result?.furtherExternal) && !showFurther
  const nextPage = result?.cataloguePage?.nextOffset != null && Boolean(onLoadMore)
  const hasMore = hiddenFurther || nextPage
  // The first visit shows eight real businesses, not a different result set.
  // Explicit expansion restores the existing vertical list and paging gate.
  const introCollapsed = initialPreview && !previewExpanded && rows.length > 0
  const introHasMore = Boolean(introCollapsed && rows.length >= INTRO_BUSINESS_LIMIT && (rows.length > INTRO_BUSINESS_LIMIT || result?.external || result?.furtherExternal || hasMore))
  // A short first page is not an eight-business preview yet. Keep the existing
  // bounded paging/retry flow usable until it is full, without an early More.
  const awaitingIntroPage = introCollapsed && rows.length < INTRO_BUSINESS_LIMIT
  function advanceBusinesses() { if (hiddenFurther) setExpanded(true); else if (nextPage && !loadingMore && !moreError) onLoadMore() }
  const busy = loading || (!result && !error && directory.status === 'loading')
  const notice = error ? error === 'RATE_LIMITED' ? messages.rate : messages.error : !result && directory.status === 'error' ? copy.unavailable : ''
  const card = row => <li key={`${row.source}:${row.id}`}><DiscoveryBusinessCard row={row} locale={locale} preview={preview} nearby={nearby} distanceOrigin={distanceOrigin} quickChoice={quickChoice}/></li>
  const google = (plan, key) => plan?.mode === 'ui_kit_cards' ? plan.cards.map(item => <li key={`${key}:${item.placeId}`}><GoogleBusinessCard card={item} locale={locale} providerLocale={plan.locale} nearby={nearby} distanceOrigin={distanceOrigin}/></li>) : plan && <li key={key} className="home-google-chunk"><GoogleDiscoveryList plan={plan} locale={locale} rail vertical nearby={nearby} onRetry={onRetry}/></li>
  const rail = !busy && !result?.clarification && <>
    {introCollapsed ? rows.slice(0, INTRO_BUSINESS_LIMIT).map(card) : <>
      {nearRows.map(card)}{google(result?.external, 'near-google')}
      {showFurther && <>{farRows.map(card)}{google(result?.furtherExternal, 'far-google')}</>}
    </>}
    {loadingMore && <li className="home-rail-loading"><BrandLoading locale={locale} label={en ? 'Loading businesses…' : 'Зареждаме бизнеси…'}/></li>}
  </>
  const empty = !busy && !notice && !result?.clarification && !rows.length && !result?.external && !result?.furtherExternal && !nextPage
  return <DiscoveryBusinessList title={copy.explore} locale={locale} headingRef={headingRef} busy={busy} hasMore={hasMore || introHasMore} pending={loadingMore} requireScrollIntent={Boolean(hiddenFurther && result?.furtherExternal)} resetKey={resultKey ?? result?.checkedAt} pageKey={`${introCollapsed ? 'intro' : hiddenFurther ? 'further' : 'page'}:${result?.cataloguePage?.nextOffset ?? 'end'}:${rows.length}`} onNearEnd={(!introCollapsed || awaitingIntroPage) && hasMore && !loadingMore && !moreError ? advanceBusinesses : undefined} action={catalogueMode || quickChoice ? null : <Link href={`/partners?lang=${locale}`} prefetch={false}>{copy.all}<Icon name="arrow"/></Link>} message={<>
    {busy && <div className="home-browse-skeleton" role="status"><BrandLoading locale={locale} label={messages.searching} announce={false}/><i aria-hidden="true"/><i aria-hidden="true"/><i aria-hidden="true"/></div>}
    {notice && <div className="home-browse-empty" role="alert"><p>{notice}</p><button className="secondary-button" type="button" onClick={error ? onRetry : directory.retry}>{copy.retry}</button></div>}
    {result?.clarification && <p className="discovery-clarification" role="status">{result.clarification.message}</p>}
    {result?.appointmentClarification && <p className="discovery-clarification" role="status">{result.appointmentClarification.message}</p>}
    {result?.externalStatus === 'quota' && <p className="discovery-notice" role="status">{messages.quota}</p>}
    {result?.externalStatus === 'unavailable' && <p className="discovery-notice" role="status">{messages.unavailable}</p>}
    {result?.warnings?.includes('catalogue_sofia_only') && <p className="discovery-notice" role="status">{en ? 'Discovery is currently available in the city of Sofia, Bulgaria.' : 'Търсенето в момента е достъпно само за град София.'}</p>}
    {result?.warnings?.includes('catalogue_unavailable') && <p className="discovery-notice" role="status">{en ? 'The catalogue is temporarily unavailable. GoRez bookings remain available.' : 'Каталогът временно не е достъпен. Резервациите в GoRez продължават да работят.'}</p>}
    {result?.warnings?.includes('internal_unavailable') && <p className="discovery-notice" role="status">{messages.internalUnavailable}</p>}
    {empty && <div className="home-browse-empty" role="status"><p>{GUIDED_DISCOVERY_COPY[locale].empty}</p>{(onChangeService || onChangeArea) && <div className="guide-empty-actions">{onChangeService && <button type="button" onClick={onChangeService}>{GUIDED_DISCOVERY_COPY[locale].changeService}</button>}{onChangeArea && <button type="button" onClick={onChangeArea}>{GUIDED_DISCOVERY_COPY[locale].changeArea}</button>}</div>}</div>}
  </>} footer={<>
    {introHasMore && !busy && !notice && !result?.clarification && <button type="button" className="home-business-show-more" onClick={() => setPreviewExpanded(true)}>{en ? 'More businesses' : 'Още бизнеси'}<Icon name="chevronDown"/></button>}
    {moreError && <div className="discovery-notice" role="status"><p>{moreError === 'RATE_LIMITED' ? messages.rate : messages.error}</p><button type="button" className="secondary-button" onClick={onLoadMore}>{copy.retry}</button></div>}
  </>}>{rail}</DiscoveryBusinessList>
}

export function DiscoveryHomeBottom({ locale }) {
  const copy = HOME_DISCOVERY_COPY[locale]
  return <nav className="home-discovery-bottom" aria-label={locale === 'en' ? 'Discover more with GoRez' : 'Още от GoRez'}>
    <Link className="home-bottom-card home-bottom-partners" href={`/partners?lang=${locale}`} prefetch={false}><PartnerCardArt/><span className="home-bottom-copy"><strong>{copy.partners}</strong></span></Link>
    <Link className="home-bottom-card home-bottom-business" href={`/for-businesses?lang=${locale}`} prefetch={false} aria-label={copy.register}><span className="home-business-signup"><strong>{copy.registerAction}</strong><span className="home-free-label">{copy.free}</span></span></Link>
  </nav>
}

function PartnerCardArt() {
  return <span className="home-bottom-art home-bottom-art-partners" aria-hidden="true"><img src="/home-art/partners-3d-v2.webp" srcSet="/home-art/partners-3d-v2.webp 240w, /home-art/partners-3d-2x-v2.webp 480w" sizes="(max-width: 640px) 72px, 88px" width={240} height={120} alt="" loading="lazy" decoding="async"/></span>
}
