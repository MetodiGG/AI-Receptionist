import { Icon } from './icon'
import { PreparedServiceThumbnail } from './prepared-service-thumbnail'
import { detailPriceLabel, groupDetailServices } from '../lib/discovery/business-details.mjs'
import { serviceDisplayFacts, servicePresentation } from '../lib/discovery/service-presentation.mjs'
import { serviceDescriptionDisclosure } from '../lib/discovery/service-description-disclosure.mjs'
import { matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { DISCOVERY_COPY } from '../lib/discovery/copy.mjs'
import styles from './public-service-menu.module.css'

// One source-preserving menu for public details and the catalogue profile.
// Native disclosures need no state, network request or booking interaction.
export function PublicServiceMenu({ services, photoCandidates, coverSources, locale = 'bg', copy = DISCOVERY_COPY[locale] || DISCOVERY_COPY.bg, serviceAnchors = null, groupHeading: GroupHeading = 'h4' }) {
  const groups = groupDetailServices(services)
  const detailsLabel = copy.viewDetailsLower || DISCOVERY_COPY[locale]?.viewDetailsLower || DISCOVERY_COPY.bg.viewDetailsLower
  const optionalDetails = detailsLabel.charAt(0).toLocaleUpperCase(locale) + detailsLabel.slice(1)
  // Grouping rearranges the menu but preserves the original service objects.
  // Name-based lookup would be ambiguous for same-named offers or branches.
  const photosByService = Array.isArray(photoCandidates) && photoCandidates.length === services.length
    ? new Map(services.map((service, index) => [service, photoCandidates[index]])) : null
  return <div className={styles.menu} data-service-price-menu>
    {groups.map(group => <div className={styles.group} key={group.key}>
      {groups.length > 1 && group.title && <GroupHeading className={styles.groupTitle}>{group.title[locale] || group.title.bg}</GroupHeading>}
      <ul className={styles.grid}>{group.services.map((service, index) => {
        const facts = serviceDisplayFacts(service, locale)
        const { name, unit, durationMin } = facts
        const price = detailPriceLabel({ ...service, priceUnit: '' }, locale)
        const { description, conditions } = servicePresentation(service, locale, { displayedTariff: price ? facts : null })
        const disclosure = serviceDescriptionDisclosure(description, { foldConditions: true })
        const hasConditions = conditions.length > 0 || disclosure.hasConditions
        const priceContent = <><span>{price}</span>{unit && <small className={styles.unit}>{unit}</small>}</>
        return <li className={styles.card} data-service-price-card id={serviceAnchors?.get(service)} key={`${service.id || service.name}-${index}`}>
          {photosByService && <PreparedServiceThumbnail candidates={photosByService.get(service)?.filter(candidate => !matchesBusinessCoverPhoto(candidate?.src, coverSources))} locale={locale} size={128} className={styles.photo}/>}
          <strong className={styles.name}>{name}</strong>
          {price ? service.priceSourceUrl
            ? <a className={styles.price} href={service.priceSourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${price}${unit ? ` / ${unit}` : ''} · ${copy.publishedPriceSource}`}>{priceContent}</a>
            : <strong className={styles.price}>{priceContent}</strong>
            : <span className={styles.unpriced}>{copy.priceUnknown}</span>}
          {durationMin > 0 && <span className={styles.duration}>{durationMin} {copy.minutes}</span>}
          {disclosure.visible.map((paragraph, paragraphIndex) => <p className={styles.note} key={paragraphIndex}>{paragraph}</p>)}
          {(disclosure.more || conditions.length > 0) && <details className={styles.more} data-service-more>
            <summary><span>{hasConditions ? copy.hasConditions : optionalDetails}</span><span className={styles.srOnly}> · {name}</span><Icon name="chevronDown"/></summary>
            <div className={styles.conditionBody}>
              {conditions.map(condition => <p key={condition}>{condition}</p>)}
              {disclosure.more && <p>{disclosure.more}</p>}
            </div>
          </details>}
        </li>
      })}</ul>
    </div>)}
  </div>
}
