import { Icon } from './icon'
import { ServiceThumbnail } from './service-thumbnail'
import { detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import styles from './public-service-menu.module.css'

// The reviewed Lingua Lux tariff describes the same billing unit and minimum
// twice in different words. Only shorten this known pair; do not infer that
// similar descriptions carry the same conditions or rewrite stored pricing.
const reviewedLessonRate = {
  bg: {
    unit: 'уч. час 45 мин. · минимум 2 на посещение и 10 предплатени',
    repeated: 'Цена за 45-минутен учебен час, не за посещение.',
    followedBy: 'Минимум два учебни часа на посещение и 10 предплатени, използвани до един месец.',
    compactUnit: 'за 45-минутен учебен час',
    retained: 'Цената не е за цялото посещение.',
  },
  en: {
    unit: 'academic hour of 45 min · minimum 2 per visit and 10 prepaid',
    repeated: 'Price for 45-a minute class, not a visit.',
    followedBy: 'A minimum of two study hours per visit and 10 prepaid, used up to a month.',
    compactUnit: 'per 45-minute class',
    retained: 'The price is not for the whole visit.',
  },
}

const conditionKey = value => value.trim().replace(/\.$/u, '').toLowerCase()

function servicePriceTerms(unit, description, conditions, locale) {
  const reviewed = reviewedLessonRate[locale] || reviewedLessonRate.bg
  if (unit === reviewed.unit && description.startsWith(`${reviewed.repeated} ${reviewed.followedBy}`)) {
    unit = reviewed.compactUnit
    description = reviewed.retained + description.slice(reviewed.repeated.length)
  }
  // Otherwise suppress only literal standalone conditions already in the
  // details, not words/phrases embedded in different qualifications.
  const described = new Set(description.split(/(?<=[.!?])\s+|\n+/u).map(conditionKey))
  const [basis, ...extra] = unit.split(/\s+·\s+/u)
  const remaining = extra.filter(condition => !described.has(conditionKey(condition)))
  if (remaining.length !== extra.length) unit = [basis, ...remaining].join(' · ')
  const distinct = new Map()
  for (const condition of conditions) {
    const key = conditionKey(condition)
    if (!described.has(key) && !distinct.has(key)) distinct.set(key, condition)
  }
  return { unit, description, conditions: [...distinct.values()] }
}

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
      const duration = Number(service.durationMin ?? service.duration_min)
      const presentation = servicePresentation(service, locale)
      const { unit, description, conditions } = servicePriceTerms(price && !profilePrice ? serviceDisplayUnit(service, locale) : '', presentation.description, presentation.conditions, locale)
      const { more, hasConditions } = serviceDescriptionDisclosure(description, { collapseShort: true })
      const qualified = hasConditions || presentation.conditions.length > 0
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
