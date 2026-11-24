import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { SUHODOL_20261122_RECORDS, SUHODOL_20261122_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-suhodol-20261122.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { approvedCatalogueRecord, validateCatalogue, catalogueRecordSchema } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { cataloguePublicLocation } from '../lib/discovery/catalogue-public-location.mjs'
import { serviceDisplayName, publicProse, businessDisplayAddress } from '../lib/locale/public-content.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-22T12:00:00Z')
const id = 'sofia-maria-kamenova-suhodol-shtit9'
const site = 'https://moetoslunce.com/', booking = 'https://superdoc.bg/lekar/maria-kamenova'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const [sourceRow] = validateCatalogue(SUHODOL_20261122_RECORDS)
const row = SOFIA_CATALOGUE.find(item => item.id === id)
const review = SUHODOL_20261122_REVIEWS[0]
const names = ['Психологична консултация', 'Семейна терапия']
const descriptions = [
  'Присъствена психологична консултация в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.',
  'Присъствена семейна терапия в кабинет с предварително записване. Часът се запазва през външния календар на специалиста.',
]

test('one real Suhodol office is wired once into Sofia and the shared public catalogue with the final reviewed identity', () => {
  assert.equal(SUHODOL_20261122_RECORDS.length, 1)
  assert.equal(SUHODOL_20261122_REVIEWS.length, 1)
  assert.ok(row, 'root must wire the new source module, not test only an isolated unpublished object')
  assert.equal(SOFIA_CATALOGUE.filter(item => item.id === id).length, 1)
  assert.equal(PUBLIC_CATALOGUE.filter(item => item.id === id).length, 1)
  assert.deepEqual(row, sourceRow)
  assert.equal(hash(row), '2d33742ca4f1e2486f04d267d5930056490b87a7df6d785d5518734de47ea0e7')
  assert.equal(row.name, 'Мария Каменова · Моето слънце')
  assert.equal(row.cityCode, '68134'); assert.equal(row.neighborhood, 'Суходол')
  assert.equal(row.address, 'София, кв. Суходол, ул. Щит 9')
  assert.equal(row.locationKind, 'premises'); assert.equal(row.category, 'other')
  assert.equal(row.website, site); assert.equal(row.phone, '+359898636810')
  const prior = SOFIA_CATALOGUE.filter(item => item.id !== id)
  assert.deepEqual(auditCatalogueBatch(prior, SUHODOL_20261122_RECORDS, now).readyForReview, [id])
  assert.equal(prior.filter(item => item.phone === row.phone).length, 0)
  assert.equal(prior.filter(item => /(?:mariakamenova\.eu|moetoslunce\.com)/u.test(item.website)).length, 0)
})

test('exactly two current physical services keep literal fixed EUR fees, 60minute durations and complete external-booking wording', () => {
  assert.deepEqual(row.services.map(service => service.name), names)
  assert.equal(hash(row.services), 'e8a938d26ee844fa5ef6bf92c3aa4b6d04e86931bda7a2c579e9fb000e90cce3')
  row.services.forEach((service, index) => {
    assert.equal(service.category, 'other'); assert.equal(service.appointmentModel, 'appointment')
    assert.equal(service.description, descriptions[index])
    assert.deepEqual(service.price, { amount: index ? 60 : 50, currency: 'EUR', kind: 'fixed', sourceUrl: booking,
      checkedOn: '2026-11-22', validUntil: '2026-12-22' })
    assert.equal(service.price.unit, undefined)
    assert.equal(service.durationMin, 60); assert.equal(service.durationSourceUrl, booking)
    assert.equal(service.durationCheckedOn, '2026-11-22')
    assert.doesNotMatch(service.name, /дет|видео|онлайн|диагно|пакет|домаш|лекар|психиатр/iu)
    assert.doesNotMatch(service.description, /гарант|излекув|потвърден|диагноза|рецепта|безплат|медицинск/iu)
  })
  for (const field of ['openingHours', 'gorezBusinessId', 'photo']) assert.equal(row[field], undefined)
})

