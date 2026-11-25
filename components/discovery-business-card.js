'use client'

import Link from 'next/link'
import { ENGLISH_TRANSLATION_PENDING, publicProse, serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { memo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { BrandMark } from './brand-logo'
import { BusinessCoverPhoto } from './business-cover-photo'
import { OutboundBookingButton } from './outbound-booking-button'
import { PublicAction, PublicActionPair } from './public-action'
import { isOffsiteBooking } from '../lib/booking-mode.mjs'
import { homeBusinessPhoto } from '../lib/discovery/home.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { serviceSourcePresentation } from '../lib/discovery/service-presentation.mjs'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { businessDirectionsAddress } from '../lib/business-directions.mjs'
import { DiscoveryDistanceBadge } from './discovery-distance-badge'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { trackSearchEvent } from '../lib/search-analytics-client.js'

const DiscoveryBusinessDetails = dynamic(() => import('./discovery-business-details').then(module => module.DiscoveryBusinessDetails))

function previewPrice(service, locale) {
  const price = detailPriceLabel({ ...service, priceUnit: '', presentationEn: undefined }, locale, { compact: true })
  if (!price) return null
  // Keep the tariff basis alongside the amount (e.g. per visit vs per lesson).
  // The full published unit and terms, not a loose text preview, stay in the menu.
  const displayUnit = serviceDisplayUnit(service, locale)
  if (displayUnit === ENGLISH_TRANSLATION_PENDING) return null
  const [unit, ...qualifiers] = displayUnit.split(/\s+·\s+/u)
  const tax = qualifiers.find(part => /^(?:без ДДС|с ДДС|excluding VAT|including VAT|VAT (?:excluded|included))$/iu.test(part))
  const onlineOnly = serviceSourcePresentation(service, 'en').conditions.includes('Online-only discount')
  const rate = [unit, tax, onlineOnly && (locale === 'en' ? 'online only' : 'само онлайн')].filter(Boolean).join(' · ')
  return price + (rate ? `${unit ? ' / ' : ' · '}${rate}` : '')
}

export const DiscoveryBusinessCard = memo(function DiscoveryBusinessCard({ row, locale = 'bg', preview = false, distanceOrigin = null }) {
  const en = locale === 'en', internal = row.source === 'gorez'
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg
  const viewDetails = copy.viewDetailsLower.replace(/^./u, letter => letter.toUpperCase())
  const directionsLabel = en ? copy.directions : 'Упъти'
  const locationPending = en ? 'Location is being verified' : 'Локацията се уточнява'
  const services = railServiceItems(row)
  const [failedPhoto, setFailedPhoto] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false), detailsTrigger = useRef(null)
  const hasDetails = internal || row.source === 'catalogue'
  const openDetails = event => {
    if (detailsOpen) return
    detailsTrigger.current = event.currentTarget
    setDetailsOpen(true)
    if (!preview) trackSearchEvent({ event: 'profile', locale })
  }
  const photo = internal ? homeBusinessPhoto(row)
    : row.source === 'catalogue' && isCataloguePhotoSource(row.photo?.src)
      ? { ...row.photo, alt: { [locale]: publicProse(row.photo.alt, locale) || row.name } } : null

  // The hydrated details reuse the existing trusted routes.
  // Visual changes never turn phone/external actions into GoRez confirmations.
  const actions = (business = row) => {
    const directions = railDirections(business)
    const internalBooking = business.source === 'gorez'
    const profile = internalBooking && business.slug ? `/book/${encodeURIComponent(business.slug)}?lang=${locale}` : null
    const action = railExternalAction(business)
    return <PublicActionPair className="home-business-actions">
      {directions ? (preview
        ? <PublicAction as="span" variant="secondary" aria-disabled="true">{directionsLabel}</PublicAction>
        : <PublicAction as="a" variant="secondary" href={directions} target="_blank" rel="noopener noreferrer" aria-label={`${directionsLabel} · ${business.name}`} title={en ? 'Opens Google Maps directions' : 'Отваря упътвания в Google Maps'}>{directionsLabel}</PublicAction>)
        : businessDirectionsAddress(business) && <PublicAction as="span" variant="secondary" role="link" aria-disabled="true" aria-label={`${directionsLabel} · ${locationPending}`} title={locationPending}>{directionsLabel}</PublicAction>}
      {preview ? (internalBooking || action) && <PublicAction as="span" variant="primary" aria-disabled="true">{copy.reserveAppointment}</PublicAction>
        : internalBooking ? profile && (isOffsiteBooking(business)
          ? <OutboundBookingButton business={business} locale={locale}>{copy.reserveAppointment}</OutboundBookingButton>
          : <PublicAction as={Link} variant="primary" href={profile} prefetch={false}>{copy.reserveAppointment}</PublicAction>)
        : action?.kind === 'verified' ? <OutboundBookingButton linkId={action.id} locale={locale}>{copy.reserveAppointment}</OutboundBookingButton>
        : action && <PublicAction as="a" variant="primary" href={action.href} target={action.kind === 'form' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса')} · ${business.name}`}>{copy.reserveAppointment}</PublicAction>}
    </PublicActionPair>
  }

  return <article className="home-business-card is-compact-preview" data-source={row.source}>
    <div className="home-business-heading">
      <div className={`home-business-photo${photo && photo.src !== failedPhoto ? ' is-real-photo' : ''}`}>
        {photo && photo.src !== failedPhoto
          ? <img src={photo.src} width={photo.width || 400} height={photo.height || 300} alt={publicProse(photo.alt, locale) || row.name} loading="lazy" decoding="async" style={businessPhotoStyle(photo, { preview: true })} onError={() => setFailedPhoto(photo.src)}/>
          : <BusinessCoverPhoto business={row} locale={locale}/>}
        <DiscoveryDistanceBadge origin={distanceOrigin} destination={row.coordinates} locale={locale} business={row} distanceOnly/>
      </div>
      <div className="home-business-identity">
        {internal && <span className="home-business-partner"><BrandMark size={20}/>{en ? 'GoRez Partner' : 'Партньор на GoRez'}</span>}
        <h3 title={row.name}>{row.name}</h3>
        {services.length > 0 && <ul className="home-business-service-preview" aria-label={copy.servicesLabel}>{services.map((service,index) => {
          const price = previewPrice(service, locale)
          return <li key={service.id || `${service.name}-${index}`}>
            <strong className="home-business-preview-name">{serviceDisplayName(service, locale)}</strong>
            {price && <span className="home-business-preview-price">{price}</span>}
          </li>
        })}</ul>}
        {/* The visible native button is the only control and its hit area
            stretches to the card, preserving the existing photo/name click. */}
        {hasDetails ? <button type="button" className="home-business-open" onClick={openDetails} aria-haspopup="dialog" aria-label={`${viewDetails} · ${row.name}`}>{viewDetails}</button> : actions()}
      </div>
    </div>
    {detailsOpen && <DiscoveryBusinessDetails row={row} locale={locale} preview={preview} onClose={() => setDetailsOpen(false)} triggerRef={detailsTrigger} actions={actions}/>}
    {row.source === 'google' && <span className="home-google-attribution" translate="no">Google Maps</span>}
    {row.source === 'google' && row.attributions?.length > 0 && <div className="home-provider-attributions">{row.attributions.map((item,index) => item.url ? <a key={index} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span key={index}>{item.name}</span>)}</div>}
  </article>
})
