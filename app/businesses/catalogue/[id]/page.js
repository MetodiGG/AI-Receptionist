import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { BrandLogo } from '../../../../components/brand-logo'
import { HomeLink } from '../../../../components/home-link'
import { BusinessProfileHeader } from '../../../../components/business-profile'
import { ServiceThumbnail } from '../../../../components/service-thumbnail'
import { BookingButtonContent } from '../../../../components/booking-button-content'
import { Icon } from '../../../../components/icon'
import { readCatalogueSeoProfile } from '../../../../lib/catalogue-profile-server'
import { catalogueProfileMetadata, catalogueProfilePath, catalogueProfileStructuredData } from '../../../../lib/catalogue-profile.mjs'
import { localizedUrl, safeJsonLd } from '../../../../lib/seo.mjs'
import { businessDetailHours, businessDetailServices, detailPriceLabel, groupDetailServices, splitDetailServiceMenu } from '../../../../lib/discovery/business-details.mjs'
import { railCategory, railDirections, railExternalAction } from '../../../../lib/discovery/rail.mjs'
import { servicePresentation } from '../../../../lib/discovery/service-presentation.mjs'
import { DISCOVERY_COPY } from '../../../../lib/discovery/copy.mjs'
import { OSM_COPYRIGHT_URL, OFFICIAL_SOFIA_LICENSE_URL } from '../../../../lib/discovery/catalogue-attribution.mjs'
import './profile.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params, query = await searchParams
  const profile = await readCatalogueSeoProfile(id)
  if (profile?.partner) return { title: profile.partner.name, alternates: { canonical: localizedUrl(profile.partner.path, query?.lang) }, robots: { index: false, follow: true } }
  return catalogueProfileMetadata(profile?.row, query?.lang === 'en' ? 'en' : 'bg', profile?.now)
}