test('static normalized receipt proves the actual current physical tariff, not the older online-only or indexed prices', () => {
  assert.equal(review.inventoryIdentity, '071a732c6c5d784a600e7dea7d82110fca917ca3f5ad32225e248fb6f3261502')
  assert.equal(pricingIdentity(row), review.inventoryIdentity)
  assert.equal(review.bookingEntry, booking); assert.equal(review.bookingReview, 'provider_booking_reviewed')
  assert.equal(review.pricingDecision, undefined)
  assert.ok(review.reviewedUrls.includes(site)); assert.ok(review.reviewedUrls.includes(booking))
  for (const url of ['about', 'contact', 'privacy-policy', 'robots.txt']) assert.ok(review.reviewedUrls.includes(site + url))
  assert.ok(review.reviewedUrls.includes('https://superdoc.bg/uslovia-za-polzvane'))
  assert.match(review.notes, /selected default in-office panel/u)
  assert.match(review.notes, /second independent fresh public HTTP200 profile inspection/u)
  assert.match(review.notes, /indexed40EUR is stale/u)
  assert.match(review.notes, /not a copyright licence or legal-clearance assertion/u)
  assert.deepEqual(BOOKING_PRICE_REVIEWS.find(item => item.id === id), review)
  assert.deepEqual(assessPricingReview(row, review, now), { id, state: 'reviewed', checkedOn: '2026-11-22', reviewedPriceCount: 2 })
  const changed = { ...row, services: [{ ...row.services[0], price: { ...row.services[0].price, amount: 40 } }, row.services[1]] }
  assert.equal(assessPricingReview(changed, review, now).reason, 'reviewed_service_inventory_changed')
  assert.equal(assessPricingReview({ ...row, booking: { kind: 'form', url: site } }, review, now).reason, 'business_or_booking_target_changed')
  assert.equal(assessPricingReview(row, { ...review, inventoryIdentity: undefined }, now).reason, 'reviewed_service_inventory_changed')
})

test('the independently matched municipal postal pair preserves licence and exact owner-address binding, not the administrative district or a surveyed door', () => {
  assert.deepEqual(row.coordinates, { latitude: 42.699806, longitude: 23.225159,
    source: OFFICIAL_SOFIA_SOURCE_URL, method: 'verified_official_address',
    sourceAddress: row.address, sourceCityCode: '68134', sourceNeighborhood: 'Суходол', sourceWebsite: site,
    checkedOn: '2026-11-22', addressId: '120774', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION })
  assert.equal(hash(row.coordinates), '63f03eec36ae14f128c3c46200c01faf2e27f4fd5d12a506cd962190b6d365e4')
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.notEqual(row.neighborhood, 'Овча купел')
  assert.match(review.notes, /not a surveyed practice entrance/u)
  for (const [field, value] of Object.entries({ address: row.address + 'А', cityCode: '44238', neighborhood: 'Овча купел', website: 'https://example.org/' })) {
    const changed = { ...row, [field]: value }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false)
    assert.equal(catalogueBoundCoordinates(changed), null)
  }
})

test('GPS-radius discovery retains strict actual category, quarter and city scope and does not manufacture native slots', () => {
  const intent = { cityCode: '68134', neighborhood: 'Суходол', category: 'other', browse: true, searchV2: true,
    coordinates: { latitude: 42.699806, longitude: 23.225159, consent: true }, radiusKm: 0.25 }
  const [found] = normalizeCatalogueBusinesses([row], intent, { now })
  assert.ok(found); assert.equal(found.id, id)
  assert.equal(rankCatalogueBusinesses([], [found], intent)[0].distanceKm, 0)
  assert.deepEqual(found.availability, { status: 'external', slots: [] })
  assert.deepEqual(found.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
  for (const patch of [{ neighborhood: 'Филиповци' }, { cityCode: '44238' }, { category: 'barber' },
    { coordinates: { latitude: 42.72, longitude: 23.225159, consent: true } }]) {
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, ...patch }, { now }), [])
  }
  assert.deepEqual(normalizeCatalogueBusinesses([{ ...row, coordinates: null }], intent, { now }), [])
})

test('external calendar and verified postal-point directions remain distinct from a confirmed GoRez reservation', () => {
  assert.deepEqual(row.booking, { kind: 'form', url: booking })
  assert.equal(row.verification.booking.url, site + 'contact')
  assert.match(row.verification.booking.excerpt, /Запази час през Superdoc/u)
  assert.equal(row.verification.contact, site + 'contact')
  const [found] = normalizeCatalogueBusinesses([row], { cityCode: '68134', browse: true, searchV2: true }, { now })
  assert.deepEqual(railExternalAction(found, now), { kind: 'form', href: booking })
  assert.equal(found.source, 'catalogue'); assert.equal(found.gorezBusinessId, undefined)
  assert.equal(found.address, row.address)
  assert.equal(new URL(businessMapsDirectionsUrl({ ...found, navigationLocation: cataloguePublicLocation(row) })).searchParams.get('destination'), '42.699806,23.225159')
  assert.equal(row.openingHours, undefined)
  assert.deepEqual(catalogueBusinessDetails(row, now).hours, [])
})

