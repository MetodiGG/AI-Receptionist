'use client'

import { publicProse, businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { BrandLoading } from './brand-loading'
import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from './icon'
import { BusinessPhotoGallery } from './business-photo-gallery'
import { BusinessCoverPhoto } from './business-cover-photo'
import { PublicServiceMenu } from './public-service-menu'
import { containDialogTab } from '../lib/dialog-focus.mjs'
import { businessDetailHours, businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { railCategory, railServiceItems } from '../lib/discovery/rail.mjs'
import { isCataloguePhotoSource } from '../lib/catalogue-photo-view.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import { needsBusinessDetails, startBusinessDetailsRequest } from '../lib/discovery/detail-request.mjs'

export function DiscoveryBusinessDetails({ row, locale = 'bg', preview = false, initialRequest = null, onClose, triggerRef, actions }) {
  const copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, dialog = useRef(null), id = useId()
  const needsFetch = needsBusinessDetails(row, preview)
  const [full, setFull] = useState(needsFetch ? null : row), [status, setStatus] = useState(needsFetch ? 'loading' : 'ready'), [attempt, setAttempt] = useState(0)
  const business = full ? { ...row, ...full } : row
  const services = businessDetailServices(business), hours = businessDetailHours(business)
  const previewServices = status === 'loading' || status === 'error' ? railServiceItems(row) : []
  const hasPrices = services.some(service => detailPriceLabel(service, locale) !== null)
  const description = publicProse(business.details?.description, locale, business.presentationEn?.description)
  const photos = business.source === 'gorez' ? business.photos || [] : isCataloguePhotoSource(business.photo?.src) ? [{ ...business.photo, alt: { [locale]: publicProse(business.photo.alt, locale) || business.name } }] : []

  useEffect(() => {
    if (!needsFetch) return
    let active = true
    // The card owns its first request until close; this effect owns retries.
    // Detaching a subscription (including React dev effect replay) must not
    // cancel the parent's in-flight request.
    const shared = attempt === 0 && initialRequest
    const request = shared || startBusinessDetailsRequest(row, { preview })
    setStatus('loading')
    request.result.then(({ business: next, status: nextStatus }) => {
      if (!active || nextStatus === 'aborted') return
      if (nextStatus === 'ready') setFull(next)
      setStatus(nextStatus)
    })
    return () => { active = false; if (!shared) request.cancel() }
  }, [row.id, row.source, preview, needsFetch, attempt, initialRequest])

  useEffect(() => {
    const node = dialog.current, overflow = document.body.style.overflow, trigger = triggerRef.current
    node.showModal(); document.body.style.overflow = 'hidden'
    node.querySelector('.business-details-close')?.focus()
    return () => { node.close(); document.body.style.overflow = overflow; trigger?.focus() }
  }, [triggerRef])

  const photoFallback = <BusinessCoverPhoto business={business} locale={locale} className="business-details-photo-fallback" eager omitIfUnavailable/>

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
    {previewServices.length > 0 && <section aria-labelledby={`${id}-services-preview`}>
      <h3 id={`${id}-services-preview`}>{copy.servicesPrices}</h3>
      <PublicServiceMenu services={previewServices} business={row} locale={locale} copy={copy}/>
    </section>}
    {status === 'loading' && <div className="business-details-status"><BrandLoading locale={locale} label={copy.loadingDetails}/></div>}
    {status === 'error' && <div className="business-details-status" role="alert"><p>{copy.detailsError}</p><button className="secondary-button" type="button" onClick={() => setAttempt(value => value + 1)}>{copy.retryDetails}</button></div>}
    {status === 'missing' && <p role="status">{copy.detailsUnavailable}</p>}
    {status === 'ready' && <>
      {business.provenance?.kind === 'platform_owner_confirmed' && <p className="business-details-note">{copy.platformConfirmedSource}</p>}
      {description && <p className="business-details-description">{description}</p>}
      <section aria-labelledby={`${id}-services`}><h3 id={`${id}-services`}>{copy.servicesPrices}</h3>
        {services.length ? <PublicServiceMenu services={services} business={business} locale={locale} copy={copy}/> : <p>{copy.noServices}</p>}
        {row.source === 'catalogue' && hasPrices && <p className="business-details-note">{copy.pricesNote}</p>}
      </section>
      <section className="business-details-hours-section" aria-labelledby={`${id}-hours`}>
        <details className="business-details-hours-toggle">
          <summary id={`${id}-hours`}><span>{copy.openingHours}</span><Icon name="chevronDown"/></summary>
          <div className="business-details-hours-body">{hours.length ? <dl className="business-details-hours">{hours.map(day => <div key={day.weekday}><dt>{copy.weekdays[day.weekday - 1]}</dt><dd>{day.byAppointment ? copy.byAppointment : day.periods.join(' / ') || copy.closedDay}</dd></div>)}</dl> : <p>{copy.unpublishedHours}</p>}</div>
        </details>
      </section>
      {business.address && <section className="business-details-address" aria-labelledby={`${id}-address`}><h3 id={`${id}-address`}>{copy.addressLabel}</h3><p>{businessDisplayAddress(business, locale)}</p></section>}
    </>}
    {status === 'ready' && <footer>{typeof actions === 'function' ? actions(business) : actions}</footer>}
  </dialog>
}
