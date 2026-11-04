'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from './icon'
import { DiscoveryHomeRail } from './discovery-home-rail'
import { useDirectory } from '../hooks/use-directory'
import { homeBusinesses, homeBusinessPhoto, HOME_DISCOVERY_COPY } from '../lib/discovery/home.mjs'
import { getIndustryLabel } from '../lib/public-locale.mjs'
import { isExternalBooking } from '../lib/booking-mode.mjs'
import { OutboundBookingButton } from './outbound-booking-button'
import { BrandMark } from './brand-logo'

export function DiscoveryHomeBusinesses({ locale, filters, preview = false, data }) {
  const copy = HOME_DISCOVERY_COPY[locale]
  const directory = useDirectory(preview ? data || { businesses: [], status: 'ready' } : null)
  const rows = homeBusinesses(directory.businesses || [], filters)
  const title = copy.explore // No defensible public popularity metric exists yet.
  if (directory.status === 'loading') return <section className="home-discovery-section" aria-busy="true"><h2>{title}</h2><div className="home-browse-skeleton" role="status"><span className="sr-only">{locale === 'en' ? 'Loading businesses…' : 'Зареждане на бизнесите…'}</span><i/><i/><i/></div></section>
  if (directory.status === 'error') return <section className="home-discovery-section"><h2>{title}</h2><div className="home-browse-empty" role="status"><p>{copy.unavailable}</p><button className="secondary-button" type="button" onClick={directory.retry}>{copy.retry}</button></div></section>
  if (!rows.length) return <section className="home-discovery-section"><h2>{title}</h2><p className="home-browse-empty">{copy.noBusinesses}</p></section>
  return <DiscoveryHomeRail title={title} locale={locale} kind="businesses" action={<Link href={`/partners?lang=${locale}`} prefetch={false}>{copy.all}<Icon name="arrow"/></Link>}>{rows.map(row => <li key={row.id}><HomeBusinessCard row={row} locale={locale} preview={preview}/></li>)}</DiscoveryHomeRail>
}

function HomeBusinessCard({ row, locale, preview }) {
  const copy = HOME_DISCOVERY_COPY[locale], [failed, setFailed] = useState(false)
  const photo = homeBusinessPhoto(row), href = `/book/${row.slug}?lang=${locale}`
  const visual = <><div className="home-business-photo">{photo && !failed ? <img src={photo.src} width={400} height={300} alt={photo.alt?.[locale] || row.name} loading="lazy" decoding="async" style={{ objectPosition: photo.position || 'center' }} onError={() => setFailed(true)}/> : <div className="home-business-no-photo"><Icon name="store"/><span>{copy.noPhoto}</span></div>}{Number.isFinite(row.distanceKm) && row.distanceKm >= 0 && <span className="home-distance-badge"><Icon name="pin"/>{new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 1 }).format(row.distanceKm)} km</span>}</div></>
  return <article className="home-business-card">
    {preview ? visual : <Link href={href} prefetch={false} aria-label={`${copy.profile} · ${row.name}`}>{visual}</Link>}
    <span className="home-business-partner"><BrandMark size={20}/>{locale === 'en' ? 'GoRez partner' : 'GoRez партньор'}</span>
    <h3>{preview ? row.name : <Link href={href} prefetch={false}>{row.name}</Link>}</h3>
    <p className="home-business-category">{getIndustryLabel(row.industry, locale)}</p>
    {preview ? <span className="home-reserve" aria-disabled="true">{copy.reserve}</span> : isExternalBooking(row) ? <OutboundBookingButton business={row} locale={locale} className="home-reserve">{copy.reserve}<Icon name="external"/></OutboundBookingButton> : <Link className="home-reserve" href={href} prefetch={false}>{copy.reserve}<Icon name="arrow"/></Link>}
  </article>
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