// Server-rendered authentic catalogue text, not a second booking engine. All
// reservation actions reuse the existing verified telephone/form adapter.
export default async function CatalogueBusiness({ params, searchParams }) {
  const { id } = await params, query = await searchParams
  const locale = query?.lang === 'en' ? 'en' : 'bg', en = locale === 'en', copy = DISCOVERY_COPY[locale]
  const profile = await readCatalogueSeoProfile(id)
  if (!profile) notFound()
  if (profile.partner) permanentRedirect(localizedUrl(profile.partner.path, locale))
  const { row, business, related, now } = profile
  const services = businessDetailServices(business), hours = businessDetailHours(business)
  const { unpriced, priced } = splitDetailServiceMenu(services, locale)
  // Keep every existing service fragment stable even though the display moves
  // the general/unpriced list before the tariff. Overview repeats have no ID.
  const serviceAnchors = new Map()
  for (const group of groupDetailServices(services)) group.services.forEach((service, index) => serviceAnchors.set(service, `service-${group.key || 'other'}-${index}`))
  const action = railExternalAction(business, now), directions = railDirections(business)
  const context = { id: business.id, name: business.name, source: 'catalogue', category: business.category }
  // The hero needs identity/location/photos only, not a second serialized copy
  // of the complete service menu or server-only review/source inventory.
  const hero = { ...context, businessCategory: business.businessCategory || business.category, illustrativeCoverPhotoKey: business.illustrativeCoverPhotoKey,
    address: business.address, city: business.city, cityCode: business.cityCode, neighborhood: business.neighborhood, locationKind: business.locationKind, coordinates: business.coordinates, website: business.website, photos: business.photos }
  const path = catalogueProfilePath(id), structured = catalogueProfileStructuredData(row, locale, now)
  return <main className="public-booking-page profile-redesign catalogue-profile-page" lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structured) }}/>
    <header className="booking-topbar"><Link className="booking-brand booking-brand-link" href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link><nav className="booking-top-actions catalogue-profile-languages" aria-label={en ? 'Language' : 'Език'}><Link href={`${path}?lang=bg`} lang="bg" hrefLang="bg" aria-current={!en ? 'page' : undefined}>BG</Link><Link href={`${path}?lang=en`} lang="en" hrefLang="en" aria-current={en ? 'page' : undefined}>EN</Link></nav><HomeLink locale={locale}/></header>
    <BusinessProfileHeader business={hero} locale={locale} shareUrl={localizedUrl(path, locale)}/>
    <div className="catalogue-profile-content">
      <p className="catalogue-profile-category">{railCategory(business, locale)}{business.neighborhood ? ` · ${business.neighborhood}` : ''}</p>
      <div className="home-business-actions catalogue-profile-actions">
        {directions && <a className="home-directions" href={directions} target="_blank" rel="noopener noreferrer"><Icon name="map"/><span>{copy.directions}</span></a>}
        {action && <a className="home-reserve" href={action.href} target={action.kind === 'form' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса')} · ${business.name}`}><BookingButtonContent>{copy.reserveAppointment}</BookingButtonContent></a>}
      </div>
      {action && <p className="catalogue-booking-notice">{action.kind === 'phone' ? (en ? 'Arrange your time by phone. GoRez does not confirm phone appointments.' : 'Уговори час по телефон. GoRez не потвърждава телефонни резервации.') : (en ? 'Booking continues on the business website. Its calendar is not synchronized with GoRez.' : 'Записването продължава в сайта на бизнеса. Календарът му не е синхронизиран с GoRez.')}</p>}
      <section className="profile-services business-profile-section" aria-labelledby="catalogue-services-heading"><h2 id="catalogue-services-heading">{copy.servicesLabel}</h2>
        {unpriced.length ? <CatalogueServiceGroups groups={groupDetailServices(unpriced)} context={context} locale={locale} copy={copy} serviceAnchors={serviceAnchors}/> : priced.length ? <ul className="business-details-overview" aria-label={copy.servicesLabel}>{priced.map((service, index) => <li key={index}><ServiceThumbnail service={service} business={context} locale={locale} size={32}/><span>{service.name}</span></li>)}</ul> : <p>{copy.noServices}</p>}
      </section>
      {priced.length > 0 && <section className="profile-services business-profile-section" aria-labelledby="catalogue-prices-heading"><h2 id="catalogue-prices-heading">{copy.pricesLabel}</h2><CatalogueServiceGroups groups={groupDetailServices(priced)} context={context} locale={locale} copy={copy} serviceAnchors={serviceAnchors}/></section>}
      {hours.length > 0 && <section className="business-profile-section"><details className="business-weekly-hours profile-hours"><summary><Icon name="clock"/><span>{copy.openingHours}</span><Icon name="chevronDown"/></summary><dl>{hours.map(day => <div key={day.weekday}><dt>{copy.weekdays[day.weekday - 1]}</dt><dd>{day.byAppointment ? copy.byAppointment : day.periods.length ? day.periods.join(', ') : copy.closedDay}</dd></div>)}</dl></details></section>}
      <p className="catalogue-profile-source"><a href={business.website} target="_blank" rel="noopener noreferrer">{copy.websiteLabel}</a></p>
      {business.coordinates?.attribution && <p className="site-location-credit"><a href={business.coordinates.source} target="_blank" rel="noopener noreferrer">{business.coordinates.attribution}</a> · <a href={business.coordinates.licence === 'ODbL-1.0' ? OSM_COPYRIGHT_URL : OFFICIAL_SOFIA_LICENSE_URL} target="_blank" rel="noopener noreferrer">{business.coordinates.licence === 'ODbL-1.0' ? 'ODbL' : 'CC BY 4.0'}</a></p>}
      {related.length > 0 && <section className="business-profile-section"><h2>{en ? 'Related businesses' : 'Още в тази категория'}</h2><ul className="catalogue-related-links">{related.map(item => <li key={item.id}><Link href={`${item.href}?lang=${locale}`} prefetch={false}>{item.name}{item.neighborhood ? <small>{item.neighborhood}</small> : null}</Link></li>)}</ul></section>}
      <Link className="catalogue-profile-back" href={`/search?lang=${locale}`}>{en ? 'Search businesses and services' : 'Търси бизнеси и услуги'}</Link>
    </div>
  </main>
}

function CatalogueServiceGroups({ groups, context, locale, copy, serviceAnchors }) {
  return <div className="profile-service-groups">{groups.map(group => <div className="profile-service-group" key={group.key}>{groups.length > 1 && group.title && <h3>{group.title[locale]}</h3>}<ul className="profile-service-list">{group.services.map((service, index) => {
    const presentation = servicePresentation(service, locale), price = detailPriceLabel(service, locale)
    return <li className="profile-service-row" id={serviceAnchors.get(service)} key={`${service.name}-${index}`}>
      <ServiceThumbnail service={service} business={context} locale={locale} size={60}/>
      <div className="profile-service-copy"><strong>{service.name}</strong>{service.durationMin > 0 && <span>{service.durationMin} {copy.minutes}</span>}{(presentation.description || presentation.conditions.length > 0) && <details className="profile-service-description"><summary>{locale === 'en' ? 'Details' : 'Детайли'}</summary><p>{[...presentation.conditions, presentation.description].filter(Boolean).join('\n')}</p></details>}</div>
      {price && <div className="profile-service-actions"><strong className="profile-service-price">{price}</strong></div>}
    </li>
  })}</ul></div>)}</div>
}
