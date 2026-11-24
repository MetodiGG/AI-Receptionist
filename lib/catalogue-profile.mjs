import { approvedCatalogueRecord } from './discovery/catalogue-policy.mjs'
import { catalogueIdPattern } from './catalogue-photo-view.mjs'
import { catalogueDetailsWithServicePhotos } from './catalogue-service-photo-keys.mjs'
import { attachSharedCataloguePhotos } from './catalogue-shared-covers.mjs'
import { pageMetadata, localizedUrl, languageAlternates, SITE_ORIGIN } from './seo.mjs'
import { findCity } from './business-location.mjs'
import { isCataloguePartnerDuplicate } from './discovery/catalogue-search.mjs'
import { businessActivityPhotoKey } from './business-cover-photo.mjs'
import { presentPublicBusiness, presentPublicService } from './locale/public-content-server.mjs'
import { serviceDisplayName, postalDisplay, englishPresentationText } from './locale/public-content.mjs'
import { catalogueProvenance } from './discovery/catalogue-provenance.mjs'
import { cataloguePublicLocation } from './discovery/catalogue-public-location.mjs'

// Stable local catalogue identities only. Provider IDs and transient Google
// content never acquire a GoRez indexable profile through this adapter.
export function catalogueProfilePath(id) {
  return typeof id === 'string' && catalogueIdPattern.test(id) ? `/businesses/catalogue/${id}` : null
}

export function catalogueNativePartner(raw, partners = [], now = Date.now()) {
  const row = approvedCatalogueRecord(raw, now)
  if (!row) return null
  const matches = partners.filter(partner => partner.active === true && partner.platform_status === 'enabled' && /^[a-z0-9-]{2,64}$/.test(partner.slug || '') && isCataloguePartnerDuplicate(row, [partner]))
  // An ambiguous identity never chooses another branch by name or similarity.
  return matches.length === 1 ? { name: matches[0].name, path: `/book/${matches[0].slug}` } : null
}

export function indexableCatalogueRecord(row, now = Date.now()) {
  const approved = approvedCatalogueRecord(row, now)
  // An explicitly linked partner already has its native /book/[slug] page.
  return approved && !approved.gorezBusinessId ? approved : null
}

export function catalogueProfileView(raw, { now = Date.now(), photos = [] } = {}) {
  const row = indexableCatalogueRecord(raw, now)
  if (!row) return null
  const business = {
    id: row.id, source: 'catalogue', name: row.name, category: row.category,
    businessCategory: row.category, cityCode: row.cityCode,
    city: findCity(row.cityCode)?.name || '', neighborhood: row.neighborhood,
    address: row.address, locationKind: row.locationKind, coordinates: row.coordinates,
    navigationLocation: cataloguePublicLocation(row),
    website: row.website, phone: row.phone,
    ...(row.verification.sourceKind ? { provenance: catalogueProvenance(row) } : {}),
    booking: { ...row.booking, verified: true, checkedOn: row.verification.checkedOn, validUntil: row.verification.validUntil },
    details: catalogueDetailsWithServicePhotos(row, now),
    photo: row.photo ? { src: row.photo.src, alt: row.photo.alt } : null,
  }
  const result = attachSharedCataloguePhotos([business], photos)[0]
  return presentPublicBusiness({ ...result, illustrativeCoverPhotoKey: businessActivityPhotoKey(business),
    photos: result.photo ? [{ ...result.photo, alt: { bg: result.photo.alt || row.name, en: englishPresentationText(result.photo.alt || row.name, '') } }] : [] })
}

export function catalogueProfileMetadata(row, locale = 'bg', now = Date.now()) {
  const business = indexableCatalogueRecord(row, now), path = catalogueProfilePath(row?.id)
  if (!business || !path) return { title: 'GoRez', robots: { index: false, follow: false } }
  const en = locale === 'en', city = findCity(business.cityCode), location = [en ? city?.nameEn : city?.name, postalDisplay(business.neighborhood, locale)].filter(Boolean).join(' · ')
  const serviceNames = business.services.slice(0, 3).map(service => serviceDisplayName(presentPublicService(service, business), locale)).join(', ')
  return pageMetadata(path, locale, {
    title: `${business.name} — ${en ? 'services and booking' : 'услуги и резервации'} · GoRez`,
    description: `${business.name}${location ? ` · ${location}` : ''}. ${en ? 'Services' : 'Услуги'}: ${serviceNames}. ${business.verification.sourceKind === 'platform_owner_confirmation' ? (en ? 'Confirm the service, price and appointment time directly with the salon.' : 'Уточни услугата, цената и часа директно със салона.') : (en ? 'See published prices and arrange an appointment directly with the business.' : 'Виж публикуваните цени и уговори час директно с бизнеса.')}`.slice(0, 350),
  })
}

export function catalogueProfileStructuredData(raw, locale = 'bg', now = Date.now()) {
  const row = indexableCatalogueRecord(raw, now), path = catalogueProfilePath(raw?.id)
  if (!row || !path) return null
  const city = findCity(row.cityCode)
  return {
    '@context': 'https://schema.org', '@type': 'LocalBusiness',
    '@id': `${SITE_ORIGIN}${path}#business`, name: row.name, url: localizedUrl(path, locale),
    ...(row.locationKind === 'premises' && row.address ? { address: postalDisplay(row.address, locale) } : {}),
    ...(row.phone ? { telephone: row.phone } : {}),
    ...(row.locationKind === 'service_area' && city ? { areaServed: { '@type': 'City', name: locale === 'en' ? city.nameEn : city.name } } : {}),
    // No invented aggregateRating, reviewCount, availability, priceRange,
    // business photographs or entrance coordinates in structured data.
    hasOfferCatalog: { '@type': 'OfferCatalog', name: locale === 'en' ? 'Services' : 'Услуги',
      itemListElement: row.services.map(service => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: serviceDisplayName(presentPublicService(service, row), locale) } })) },
  }
}

export function catalogueProfileSitemapEntries(records, now = Date.now(), { partners = [] } = {}) {
  const seen = new Set()
  return records.flatMap(raw => {
    const row = indexableCatalogueRecord(raw, now), path = catalogueProfilePath(raw?.id)
    if (!row || !path || seen.has(row.id) || catalogueNativePartner(row, partners, now)) return []
    seen.add(row.id)
    return ['bg', 'en'].map(locale => ({ url: localizedUrl(path, locale),
      lastModified: `${row.verification.checkedOn}T00:00:00Z`,
      alternates: { languages: languageAlternates(path).languages } }))
  })
}

export function relatedCatalogueProfiles(records, current, { now = Date.now(), limit = 4 } = {}) {
  const business = indexableCatalogueRecord(current, now)
  if (!business) return []
  return records.filter(row => row.id !== business.id && row.cityCode === business.cityCode && row.category === business.category && indexableCatalogueRecord(row, now))
    .sort((a, b) => Number(Boolean(business.neighborhood) && b.neighborhood === business.neighborhood) - Number(Boolean(business.neighborhood) && a.neighborhood === business.neighborhood) || a.name.localeCompare(b.name, 'bg') || a.id.localeCompare(b.id))
    .slice(0, Math.min(8, Math.max(0, limit))).map(row => ({ id: row.id, name: row.name, neighborhood: row.neighborhood, href: catalogueProfilePath(row.id) }))
}
