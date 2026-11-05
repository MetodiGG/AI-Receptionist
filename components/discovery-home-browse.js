'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Icon } from './icon'
import { DiscoveryHomeRail } from './discovery-home-rail'
import { useDirectory } from '../hooks/use-directory'
import { homeBusinesses, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { orderedRailRows } from '../lib/discovery/rail.mjs'
import { DiscoveryBusinessCard } from './discovery-business-card'
import { GoogleDiscoveryList } from './google-discovery-list'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'

export function DiscoveryHomeBusinesses({ locale, filters, preview = false, data, result, loading = false, error = '', onRetry, headingRef }) {
  const copy = HOME_DISCOVERY_COPY[locale], messages = DISCOVERY_COPY[locale], en = locale === 'en'
  const directory = useDirectory(preview ? data || { businesses: [], status: 'ready' } : null)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => setExpanded(false), [result])
  const rows = result ? orderedRailRows(result.results) : homeBusinesses(directory.businesses || [], filters).map(row => ({ ...row, source: 'gorez' }))
  const nearby = Boolean(result?.intent?.coordinates || (!result && filters.coordinates?.consent))
  const nearRows = rows.filter(row => row.proximityBand !== 'further'), farRows = rows.filter(row => row.proximityBand === 'further')
  const hasMore = Boolean(farRows.length || result?.furtherExternal)
  const busy = loading || (!result && !error && directory.status === 'loading')
  const notice = error ? error === 'RATE_LIMITED' ? messages.rate : messages.error : !result && directory.status === 'error' ? copy.unavailable : ''
  const card = row => <li key={`${row.source}:${row.id}`}><DiscoveryBusinessCard row={row} locale={locale} preview={preview} nearby={nearby}/></li>
  const google = (plan, key) => plan && <li key={key} className="home-google-chunk"><GoogleDiscoveryList plan={plan} locale={locale} rail nearby={nearby} onRetry={onRetry}/></li>
  const rail = !busy && !result?.clarification && <>
    {nearRows.map(card)}{google(result?.external, 'near-google')}
    {hasMore && !expanded && <li className="home-more-item"><button type="button" className="home-more-businesses" onClick={() => setExpanded(true)}>{en ? 'More businesses' : 'Още бизнеси'}<Icon name="arrow"/></button></li>}
    {expanded && <>{farRows.map(card)}{google(result?.furtherExternal, 'far-google')}</>}
  </>
  const empty = !busy && !notice && !result?.clarification && !nearRows.length && !result?.external && !hasMore
  return <DiscoveryHomeRail title={copy.explore} locale={locale} kind="businesses" headingRef={headingRef} busy={busy} onNearEnd={hasMore && !expanded ? () => setExpanded(true) : undefined} action={<Link href={`/partners?lang=${locale}`} prefetch={false}>{copy.all}<Icon name="arrow"/></Link>} message={<>
    {busy && <div className="home-browse-skeleton" role="status"><span className="sr-only">{messages.searching}</span><i/><i/><i/></div>}
    {notice && <div className="home-browse-empty" role="alert"><p>{notice}</p><button className="secondary-button" type="button" onClick={error ? onRetry : directory.retry}>{copy.retry}</button></div>}
    {result?.clarification && <p className="discovery-clarification" role="status">{result.clarification.message}</p>}
    {result?.appointmentClarification && <p className="discovery-clarification" role="status">{result.appointmentClarification.message}</p>}
    {result?.externalStatus === 'quota' && <p className="discovery-notice" role="status">{messages.quota}</p>}
    {result?.externalStatus === 'unavailable' && <p className="discovery-notice" role="status">{messages.unavailable}</p>}
    {result?.warnings?.includes('internal_unavailable') && <p className="discovery-notice" role="status">{messages.internalUnavailable}</p>}
    {empty && <p className="home-browse-empty" role="status">{en ? 'No matching businesses here yet. Try another service or area.' : 'Още няма подходящи бизнеси тук. Опитай друга услуга или район.'}</p>}
  </>}>{rail}</DiscoveryHomeRail>
}

export function DiscoveryHomeBottom({ locale }) {
  const copy = HOME_DISCOVERY_COPY[locale]
  return <nav className="home-discovery-bottom" aria-label={locale === 'en' ? 'Discover more with GoRez' : 'Още от GoRez'}>
    <Link className="home-bottom-card home-bottom-partners" href={`/partners?lang=${locale}`} prefetch={false}><HomeCardArt name="partners"/><span className="home-bottom-copy"><strong>{copy.partners}</strong><span>{copy.partnersHint}</span></span></Link>
    <Link className="home-bottom-card home-bottom-business" href={`/for-businesses?lang=${locale}`} prefetch={false} aria-label={`${copy.business} · ${copy.register}`}><HomeCardArt name="business"/><span className="home-bottom-copy"><strong>{copy.business}</strong><span>{copy.registerAction} <span className="home-free-label">{copy.free}</span></span></span></Link>
  </nav>
}

function HomeCardArt({ name }) {
  const version = name === 'partners' ? 2 : 1
  return <span className={`home-bottom-art home-bottom-art-${name}`} aria-hidden="true"><img src={`/home-art/${name}-3d-v${version}.webp`} srcSet={`/home-art/${name}-3d-v${version}.webp 240w, /home-art/${name}-3d-2x-v${version}.webp 480w`} sizes={name === 'partners' ? '64px' : '40px'} width={240} height={name === 'partners' ? 120 : 240} alt="" loading="lazy" decoding="async"/></span>
}
