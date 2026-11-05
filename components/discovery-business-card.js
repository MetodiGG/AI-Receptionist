'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Icon } from './icon'
import { BrandMark } from './brand-logo'
import { BusinessCategoryIcon } from './business-category-icon'
import { useBusinessReviews, ReviewSummary } from './business-reviews'
import { OutboundBookingButton } from './outbound-booking-button'
import { isExternalBooking } from '../lib/booking-mode.mjs'
import { homeBusinessPhoto } from '../lib/discovery/home.mjs'
import { railCategory, railDirections, railExternalAction } from '../lib/discovery/rail.mjs'

const emptyReviews = { summary: { count: 0 }, items: [] }
function PartnerRailReviews({ row, locale, preview }) {
  const reviews = useBusinessReviews(row.slug, preview ? row.reviews || emptyReviews : null)
  return <div className="home-business-reviews"><ReviewSummary summary={reviews.data?.summary} status={reviews.status} locale={locale} compact/></div>
}

export function DiscoveryBusinessCard({ row, locale = 'bg', nearby = false, preview = false }) {
  const en = locale === 'en', internal = row.source === 'gorez', [failed, setFailed] = useState(false)
  const photo = internal ? homeBusinessPhoto(row) : null
  const profile = internal ? `/book/${row.slug}?lang=${locale}` : null
  const directions = railDirections(row), action = railExternalAction(row)
  const reserve = en ? 'Reserve now' : 'Резервирай'
  const visual = <div className="home-business-photo">
    {photo && !failed ? <img src={photo.src} width={400} height={300} alt={photo.alt?.[locale] || row.name} loading="lazy" decoding="async" style={{ objectPosition: photo.position || 'center' }} onError={() => setFailed(true)}/> : <div className="home-business-illustration"><BusinessCategoryIcon category={row.category} business={row} size={112}/></div>}
    {nearby && Number.isFinite(row.distanceKm) && row.distanceKm >= 0 && <span className="home-distance-badge"><Icon name="pin"/>{new Intl.NumberFormat(en ? 'en-GB' : 'bg-BG', { maximumFractionDigits: 1 }).format(row.distanceKm)} km</span>}
  </div>
  return <article className="home-business-card">
    {profile && !preview ? <Link href={profile} prefetch={false} aria-label={`${en ? 'View profile' : 'Виж профила'} · ${row.name}`}>{visual}</Link> : visual}
    {internal && <span className="home-business-partner"><BrandMark size={20}/>{en ? 'GoRez partner' : 'GoRez партньор'}</span>}
    <h3>{profile && !preview ? <Link href={profile} prefetch={false}>{row.name}</Link> : row.name}</h3>
    <p className="home-business-category">{railCategory(row, locale)}</p>
    {internal ? <PartnerRailReviews row={row} locale={locale} preview={preview}/> : Number.isFinite(row.rating) && row.rating > 0 ? <div className="home-business-reviews">{row.reviewCount > 0 ? <ReviewSummary summary={{ average: row.rating, count: row.reviewCount }} status="ready" locale={locale} compact/> : <span>★ {row.rating} / 5</span>}</div> : null}
    {!nearby && row.address && <p className="home-business-address">{row.address}</p>}
    <div className="home-business-actions">
      {directions && (preview ? <span className="home-directions" aria-disabled="true"><Icon name="map"/><span className="home-maps-label" translate="no">Google Maps</span></span> : <a className="home-directions" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`${en ? 'Google Maps directions' : 'Упътване в Google Maps'} · ${row.name}`}><Icon name="map"/><span className="home-maps-label" translate="no">Google Maps</span></a>)}
      {preview ? (internal || action) && <span className="home-reserve" aria-disabled="true">{!internal && action?.kind === 'website' ? (en ? 'Visit website' : 'Виж сайта') : reserve}</span> : internal ? isExternalBooking(row) ? <OutboundBookingButton business={row} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : <Link className="home-reserve" href={profile} prefetch={false}>{reserve}</Link> : action?.kind === 'verified' ? <OutboundBookingButton linkId={action.id} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : action && <a className="home-reserve" href={action.href} target={action.kind === 'website' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to reserve' : 'Обади се за час') : (en ? 'Open business website' : 'Отвори сайта на бизнеса')} · ${row.name}`}>{action.kind === 'phone' ? <><Icon name="phone"/>{reserve}</> : en ? 'Visit website' : 'Виж сайта'}</a>}
    </div>
    {row.source === 'google' && !directions && <span className="home-google-attribution" translate="no">Google Maps</span>}
    {row.source === 'google' && row.attributions?.length > 0 && <div className="home-provider-attributions">{row.attributions.map((item,index) => item.url ? <a key={index} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span key={index}>{item.name}</span>)}</div>}
  </article>
}
