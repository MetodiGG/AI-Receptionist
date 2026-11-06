'use client'

import { useEffect, useId, useRef } from 'react'
import { Icon } from './icon'
import { containDialogTab } from '../lib/dialog-focus.mjs'
import { businessDetailHours, businessDetailServices, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { safeBookingUrl } from '../lib/booking-mode.mjs'
import { railCategory } from '../lib/discovery/rail.mjs'

const weekdays = {
  bg: ['Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота', 'Неделя'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
}

export function DiscoveryBusinessDetails({ row, locale = 'bg', onClose, triggerRef, actions }) {
  const en = locale === 'en', dialog = useRef(null), id = useId()
  const services = businessDetailServices(row), hours = businessDetailHours(row)
  const description = row.details?.description?.[locale] || row.details?.description?.bg || ''
  const website = safeBookingUrl(row.details?.sourceUrl || row.website)
  const hoursSource = safeBookingUrl(row.details?.hoursSourceUrl)
  useEffect(() => {
    const node = dialog.current, overflow = document.body.style.overflow, trigger = triggerRef.current
    node.showModal(); document.body.style.overflow = 'hidden'
    node.querySelector('header button')?.focus()
    return () => { node.close(); document.body.style.overflow = overflow; trigger?.focus() }
  }, [triggerRef])
  return <dialog ref={dialog} className="discovery-business-details" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); onClose() }} onKeyDown={event => containDialogTab(event, event.currentTarget)} onClick={event => {
    if (event.target !== event.currentTarget) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
  }}>
    <header><div><p>{row.source === 'gorez' ? (en ? 'GoRez partner' : 'GoRez партньор') : railCategory(row, locale)}</p><h2 id={`${id}-title`}>{row.name}</h2></div><button type="button" onClick={onClose} aria-label={en ? 'Close business details' : 'Затвори информацията за бизнеса'}><Icon name="close"/></button></header>
    {description && <p className="business-details-description">{description}</p>}
    <section aria-labelledby={`${id}-services`}><h3 id={`${id}-services`}>{en ? 'Services & prices' : 'Услуги и цени'}</h3>
      {services.length ? <ul className="business-details-services">{services.map((service, index) => {
        const price = detailPriceLabel(service, locale)
        return <li key={index}><div><strong>{service.name}</strong>{service.description && <p>{service.description}</p>}{service.durationMin > 0 && <span>{service.durationMin} {en ? 'min' : 'мин'}</span>}</div>{price && (service.priceSourceUrl ? <a className="business-details-price" href={service.priceSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${price} · ${en ? 'Published price source' : 'Източник на публикуваната цена'}`}>{price}</a> : <strong className="business-details-price">{price}</strong>)}</li>
      })}</ul> : <p>{en ? 'Ask the business about its services.' : 'Уточни услугите с бизнеса.'}</p>}
      {services.some(service => service.price != null) && row.source === 'catalogue' && <p className="business-details-note">{en ? 'Published prices; confirm the current price when booking.' : 'Публикувани цени; уточни актуалната цена при резервация.'}</p>}
    </section>
    <section aria-labelledby={`${id}-hours`}><h3 id={`${id}-hours`}>{en ? 'Opening hours' : 'Работно време'}</h3>
      {hours.length ? <dl className="business-details-hours">{hours.map(day => <div key={day.weekday}><dt>{weekdays[en ? 'en' : 'bg'][day.weekday - 1]}</dt><dd>{day.byAppointment ? (en ? 'By appointment' : 'По уговорка') : day.periods.join(' / ') || (en ? 'Closed' : 'Почивен ден')}</dd></div>)}</dl> : <p>{en ? 'Not published. Confirm with the business.' : 'Не е публикувано. Уточни с бизнеса.'}</p>}
      {hoursSource && <a href={hoursSource} target="_blank" rel="noopener noreferrer">{en ? 'Opening hours source' : 'Източник на работното време'}</a>}
    </section>
    {row.address && <section aria-labelledby={`${id}-address`}><h3 id={`${id}-address`}>{en ? 'Address' : 'Адрес'}</h3><p>{row.address}</p></section>}
    {row.coordinateAttribution && <p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a> · <a href="/catalogue-location-data-20261106.json" target="_blank" rel="noopener noreferrer">{en ? 'Data (ODbL)' : 'Данни (ODbL)'}</a></p>}
    {website && <p className="business-details-source"><a href={website} target="_blank" rel="noopener noreferrer">{en ? 'Official business website' : 'Официален сайт на бизнеса'}<Icon name="arrow"/></a></p>}
    <footer>{actions}</footer>
  </dialog>
}
