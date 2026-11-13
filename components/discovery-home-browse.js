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
const GoogleBusinessCard = dynamic(() => import('./google-business-card').then(module => module.GoogleBusinessCard))
const GoogleDiscoveryList = dynamic(() => import('./google-discovery-list').then(module => module.GoogleDiscoveryList))
const noDirectory = Object.freeze({ businesses: [], status: 'ready' })

export function DiscoveryHomeBusinesses({ locale, filters, preview = false, data, result, resultKey, loading = false, error = '', onRetry, headingRef, onLoadMore, loadingMore = false, moreError = '', directoryEnabled = true }) {
  const copy = HOME_DISCOVERY_COPY[locale], messages = DISCOVERY_COPY[locale], en = locale === 'en'
  // The homepage starts the authoritative, paged catalogue browse immediately;
  // a parallel partner-only directory request is redundant there. The legacy
  // non-home fallback and explicitly supplied local fixtures remain unchanged.
  const directory = useDirectory(preview ? data || noDirectory : directoryEnabled ? null : noDirectory)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [resultKey ?? result?.checkedAt])
  const catalogueMode = ['catalogue', 'sofia_only'].includes(result?.externalStatus)
  const rows = useMemo(() => result ? orderedRailRows(result.results, { preserveOrder: catalogueMode }) : homeBusinesses(directory.businesses || [], filters).map(row => ({ ...row, source: 'gorez' })),
    [result, catalogueMode, directory.businesses, filters.cityCode, filters.neighborhood, filters.category, filters.radiusKm, filters.nearby, filters.coordinates])
  const nearby = Boolean(result?.intent?.coordinates || (!result && filters.coordinates?.consent))
  const distanceOrigin = useMemo(() => discoveryDistanceOrigin({ coordinates: filters.coordinates, cityCode: result?.intent?.cityCode || filters.cityCode }), [filters.coordinates, result?.intent?.cityCode, filters.cityCode])
  const [nearRows, farRows] = useMemo(() => [rows.filter(row => row.proximityBand !== 'further'), rows.filter(row => row.proximityBand === 'further')], [rows])
  const showFurther = catalogueMode || expanded || (!nearRows.length && !result?.external)
  const hiddenFurther = Boolean(farRows.length || result?.furtherExternal) && !showFurther
  const nextPage = result?.cataloguePage?.nextOffset != null && Boolean(onLoadMore)
  const hasMore = hiddenFurther || nextPage
  function advanceBusinesses() { if (hiddenFurther) setExpanded(true); else if (nextPage && !loadingMore && !moreError) onLoadMore() }
  const busy = loading || (!result && !error && directory.status === 'loading')
  const notice = error ? error === 'RATE_LIMITED' ? messages.rate : messages.error : !result && directory.status === 'error' ? copy.unavailable : ''
  const card = row => <li key={`${row.source}:${row.id}`}><DiscoveryBusinessCard row={row} locale={locale} preview={preview} nearby={nearby} distanceOrigin={distanceOrigin}/></li>
  const google = (plan, key) => plan?.mode === 'ui_kit_cards' ? plan.cards.map(item => <li key={`${key}:${item.placeId}`}><GoogleBusinessCard card={item} locale={locale} providerLocale={plan.locale} nearby={nearby} distanceOrigin={distanceOrigin}/></li>) : plan && <li key={key} className="home-google-chunk"><GoogleDiscoveryList plan={plan} locale={locale} rail vertical nearby={nearby} onRetry={onRetry}/></li>
  const rail = !busy && !result?.clarification && <>
    {nearRows.map(card)}{google(result?.external, 'near-google')}
    {showFurther && <>{farRows.map(card)}{google(result?.furtherExternal, 'far-google')}</>}
    {loadingMore && <li className="home-rail-loading"><BrandLoading locale={locale} label={en ? 'Loading businesses…' : 'Зареждаме бизнеси…'}/></li>}
  </>
  const empty = !busy && !notice && !result?.clarification && !rows.length && !result?.external && !result?.furtherExternal && !nextPage
  return <DiscoveryBusinessList title={copy.explore} locale={locale} headingRef={headingRef} busy={busy} hasMore={hasMore} pending={loadingMore} requireScrollIntent={Boolean(hiddenFurther && result?.furtherExternal)} resetKey={resultKey ?? result?.checkedAt} pageKey={`${hiddenFurther ? 'further' : 'page'}:${result?.cataloguePage?.nextOffset ?? 'end'}:${rows.length}`} onNearEnd={hasMore && !loadingMore && !moreError ? advanceBusinesses : undefined} action={catalogueMode ? null : <Link href={`/partners?lang=${locale}`} prefetch={false}>{copy.all}<Icon name="arrow"/></Link>} message={<>
    {busy && <div className="home-browse-skeleton" role="status"><BrandLoading locale={locale} label={messages.searching} announce={false}/><i aria-hidden="true"/><i aria-hidden="true"/><i aria-hidden="true"/></div>}
    {notice && <div className="home-browse-empty" role="alert"><p>{notice}</p><button className="secondary-button" type="button" onClick={error ? onRetry : directory.retry}>{copy.retry}</button></div>}
    {result?.clarification && <p className="discovery-clarification" role="status">{result.clarification.message}</p>}
    {result?.appointmentClarification && <p className="discovery-clarification" role="status">{result.appointmentClarification.message}</p>}
    {result?.externalStatus === 'quota' && <p className="discovery-notice" role="status">{messages.quota}</p>}
    {result?.externalStatus === 'unavailable' && <p className="discovery-notice" role="status">{messages.unavailable}</p>}
    {result?.warnings?.includes('catalogue_sofia_only') && <p className="discovery-notice" role="status">{en ? 'The reviewed catalogue currently covers Sofia. GoRez partners in other cities are still searchable.' : 'Провереният каталог засега е за София. Партньорите на GoRez в други градове остават достъпни.'}</p>}
    {result?.warnings?.includes('catalogue_unavailable') && <p className="discovery-notice" role="status">{en ? 'The catalogue is temporarily unavailable. GoRez bookings remain available.' : 'Каталогът временно не е достъпен. Резервациите в GoRez продължават да работят.'}</p>}
    {result?.warnings?.includes('internal_unavailable') && <p className="discovery-notice" role="status">{messages.internalUnavailable}</p>}
    {empty && <p className="home-browse-empty" role="status">{en ? 'No matching businesses here yet. Try another service or area.' : 'Още няма подходящи бизнеси тук. Опитай друга услуга или район.'}</p>}
  </>} footer={moreError && <div className="discovery-notice" role="status"><p>{moreError === 'RATE_LIMITED' ? messages.rate : messages.error}</p><button type="button" className="secondary-button" onClick={onLoadMore}>{copy.retry}</button></div>}>{rail}</DiscoveryBusinessList>
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
