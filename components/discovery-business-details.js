'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { BusinessCoverPhoto } from './business-cover-photo'
import { IllustrativeServicePhotoNote, ServiceThumbnail } from './service-thumbnail'
import { containDialogTab } from '../lib/dialog-focus.mjs'
import { businessDetailHours, businessDetailServices, detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { safeBookingUrl } from '../lib/booking-mode.mjs'
import { railCategory, railPhone } from '../lib/discovery/rail.mjs'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'

export function DiscoveryBusinessDetails({ row, locale = 'bg', preview = false, onClose, triggerRef, actions }) {
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, dialog = useRef(null), id = useId()
  const needsFetch = !preview || Boolean(row.source === 'catalogue' && row.detailsRef)
  const [full, setFull] = useState(needsFetch ? null : row), [status, setStatus] = useState(needsFetch ? 'loading' : 'ready'), [attempt, setAttempt] = useState(0)
  const business = full ? { ...row, ...full } : row
  const services = businessDetailServices(business), hours = businessDetailHours(business)
  const groups = groupDetailServices(services)
  const description = business.details?.description?.[locale] || business.details?.description?.bg || ''
  const website = safeBookingUrl(business.details?.sourceUrl || business.website)
  const phone = railPhone(business.details?.phone || business.phone)
  const hoursSource = safeBookingUrl(business.details?.hoursSourceUrl)
  const photos = business.source === 'gorez' ? business.photos || [] : isCataloguePhotoSource(business.photo?.src) ? [{ ...business.photo, alt: { [locale]: business.photo.alt || business.name } }] : []

  useEffect(() => {
    if (!needsFetch) return
    const controller = new AbortController()
    let active = true
    const timeout = setTimeout(() => { controller.abort(); if (active) setStatus('error') }, 8000)
    setStatus('loading')
    const path = preview ? `/dev/sofia-catalogue/business/${encodeURIComponent(row.id)}` : `/api/public/discovery/business/${encodeURIComponent(row.id)}`
    fetch(path, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        if (response.status === 404) { if (active) setStatus('missing'); return }
        if (!response.ok) throw Error('DETAILS_UNAVAILABLE')
        const value = await response.json()
        if (!value.business || value.business.id !== row.id || value.business.source !== row.source) throw Error('DETAILS_UNAVAILABLE')
        if (active) { setFull(value.business); setStatus('ready') }
      }).catch(error => { if (active && error.name !== 'AbortError') setStatus('error') }).finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [row.id, row.source, preview, needsFetch, attempt])

  useEffect(() => {
    const node = dialog.current, overflow = document.body.style.overflow, trigger = triggerRef.current
    node.showModal(); document.body.style.overflow = 'hidden'
    node.querySelector('.business-details-close')?.focus()
    return () => { node.close(); document.body.style.overflow = overflow; trigger?.focus() }
  }, [triggerRef])

  const photoFallback = <BusinessCoverPhoto business={business} locale={locale} className="business-details-photo-fallback" eager/>

  return <dialog ref={dialog} className="discovery-business-details" aria-labelledby={`${id}-title`} aria-busy={status === 'loading'} onCancel={event => {
    if (event.target !== event.currentTarget) return
    event.preventDefault(); onClose()
  }} onKeyDown={event => {
    // A photo lightbox or another native modal owns its own keyboard focus.
    if (event.target.closest('dialog') === event.currentTarget) containDialogTab(event, event.currentTarget)
  }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}>
    <div className="business-details-toolbar"><button type="button" className="business-details-close" onClick={onClose} aria-label={copy.closeDetails}><Icon name="close"/></button></div>
    {status !== 'missing' && <div className="business-details-gallery">
      {photos.length ? <BusinessPhotoGallery key={`${row.id}-${photos[0].src}`} photos={photos} businessName={row.name} locale={locale} variant="details" autoplay={false} fallback={photoFallback}/> : photoFallback}
    </div>}
    <header><div>{row.source === 'gorez' && <p>{copy.partner}</p>}<h2 id={`${id}-title`}>{row.name}</h2><p className="business-details-category">{railCategory(business, locale)}</p></div></header>
    {status === 'loading' && <p className="business-details-status" role="status">{copy.loadingDetails}</p>}
    {status === 'error' && <div className="business-details-status" role="alert"><p>{copy.detailsError}</p><button className="secondary-button" type="button" onClick={() => setAttempt(value => value + 1)}>{copy.retryDetails}</button></div>}
    {status === 'missing' && <p role="status">{copy.detailsUnavailable}</p>}
    {status === 'ready' && <>
      {description && <p className="business-details-description">{description}</p>}
      <section aria-labelledby={`${id}-services`}><h3 id={`${id}-services`}>{copy.servicesPrices}</h3>
        {services.length ? groups.map(group => <div className="business-details-service-group" key={group.key}>{groups.length > 1 && group.title && <h4>{group.title[locale]}</h4>}<ServiceMenu services={group.services} business={business} locale={locale} copy={copy}/></div>) : <p>{copy.noServices}</p>}
        <IllustrativeServicePhotoNote services={services} business={business} locale={locale}/>
        {services.some(service => service.price != null) && row.source === 'catalogue' && <p className="business-details-note">{copy.pricesNote}</p>}
      </section>
      <section aria-labelledby={`${id}-hours`}><h3 id={`${id}-hours`}>{copy.openingHours}</h3>
        {hours.length ? <dl className="business-details-hours">{hours.map(day => <div key={day.weekday}><dt>{copy.weekdays[day.weekday - 1]}</dt><dd>{day.byAppointment ? copy.byAppointment : day.periods.join(' / ') || copy.closedDay}</dd></div>)}</dl> : <p>{copy.unpublishedHours}</p>}
        {hoursSource && <a href={hoursSource} target="_blank" rel="noopener noreferrer">{copy.hoursSource}</a>}
      </section>
      {business.address && <section aria-labelledby={`${id}-address`}><h3 id={`${id}-address`}>{copy.addressLabel}</h3><p>{business.address}</p></section>}
      {(phone || website) && <section className="business-details-contact" aria-labelledby={`${id}-contact`}><h3 id={`${id}-contact`}>{copy.contactLabel}</h3>
        {phone && <a href={phone} aria-label={copy.phoneLabel}>{business.details?.phone || business.phone}</a>}
        {website && <a href={website} target="_blank" rel="noopener noreferrer">{copy.websiteLabel}<Icon name="arrow"/></a>}
      </section>}
    </>}
    {status !== 'missing' && <footer>{actions}</footer>}
  </dialog>
}

function ServiceMenu({ services, business, locale, copy }) {
  return <ul className="business-details-services">{services.map((service, index) => {
    const price = detailPriceLabel({ ...service, priceUnit: '' }, locale)
    const { description, conditions } = servicePresentation(service, locale)
    const priceContent = <>{price}{service.priceUnit && <small className="service-price-unit">{service.priceUnit}</small>}</>
    return <li key={index}><div className="service-photo-name"><ServiceThumbnail service={service} business={business} locale={locale} size={44}/><div className="business-details-service-copy"><strong>{service.name}</strong>{service.durationMin > 0 && <span>{service.durationMin} {copy.minutes}</span>}{conditions.map(condition => <small className="business-details-service-condition" key={condition}>{condition}</small>)}</div></div>{price && (service.priceSourceUrl ? <a className="business-details-price" href={service.priceSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${detailPriceLabel(service, locale)} · ${copy.publishedPriceSource}`}>{priceContent}</a> : <strong className="business-details-price">{priceContent}</strong>)}{description && <p className="business-details-service-description">{description}</p>}</li>
  })}</ul>
}