test('BG/EN onboarding searches the same real office and imports both literal service prices/durations with no uncredited municipal pin', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  for (const locale of ['bg', 'en']) {
    const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(row.name)}&city=68134&lang=${locale}`))
    assert.equal(search.status, 200)
    const business = (await search.json()).businesses.find(item => item.id === id)
    assert.ok(business); assert.equal(business.serviceCount, 2); assert.equal(business.currentPriceCount, 2)
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.address, row.address); assert.equal(draft.business.neighborhood, 'Суходол')
    assert.equal(draft.business.phone, row.phone); assert.equal(draft.business.website, site)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 2)
    draft.services.forEach((service, index) => {
      assert.equal(service.name, names[index]); assert.equal(service.description, descriptions[index])
      assert.equal(service.price, String(index ? 60 : 50)); assert.equal(service.currency, 'EUR')
      assert.equal(service.duration_min, '60'); assert.deepEqual(service.price_details, { kind: 'fixed' })
      assert.equal(service.catalogueHint.description, descriptions[index])
      assert.match(service.catalogueHint.priceLabel, /(?:50|60)/u)
      assert.doesNotMatch(service.catalogueHint.priceLabel, /лв|BGN|40/u)
    })
  }
})

test('actual public details retain two complete priced services, current EN presentation and the external booking destination', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, now: () => now, allowAttempt: () => true,
    findCatalogue: requested => SOFIA_CATALOGUE.find(item => item.id === requested), readCataloguePhotos: async () => [],
    readPartner: () => { throw Error('No private/native lookup') } })
  const response = await handler(new Request('https://www.gorez.co/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  assert.equal(business.id, id); assert.deepEqual(business.coordinates, { latitude: 42.699806, longitude: 23.225159 })
  assert.deepEqual(business.booking, { kind: 'form', url: booking, verified: true, checkedOn: '2026-11-22', validUntil: '2026-12-22' })
  assert.deepEqual(business.details.services.map(service => [service.name, service.price, service.currency, service.durationMin]),
    [[names[0], 50, 'EUR', 60], [names[1], 60, 'EUR', 60]])
  assert.deepEqual(business.details.hours, [])
  for (const locale of ['bg', 'en']) {
    assert.ok(businessDisplayAddress(business, locale))
    business.details.services.forEach((service, index) => {
      assert.equal(serviceDisplayName(service, locale), locale === 'bg' ? names[index] : ['Psychological consultation', 'Family Therapy'][index])
      const description = publicProse(service.description, locale, service.presentationEn?.description)
      assert.ok(description)
      if (locale === 'bg') assert.equal(description, descriptions[index])
      else {
        assert.doesNotMatch(description, /[а-яѝ]|translation pending/iu)
        assert.match(description, /(?:external|specialist)/iu)
      }
    })
  }
})

test('22December is the final eligible day; new point and two current prices never extend the short source review', () => {
  assert.equal(row.verification.checkedOn, '2026-11-22'); assert.equal(row.verification.validUntil, '2026-12-22')
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-11-21T12:00:00Z')), null)
  assert.ok(approvedCatalogueRecord(row, Date.parse('2026-12-22T23:59:59Z')))
  const expired = Date.parse('2026-12-23T00:00:00Z')
  assert.equal(approvedCatalogueRecord(row, expired), null)
  assert.equal(catalogueOnboardingDetail([row], id, { now: expired }), null)
  assert.deepEqual(normalizeCatalogueBusinesses([row], { cityCode: '68134', browse: true, searchV2: true }, { now: expired }), [])
  assert.equal(assessPricingReview(row, review, expired).state, 'pending')
  assert.ok(catalogueBusinessDetails(row, expired).services.every(service => service.price === null))
})

test('one two-service office fills one Suhodol physical cell, not two businesses, a mobile provider or an OvchaKupel branch', () => {
  const report = catalogueCoverageReport([row], { now, target: 30 })
  assert.equal(report.counts.sourceRecords, 1); assert.equal(report.counts.approvedBusinesses, 1)
  assert.equal(report.counts.premises, 1); assert.equal(report.counts.premisesWithBoundCoordinates, 1)
  assert.equal(report.counts.serviceAreaProviders, 0); assert.equal(report.counts.businessCategoryIncidences, 1)
  const nonempty = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells
    .filter(item => item.count > 0).map(item => ({ neighborhood: area.name, ...item })))
  assert.equal(nonempty.length, 1)
  assert.equal(nonempty[0].neighborhood, 'Суходол'); assert.equal(nonempty[0].categoryId, 'other')
  assert.equal(nonempty[0].count, 1); assert.equal(nonempty[0].locatedCount, 1); assert.equal(nonempty[0].gap, 29)
  assert.deepEqual(nonempty[0].businessIds, [id])
})

test('both services use explicitly reviewed existing activity photos in BG/EN, not operator photos, notebooks or missing artwork', async () => {
  for (const locale of ['bg', 'en']) for (const [index, service] of row.services.entries()) {
    const image = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, row) }, { business: row, locale })
    assert.equal(image.type, 'photo'); assert.equal(image.photoMatch, 'activity')
    assert.equal(image.src, `/service-photos/${['psychology-consultation', 'family-counselling'][index]}-v1.webp`)
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /notebook|appointment-workspace|neutral|online/u)
    const bytes = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF'); assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
  }
})
