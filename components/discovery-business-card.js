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
import { BookingButtonContent } from './booking-button-content'
import { isOffsiteBooking } from '../lib/booking-mode.mjs'
import { homeBusinessPhoto } from '../lib/discovery/home.mjs'
import { railCategory, railServiceItems, railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { DiscoveryDistanceBadge } from './discovery-distance-badge'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { trackSearchEvent } from '../lib/search-analytics-client.js'
const DiscoveryBusinessDetails = dynamic(() => import('./discovery-business-details').then(module => module.DiscoveryBusinessDetails))

const emptyReviews = { summary: { count: 0 }, items: [] }
function PartnerRailReviews({ row, locale, preview }) {
  const reviews = useBusinessReviews(row.slug, preview ? row.reviews || emptyReviews : null)
  return <div className="home-business-reviews"><PartnerReviewSummary slug={row.slug} reviews={reviews} locale={locale} preview={preview} includeGoogle={!preview && row.googleRatingsEnabled !== false} compact/></div>
}

export const DiscoveryBusinessCard = memo(function DiscoveryBusinessCard({ row, locale = 'bg', nearby = false, preview = false, distanceOrigin = null, quickChoice = false }) {
  const en = locale === 'en', internal = row.source === 'gorez', [failedPhoto, setFailedPhoto] = useState(null)
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg
  const [detailsOpen, setDetailsOpen] = useState(false), detailsTrigger = useRef(null)
  const hasDetails = internal || row.source === 'catalogue'
  const openDetails = event => { detailsTrigger.current = event.currentTarget; setDetailsOpen(true); if (!preview) trackSearchEvent({ event: 'profile', locale }) }
  const photo = internal ? homeBusinessPhoto(row) : row.source === 'catalogue' && isCataloguePhotoSource(row.photo?.src) ? { ...row.photo, alt: { [locale]: row.photo.alt || row.name } } : null
  const reserve = quickChoice
    ? <span className="booking-button-content"><Icon name="calendar"/><span className="booking-button-label">{copy.reserveAppointment}</span></span>
    : <BookingButtonContent>{copy.reserveAppointment}</BookingButtonContent>
  const directionsLabel = copy.directions
  const services = railServiceItems(row)
  // The hint describes the destination, never a confirmed appointment.
  // It is presentation-only; the trusted actions below retain their routes.
  const externalAction = !internal && railExternalAction(row)
  const bookingHint = internal && row.slug
    ? row.booking_mode === 'phone' ? copy.cardBookingPhone : isOffsiteBooking(row) ? copy.cardBookingExternal : copy.cardBookingNative
    : externalAction ? externalAction.kind === 'phone' ? copy.cardBookingPhone : copy.cardBookingExternal : ''
  const distance = <DiscoveryDistanceBadge origin={distanceOrigin} destination={row.coordinates} locale={locale} business={row}/>
  const visual = <div className={`home-business-photo${photo && photo.src !== failedPhoto ? ' is-real-photo' : ''}`}>
    {photo && photo.src !== failedPhoto ? <img src={photo.src} width={photo.width || 400} height={photo.height || 300} alt={photo.alt?.[locale] || row.name} loading="lazy" decoding="async" style={businessPhotoStyle(photo, { preview: true })} onError={() => setFailedPhoto(photo.src)}/> : <BusinessCoverPhoto business={row} locale={locale}/>}
    {!quickChoice && distance}
    {hasDetails && !quickChoice && <span className="home-business-details-label">{copy.viewDetailsLower}</span>}
  </div>
  const identity = <>
    {internal && <span className="home-business-partner"><BrandMark size={20}/>{en ? 'GoRez Partner' : 'Партньор на GoRez'}</span>}
    <h3 title={row.name}>{row.name}</h3>
    <p className="home-business-category">{railCategory(row, locale)}{(row.neighborhood || row.city) && <span className="home-business-neighborhood"> · {row.neighborhood || row.city}</span>}</p>
    {quickChoice && <div className="home-business-meta">{distance}{hasDetails && <button type="button" className="home-business-inline-details" onClick={openDetails} aria-haspopup="dialog" aria-label={`${copy.detailsLabel} · ${row.name}`}>{copy.viewDetailsLower}<Icon name="arrow"/></button>}</div>}
  </>
  const serviceList = services.length > 0 && <ul className="home-business-services" aria-label={copy.servicesPrices}>{services.map(service => {
    const price = detailPriceLabel({ ...service, priceUnit: '' }, locale, { compact: true })
    const { conditions } = servicePresentation(service, locale)
    return <li key={service.name}><div className="service-photo-name"><ServiceThumbnail service={service} business={row} locale={locale} size={32}/><div className="home-service-copy"><span className="home-service-name" title={service.name}>{service.name}</span>{conditions.map(condition => <small className="home-service-condition" key={condition}>{condition}</small>)}</div></div>{price && <strong className="home-service-price">{price}{service.priceUnit && <small className="service-price-unit">{service.priceUnit}</small>}</strong>}</li>
  })}</ul>
  const reviews = internal ? <PartnerRailReviews row={row} locale={locale} preview={preview}/> : Number.isFinite(row.rating) && row.rating > 0 ? <div className="home-business-reviews">{row.reviewCount > 0 ? <ReviewSummary summary={{ average: row.rating, count: row.reviewCount }} status="ready" locale={locale} compact/> : <span>★ {row.rating} / 5</span>}</div> : null
  const actions = (business = row) => {
    const directions = railDirections(business)
    const internalBooking = business.source === 'gorez'
    const profile = internalBooking && business.slug ? `/book/${encodeURIComponent(business.slug)}?lang=${locale}` : null
    const action = railExternalAction(business)
    return <div className="home-business-actions">
      {directions && (preview ? <span className="home-directions" aria-disabled="true"><Icon name="map"/><span className="home-maps-label">{directionsLabel}</span></span> : <a className="home-directions" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`${directionsLabel} · ${business.name}`} title={en ? 'Opens Google Maps directions' : 'Отваря упътвания в Google Maps'}><Icon name="map"/><span className="home-maps-label">{directionsLabel}</span></a>)}
      {preview ? (internalBooking || action) && <span className="home-reserve" aria-disabled="true">{reserve}</span> : internalBooking ? profile && (isOffsiteBooking(business) ? <OutboundBookingButton business={business} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : <Link className="home-reserve" href={profile} prefetch={false}>{reserve}</Link>) : action?.kind === 'verified' ? <OutboundBookingButton linkId={action.id} locale={locale} className="home-reserve">{reserve}</OutboundBookingButton> : action && <a className="home-reserve" href={action.href} target={action.kind === 'form' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса')} · ${business.name}`}>{reserve}</a>}
    </div>
  }
  return <article className="home-business-card" data-source={row.source}>
    {hasDetails && !quickChoice && <button type="button" className="home-business-open" onClick={openDetails} aria-haspopup="dialog" aria-label={`${copy.detailsLabel} · ${row.name}`}/>}
    {quickChoice ? <div className="home-business-heading">{visual}<div className="home-business-identity">{identity}{reviews}</div></div> : <>{visual}{identity}</>}
    {serviceList}
    {!quickChoice && reviews}
    <div className="home-business-footer">
      {quickChoice && bookingHint && <p className="home-business-booking-hint">{bookingHint}</p>}
      {actions()}
    </div>
    {detailsOpen && <DiscoveryBusinessDetails row={row} locale={locale} preview={preview} onClose={() => setDetailsOpen(false)} triggerRef={detailsTrigger} actions={actions}/>}
    {row.source === 'google' && <span className="home-google-attribution" translate="no">Google Maps</span>}
    {row.source === 'google' && row.attributions?.length > 0 && <div className="home-provider-attributions">{row.attributions.map((item,index) => item.url ? <a key={index} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span key={index}>{item.name}</span>)}</div>}
  </article>
})
