import { Icon } from './icon'
import { ServiceThumbnail } from './service-thumbnail'
import { detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import styles from './public-service-menu.module.css'

// One source-preserving menu for discovery and catalogue pages. Native
// business profiles reuse the same cards but provide their own booking action.
export function PublicServiceMenu({ services, business, locale = 'bg', copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, serviceAnchors = null, groupHeading: GroupHeading = 'h4', shownBusinessPhoto = null }) {
  const groups = groupDetailServices(services)
  return <div className={styles.menu} data-service-price-menu>
    {groups.map(group => <div className={styles.group} key={group.key}>
      {groups.length > 1 && group.title && <GroupHeading className={styles.groupTitle}>{group.title[locale] || group.title.bg}</GroupHeading>}
      {renderServicePriceGrid({ services: group.services, business, locale, copy, serviceAnchors, shownBusinessPhoto })}
    </div>)}
  </div>
}

// Pure presentation: no state, analytics, requests or booking clicks.
export function renderServicePriceGrid({ services, business, locale = 'bg', copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, serviceAnchors = null, profilePrice = null, renderBooking = null, selectedServiceId = '', shownBusinessPhoto = null }) {
  const en = locale === 'en'
  return <div className={styles.gallery} data-service-price-gallery>
    <ul className={styles.grid} data-service-single={services.length === 1 ? true : undefined}>{services.map((service, index) => {
      const name = serviceDisplayName(service, locale)
      const price = profilePrice ? profilePrice(service, locale) : detailPriceLabel({ ...service, priceUnit: '' }, locale)
      const unit = profilePrice ? '' : serviceDisplayUnit(service, locale)
      const duration = Number(service.durationMin ?? service.duration_min)
      const { description, conditions } = servicePresentation(service, locale)
      const { more, hasConditions } = serviceDescriptionDisclosure(description, { collapseShort: true })
      const qualified = hasConditions || conditions.length > 0
      const openLabel = qualified ? copy.hasConditions : (en ? 'View details' : 'Виж детайли')
      const closeLabel = qualified ? (en ? 'Hide conditions' : 'Скрий условията') : (en ? 'Hide details' : 'Скрий детайлите')
      const priceContent = <><span>{price}</span>{unit && <small className={styles.unit}>{unit}</small>}</>
      return <li className={styles.card} data-service-price-card data-service-selected={renderBooking && selectedServiceId === service.id ? true : undefined}
        id={serviceAnchors?.get(service)} key={`${service.id || service.name}-${index}`}>
        <ServiceThumbnail service={service} business={business} locale={locale} size={128} className={styles.photo} gallery shownBusinessPhoto={shownBusinessPhoto}/>
        <strong className={styles.name}>{name}</strong>
        {Number.isFinite(duration) && duration > 0 && <span className={styles.duration}>{duration} {copy.minutes}</span>}
        {price ? <div className={styles.priceBlock}>{!profilePrice && service.priceSourceUrl
          ? <a className={styles.price} href={service.priceSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${price}${unit ? ` / ${unit}` : ''} · ${copy.publishedPriceSource}`}>{priceContent}</a>
          : <strong className={styles.price}>{priceContent}</strong>}</div>
          : <span className={styles.unpriced}>{copy.priceUnknown}</span>}
        {(more || conditions.length > 0) && <details className={styles.more} data-service-more>
          <summary data-service-condition-control={qualified ? true : undefined}><span className={styles.moreLabel}>{openLabel}</span><span className={styles.lessLabel}>{closeLabel}</span><span className={styles.srOnly}> · {name}</span><Icon name="chevronDown"/></summary>
          {conditions.length > 0 && <ul className={styles.conditions}>{conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>}
          {more && <p>{more}</p>}
        </details>}
        {renderBooking && <div className={styles.booking}>{renderBooking(service, name)}</div>}
      </li>
    })}</ul>
  </div>
}
