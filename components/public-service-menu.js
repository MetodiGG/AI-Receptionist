import { Icon } from './icon'
import { ServiceThumbnail } from './service-thumbnail'
import { detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import styles from './public-service-menu.module.css'

// One source-preserving menu for public details and the catalogue profile.
// Native disclosures need no state, network request or booking interaction.
export function PublicServiceMenu({ services, business, locale = 'bg', copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, serviceAnchors = null, groupHeading: GroupHeading = 'h4' }) {
  const groups = groupDetailServices(services)
  return <div className={styles.menu} data-service-price-menu>
    {groups.map(group => <div className={styles.group} key={group.key}>
      {groups.length > 1 && group.title && <GroupHeading className={styles.groupTitle}>{group.title[locale] || group.title.bg}</GroupHeading>}
      <ul className={styles.grid}>{group.services.map((service, index) => {
        const name = serviceDisplayName(service, locale)
        const price = detailPriceLabel({ ...service, priceUnit: '' }, locale)
        const unit = serviceDisplayUnit(service, locale)
        const { description, conditions } = servicePresentation(service, locale)
        const disclosure = serviceDescriptionDisclosure(description)
        const priceContent = <><span>{price}</span>{unit && <small className={styles.unit}>{unit}</small>}</>
        return <li className={styles.card} data-service-price-card id={serviceAnchors?.get(service)} key={`${service.id || service.name}-${index}`}>
          <ServiceThumbnail service={service} business={business} locale={locale} size={128} className={styles.photo}/>
          <strong className={styles.name}>{name}</strong>
          {price ? service.priceSourceUrl
            ? <a className={styles.price} href={service.priceSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${price}${unit ? ` / ${unit}` : ''} · ${copy.publishedPriceSource}`}>{priceContent}</a>
            : <strong className={styles.price}>{priceContent}</strong>
            : <span className={styles.unpriced}>{copy.priceUnknown}</span>}
          {disclosure.hasConditions && <span className={styles.conditionsFlag} data-service-conditions-hidden>{copy.hasConditions}</span>}
          {service.durationMin > 0 && <span className={styles.duration}>{service.durationMin} {copy.minutes}</span>}
          {conditions.length > 0 && <div className={styles.conditions}>{conditions.map(condition => <p key={condition}>{condition}</p>)}</div>}
          {disclosure.visible.map((paragraph, paragraphIndex) => <p className={styles.note} key={paragraphIndex}>{paragraph}</p>)}
          {disclosure.more && <details className={styles.more} data-service-more>
            <summary><span className={styles.moreLabel}>{copy.readMore}</span><span className={styles.lessLabel}>{copy.readLess}</span><span className={styles.srOnly}> · {name}</span><Icon name="chevronDown"/></summary>
            <p>{disclosure.more}</p>
          </details>}
        </li>
      })}</ul>
    </div>)}
  </div>
}
