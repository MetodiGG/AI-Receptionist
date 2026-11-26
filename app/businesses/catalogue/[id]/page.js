import Link from 'next/link'
import { postalDisplay } from '../../../../lib/locale/public-content.mjs'
import { notFound, permanentRedirect } from 'next/navigation'
import { BrandLogo } from '../../../../components/brand-logo'
import { HomeLink } from '../../../../components/home-link'
import { BusinessProfileHeader } from '../../../../components/business-profile'
import { PublicServiceMenu } from '../../../../components/public-service-menu'
import { PublicAction, PublicActionPair } from '../../../../components/public-action'
import { Icon } from '../../../../components/icon'
import { readCatalogueSeoProfile } from '../../../../lib/catalogue-profile-server'
import { catalogueProfileMetadata, catalogueProfilePath, catalogueProfileStructuredData } from '../../../../lib/catalogue-profile.mjs'
import { localizedUrl, safeJsonLd } from '../../../../lib/seo.mjs'
import { businessDetailHours, businessDetailServices, groupDetailServices } from '../../../../lib/discovery/business-details.mjs'
import { railCategory, railDirections, railExternalAction } from '../../../../lib/discovery/rail.mjs'
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
  // Existing JSON-LD and shared service fragments stay stable as the menu is
  // displayed once. Never use new priced/unpriced display indices for IDs.
  const serviceAnchors = new Map()
  for (const group of groupDetailServices(services)) group.services.forEach((service, index) => serviceAnchors.set(service, `service-${group.key || 'other'}-${index}`))
  const action = railExternalAction(business, now), directions = railDirections(business)
  const context = { id: business.id, name: business.name, source: 'catalogue', category: business.category }
  // The hero needs identity/location/photos only, not a second serialized copy
  // of the complete service menu or server-only review/source inventory.
  const hero = { ...context, businessCategory: business.businessCategory || business.category, illustrativeCoverPhotoKey: business.illustrativeCoverPhotoKey,
    address: business.address, city: business.city, cityCode: business.cityCode, neighborhood: business.neighborhood, locationKind: business.locationKind, coordinates: business.coordinates, locationVerified: business.locationVerified, locationStatus: business.locationStatus, locationBinding: business.locationBinding, website: business.website, photos: business.photos }
  const path = catalogueProfilePath(id), structured = catalogueProfileStructuredData(row, locale, now)
  return <main className="public-booking-page profile-redesign catalogue-profile-page" lang={locale}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structured) }}/>
    <header className="booking-topbar"><Link className="booking-brand booking-brand-link" href={`/?lang=${locale}`} aria-label="GoRez"><BrandLogo compact decorative eager/></Link><nav className="booking-top-actions catalogue-profile-languages" aria-label={en ? 'Language' : 'Език'}><Link href={`${path}?lang=bg`} lang="bg" hrefLang="bg" aria-current={!en ? 'page' : undefined}>BG</Link><Link href={`${path}?lang=en`} lang="en" hrefLang="en" aria-current={en ? 'page' : undefined}>EN</Link></nav><HomeLink locale={locale}/></header>
    <BusinessProfileHeader business={hero} locale={locale} shareUrl={localizedUrl(path, locale)}/>
    <div className="catalogue-profile-content">
      <p className="catalogue-profile-category">{railCategory(business, locale)}{business.neighborhood ? ` · ${postalDisplay(business.neighborhood, locale)}` : ''}</p>
      <PublicActionPair className="catalogue-profile-actions">
        {directions && <PublicAction as="a" variant="secondary" href={directions} target="_blank" rel="noopener noreferrer">{copy.directions}</PublicAction>}
        {action && <PublicAction as="a" href={action.href} target={action.kind === 'form' ? '_blank' : undefined} rel="noopener noreferrer" aria-label={`${action.kind === 'phone' ? (en ? 'Call to book a time' : 'Резервирай час по телефона') : (en ? 'Book on the business website' : 'Резервирай час в сайта на бизнеса')} · ${business.name}`}>{copy.reserveAppointment}</PublicAction>}
      </PublicActionPair>
      {action && <p className="catalogue-booking-notice">{action.kind === 'phone' ? (en ? 'Arrange your time by phone. GoRez does not confirm phone appointments.' : 'Уговори час по телефон. GoRez не потвърждава телефонни резервации.') : (en ? 'Booking continues on the business website. Its calendar is not synchronized with GoRez.' : 'Записването продължава в сайта на бизнеса. Календарът му не е синхронизиран с GoRez.')}</p>}
      <section className="profile-services business-profile-section" aria-labelledby="catalogue-services-heading"><h2 id="catalogue-services-heading">{copy.servicesPrices}</h2>
        {business.provenance?.kind === 'platform_owner_confirmed' && <p className="business-details-note">{copy.platformConfirmedSource}</p>}
        {services.length ? <PublicServiceMenu services={services} business={hero} locale={locale} copy={copy} serviceAnchors={serviceAnchors} groupHeading="h3"/> : <p>{copy.noServices}</p>}
      </section>
      {hours.length > 0 && <section className="business-profile-section"><details className="business-weekly-hours profile-hours"><summary><Icon name="clock"/><span>{copy.openingHours}</span><Icon name="chevronDown"/></summary><dl>{hours.map(day => <div key={day.weekday}><dt>{copy.weekdays[day.weekday - 1]}</dt><dd>{day.byAppointment ? copy.byAppointment : day.periods.length ? day.periods.join(', ') : copy.closedDay}</dd></div>)}</dl></details></section>}
      <p className="catalogue-profile-source"><a href={business.website} target="_blank" rel="noopener noreferrer">{business.provenance?.kind === 'platform_owner_confirmed' ? copy.mapProfileLabel : copy.websiteLabel}</a></p>
      {business.coordinateAttribution && <p className="site-location-credit"><a href={business.coordinateAttribution.url} target="_blank" rel="noopener noreferrer">{business.coordinateAttribution.label}</a> · <a href={business.coordinateAttribution.licence === 'ODbL-1.0' ? OSM_COPYRIGHT_URL : OFFICIAL_SOFIA_LICENSE_URL} target="_blank" rel="noopener noreferrer">{business.coordinateAttribution.licence === 'ODbL-1.0' ? 'ODbL' : 'CC BY 4.0'}</a></p>}
      {related.length > 0 && <section className="business-profile-section"><h2>{en ? 'Related businesses' : 'Още в тази категория'}</h2><ul className="catalogue-related-links">{related.map(item => <li key={item.id}><Link href={`${item.href}?lang=${locale}`} prefetch={false}>{item.name}{item.neighborhood ? <small>{postalDisplay(item.neighborhood, locale)}</small> : null}</Link></li>)}</ul></section>}
      <Link className="catalogue-profile-back" href={`/search?lang=${locale}`}>{en ? 'Search businesses and services' : 'Търси бизнеси и услуги'}</Link>
    </div>
  </main>
}
