'use client'

import Link from 'next/link'
import { publicProse, serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { memo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Icon } from './icon'
import { BrandMark } from './brand-logo'
import { BusinessCoverPhoto } from './business-cover-photo'
import { OutboundBookingButton } from './outbound-booking-button'
import { PublicAction, PublicActionPair } from './public-action'
import { isOffsiteBooking } from '../lib/booking-mode.mjs'
import { homeBusinessPhoto } from '../lib/discovery/home.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { businessPhotoStyle } from '../lib/business-photo-layout.mjs'
import { DiscoveryDistanceBadge } from './discovery-distance-badge'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { trackSearchEvent } from '../lib/search-analytics-client.js'
import { DirectionsUnavailable } from './directions-unavailable'

const DiscoveryBusinessDetails = dynamic(() => import('./discovery-business-details').then(module => module.DiscoveryBusinessDetails))

// Keep price terms intact unless the exact same scope is already in the
// displayed name. This only changes copy, never the underlying tariff or menu.
function compactPosterUnit(unit, name, locale) {
  const fold = value => value.normalize('NFC').toLowerCase().trim().replace(/\s+/gu, ' ')
  const title = fold(name)
  const basis = fold(unit)
  if (locale === 'en') {
    const pass = /^(pass for [1-9]\d* training sessions) within ([1-9]\d*) (months?)$/u.exec(basis)
    if (pass && title.split(/\s+[—–-]\s+/u).at(-1) === pass[1]) return `Valid for ${pass[2]} ${pass[3]}`
    if (/^(?:one|single) individual visit for (?:1|one) person$/u.test(basis)
      && /^individual .*\s·\s(?:1|one) person$/u.test(title)) return ''
  } else {
    const pass = /^(карта за [1-9]\d* тренировки) в рамките на ([1-9]\d*) (месец[а]?)$/u.exec(basis)
    if (pass && title.split(/\s+[—–-]\s+/u).at(-1) === pass[1]) return `Валидна ${pass[2]} ${pass[3]}`
    if (/^едно индивидуално посещение за (?:1|един) човек$/u.test(basis)
      && /^индивидуалн[аоия] .*\s·\s(?:1|един) човек$/u.test(title)) return ''
  }
  return unit
}

export const DiscoveryBusinessCard = memo(function DiscoveryBusinessCard({ row, locale = 'bg', preview = false, distanceOrigin = null }) {
  const en = locale === 'en', internal = row.source === 'gorez'
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg
  const directionsLabel = en ? copy.directions : 'Маршрут'
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

  // Both the card and its hydrated details reuse these exact trusted routes.
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
        : <DirectionsUnavailable key={`${business.id}:${business.address || ''}`} business={business} locale={locale} preview={preview}/>}
      {preview ? (internalBooking || action) && <PublicAction as="span" variant="primary" aria-disabled="true">{copy.reserveAppointment}</PublicAction>
        : internalBooking ? profile && (isOffsiteBooking(business)
          ? <OutboundBookingButton business={business} locale={locale}>{copy.reserveAppointment}</OutboundBookingButton>
          : <PublicAction as={Link} variant="primary" href={profile} prefetch={false}>{copy.reserveAppointment}</PublicAction>)
        : action?.kind === 'verified' ? <OutboundBookingButton linkId={action.id} locale={locale}>{copy.reserveAppointment}</OutboundBookingButton>
        : action && <PublicAction as="a" variant="primary" href={action.href} target={action.kind === 'form' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса')} · ${business.name}`}>{copy.reserveAppointment}</PublicAction>}
    </PublicActionPair>
  }

  return <article className="home-business-card is-compact-preview" data-source={row.source}>
    {/* One native details target covers the photo, name, service previews and empty
        card space. Real action controls sit above it, never inside a button. */}
    {hasDetails && <button type="button" className="home-business-open" onClick={openDetails} aria-haspopup="dialog" aria-label={`${copy.detailsLabel} · ${row.name}`}/>}
    <div className="home-business-heading">
      <div className={`home-business-photo${photo && photo.src !== failedPhoto ? ' is-real-photo' : ''}`}>
        {photo && photo.src !== failedPhoto
          ? <img src={photo.src} width={photo.width || 400} height={photo.height || 300} alt={publicProse(photo.alt, locale) || row.name} loading="lazy" decoding="async" style={businessPhotoStyle(photo, { preview: true })} onError={() => setFailedPhoto(photo.src)}/>
          : <BusinessCoverPhoto business={row} locale={locale} omitIfUnavailable compactDisclosure/>}
        <DiscoveryDistanceBadge origin={distanceOrigin} destination={row.coordinates} locale={locale} business={row} distanceOnly/>
      </div>
      <div className="home-business-identity">
        {internal && <span className="home-business-partner"><BrandMark size={20}/>{en ? 'GoRez Partner' : 'Партньор на GoRez'}</span>}
        <h3 title={row.name}>{row.name}</h3>
        {services.length > 0 && <ul className="home-business-service-preview" aria-label={copy.servicesLabel}>{services.map((service,index) => {
          const name = serviceDisplayName(service, locale)
          const price = detailPriceLabel({ ...service, priceUnit: '' }, locale, { compact: true })
          const unit = price && service.priceUnit ? compactPosterUnit(serviceDisplayUnit(service, locale), name, locale) : ''
          const { description, conditions } = servicePresentation(service, locale)
          const { visible, more, hasConditions } = serviceDescriptionDisclosure(description)
          const compactDescription = visible.filter(paragraph => paragraph.length <= 96)
          return <li key={service.id || `${service.name}-${index}`}>
            <div className="home-business-preview-copy">
              <div className="home-business-preview-main">
                <strong className="home-business-preview-name">{name}</strong>
                {price && <div className="home-business-preview-amount"><span className="home-business-preview-price">{price}</span></div>}
              </div>
              {unit && <span className="home-business-preview-unit">{unit}</span>}
              {conditions.map(condition => <span className="home-business-preview-condition" key={condition}>{condition}</span>)}
              {hasConditions && <span className="home-business-preview-condition" data-service-has-conditions>{copy.hasConditions}</span>}
              {!hasConditions && (more || compactDescription.length < visible.length) && <span className="home-business-preview-condition" data-service-preview-more>{copy.readMore}</span>}
              {compactDescription.map((paragraph,paragraphIndex) => <p className="home-business-preview-description" key={paragraphIndex}>{paragraph}</p>)}
            </div>
            {hasDetails && <span className="home-business-preview-chevron"><Icon name="chevronDown"/></span>}
          </li>
        })}</ul>}
        {actions()}
      </div>
    </div>
    {detailsOpen && <DiscoveryBusinessDetails row={row} locale={locale} preview={preview} onClose={() => setDetailsOpen(false)} triggerRef={detailsTrigger} actions={actions}/>}
    {row.source === 'google' && <span className="home-google-attribution" translate="no">Google Maps</span>}
    {row.source === 'google' && row.attributions?.length > 0 && <div className="home-provider-attributions">{row.attributions.map((item,index) => item.url ? <a key={index} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a> : <span key={index}>{item.name}</span>)}</div>}
  </article>
})
