'use client'

import Link from 'next/link'
import { memo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Icon } from './icon'
import { BrandMark } from './brand-logo'
import { BusinessCoverPhoto } from './business-cover-photo'
import { ServiceThumbnail } from './service-thumbnail'
import { useBusinessReviews, ReviewSummary, PartnerReviewSummary } from './business-reviews'
import { OutboundBookingButton } from './outbound-booking-button'
import { isExternalBooking } from '../lib/booking-mode.mjs'
import { homeBusinessPhoto } from '../lib/discovery/home.mjs'
import { railCategory, railServiceItems, railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { DiscoveryDistanceBadge } from './discovery-distance-badge'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
const DiscoveryBusinessDetails = dynamic(() => import('./discovery-business-details').then(module => module.DiscoveryBusinessDetails))

const emptyReviews = { summary: { count: 0 }, items: [] }
function PartnerRailReviews({ row, locale, preview }) {
  const reviews = useBusinessReviews(row.slug, preview ? row.reviews || emptyReviews : null)
  return <div className="home-business-reviews"><PartnerReviewSummary slug={row.slug} reviews={reviews} locale={locale} preview={preview} includeGoogle={!preview && row.googleRatingsEnabled !== false} compact/></div>
}

export const DiscoveryBusinessCard = memo(function DiscoveryBusinessCard({ row, locale = 'bg', nearby = false, preview = false, distanceOrigin = null }) {
  const en = locale === 'en', internal = row.source === 'gorez', [failedPhoto, setFailedPhoto] = useState(null)
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg
  const [detailsOpen, setDetailsOpen] = useState(false), detailsTrigger = useRef(null)
  const hasDetails = internal || row.source === 'catalogue'
  const openDetails = event => { detailsTrigger.current = event.currentTarget; setDetailsOpen(true) }
  const photo = internal ? homeBusinessPhoto(row) : row.source === 'catalogue' && isCataloguePhotoSource(row.photo?.src) ? { src: row.photo.src, alt: { [locale]: row.photo.alt || row.name } } : null
  const profile = internal ? `/book/${row.slug}?lang=${locale}` : null
  const directions = railDirections(row), action = railExternalAction(row)
  const reserve = copy.reserveAppointment
  const directionsLabel = copy.directions
  const services = railServiceItems(row)
  const visual = <div className="home-business-photo">
    {photo && photo.src !== failedPhoto ? <img src={photo.src} width={400} height={300} alt={photo.alt?.[locale] || row.name} loading="lazy" decoding="async" style={{ objectPosition: photo.position || 'center' }} onError={() => setFailedPhoto(photo.src)}/> : <BusinessCoverPhoto business={row} locale={locale}/>}
    <DiscoveryDistanceBadge origin={distanceOrigin} destination={row.coordinates} locale={locale} fallbackKm={nearby ? row.distanceKm : null} business={row}/>
    {hasDetails && <span className="home-business-details-label">{copy.viewDetailsLower}</span>}
  </div>
  const actions = <div className="home-business-actions">
      {directions && (preview ? <span className="home-directions" aria-disabled="true"><Icon name="map"/><span className="home-maps-label">{directionsLabel}</span></span> : <a className="home-directions" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`${directionsLabel} · ${row.name}`} title={en ? 'Opens Google Maps directions' : 'Отваря упътвания в Google Maps'}><Icon name="map"/><span className="home-maps-label">{directionsLabel}</span></a>)}
      {preview ? (internal || action) && <span className="home-reserve" aria-disabled="true">{reserve}</span> : internal ? isExternalBooking(row) ? <OutboundBookingButton business={row} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : <Link className="home-reserve" href={profile} prefetch={false}>{reserve}</Link> : action?.kind === 'verified' ? <OutboundBookingButton linkId={action.id} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : action && <a className="home-reserve" href={action.href} target={['website', 'form'].includes(action.kind) ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : action.kind === 'form' ? (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса') : (en ? 'Ask about booking on the business website' : 'Запитване за час в сайта на бизнеса')} · ${row.name}`} title={action.kind === 'website' ? (en ? 'Opens the business website; online booking is not verified' : 'Отваря сайта на бизнеса; онлайн резервацията не е потвърдена') : undefined}>{reserve}</a>}
    </div>
  return <article className="home-business-card" data-source={row.source}>
    {hasDetails && <button type="button" className="home-business-open" onClick={openDetails} aria-haspopup="dialog" aria-label={`${copy.detailsLabel} · ${row.name}`}/>}
    {visual}
    {internal && <span className="home-business-partner"><BrandMark size={20}/>{en ? 'GoRez partner' : 'GoRez партньор'}</span>}
    <h3 title={row.name}>{row.name}</h3>
    <p className="home-business-category">{railCategory(row, locale)}</p>
    {services.length > 0 && <ul className="home-business-services" aria-label={copy.servicesPrices}>{services.map(service => {
      const price = detailPriceLabel(service, locale, { compact: true })
      return <li key={service.name}><div className="service-photo-name"><ServiceThumbnail service={service} business={row} locale={locale} size={32}/><span className="home-service-name" title={service.name}>{service.name}</span></div>{price && <strong className="home-service-price">{price}</strong>}</li>
    })}</ul>}
    {internal ? <PartnerRailReviews row={row} locale={locale} preview={preview}/> : Number.isFinite(row.rating) && row.rating > 0 ? <div className="home-business-reviews">{row.reviewCount > 0 ? <ReviewSummary summary={{ average: row.rating, count: row.reviewCount }} status="ready" locale={locale} compact/> : <span>★ {row.rating} / 5</span>}</div> : null}
    <div className="home-business-footer">
      {actions}
    </div>
    {detailsOpen && <DiscoveryBusinessDetails row={row} locale={locale} preview={preview} onClose={() => setDetailsOpen(false)} triggerRef={detailsTrigger} actions={actions}/>}
    {row.source === 'google' && <span className="home-google-attribution" translate="no">Google Maps</span>}
    {row.source === 'google' && row.attributions?.length > 0 && <div className="home-provider-attributions">{row.attributions.map((item,index) => item.url ? <a key={index} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span key={index}>{item.name}</span>)}</div>}
  </article>
})
