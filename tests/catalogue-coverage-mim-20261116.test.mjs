import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-mim-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { approvedCatalogueRecord, catalogueRecordSchema, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates, applyCatalogueCoordinateBindings } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION, OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const id = 'sofia-mim-auto96-knyazhevo-lyublyana69'
const site = 'https://www.mim96.eu/', book = `${site}zaqvka/`
const names = [
  'Механична диагностика на автомобил', 'Ремонт и преглед на ходова част',
  'Ремонт на спирачна система', 'Смяна на масло и филтри',
]
const photoKeys = ['sx-auto-general-service-repair', 'sx-auto-suspension-diagnose-repair', 'sx-auto-brake-system-repair', 'oil-change']
const source = batch.records[0]
const row = () => SOFIA_CATALOGUE.find(item => item.id === id)
const inventoryIdentityBeforeAddressEnrichment = 'd66f80409e8752ce1f173e129c8e5946e3de030dab345be7866add36933199f7'
const point = { latitude: 42.666068, longitude: 23.249097 }

test('MIM admits one strictly validated physical workshop and only the four explicitly sourced appointment services', async () => {
  assert.equal(batch.records.length, 1)
  assert.equal(batch.reviews.length, 1)
  const [parsed] = validateCatalogue(batch.records)
  assert.deepEqual(parsed, source)
  assert.deepEqual(parsed.services.map(service => service.name), names)
  assert.equal(parsed.locationKind, 'premises')
  assert.equal(parsed.category, 'auto_repair')
  assert.ok(parsed.services.every(service => service.category === 'auto_repair' && service.appointmentModel === 'appointment'))
  assert.ok(parsed.services.every(service => !/DPF|EGR|компютър|софтуер|чип|пътна помощ|части за продажба/iu.test(service.name)))
  assert.throws(() => validateCatalogue([{ ...source, additionalPublishedPhone: '+359876769696' }]), /Unrecognized key/u)
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/research-auto-004-20261116.json', import.meta.url)))
  const evidence = ledger.ready.find(item => item.proposedId === id)
  assert.ok(evidence)
  for (const key of ['name', 'cityCode', 'neighborhood', 'address', 'locationKind', 'category', 'website', 'phone', 'booking']) {
    assert.deepEqual(source[key], evidence[key], key)
  }
  assert.equal(evidence.coordinates, null, 'The original source-review ledger remains historical; the later official match is separate evidence')
  assert.deepEqual(evidence.selectedServices.map(service => service.name), [
    'Диагностика', 'Ремонт и преглед на ходова част', 'Ремонт спирачна система', 'Смяна масло и филтри',
  ])
})

test('the numerical tariff is honestly absent and the source-reviewed receipt is bound to the exact selected inventory', () => {
  const [parsed] = validateCatalogue(batch.records)
  const review = { ...batch.reviews[0], inventoryIdentity: pricingIdentity(parsed) }
  assert.equal(review.bookingEntry, book)
  assert.equal(review.bookingReview, 'owned_booking_reviewed')
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, book)
  assert.deepEqual(review.reviewedUrls, [site, book, `${site}uslugi/`, `${site}kontakti/`, `${site}za-nas/`, OFFICIAL_SOFIA_SOURCE_URL])
  assert.deepEqual(review.priceSearch.serviceUrls, [`${site}uslugi/`, site])
  assert.ok(review.priceSearch.serviceUrls.every(url => review.reviewedUrls.includes(url)))
  assert.ok(parsed.services.every(service => service.price === undefined && service.durationMin === undefined && service.durationSourceUrl === undefined))
  const result = assessPricingReview(parsed, review, now)
  assert.equal(result.state, 'service_reviewed')
  assert.equal(result.pricingState, 'not_publicly_listed')
  assert.equal(result.reviewedPriceCount, 0)
  const changed = { ...parsed, services: parsed.services.map((service, index) => index ? service : { ...service, name: 'Компютърна диагностика' }) }
  assert.notEqual(assessPricingReview(changed, review, now).state, 'service_reviewed')
  const withInventedFreePrice = { ...parsed, services: parsed.services.map((service, index) => index ? service : { ...service,
    price: { amount: 0, currency: 'EUR', kind: 'fixed', sourceUrl: `${site}uslugi/`, checkedOn: '2026-11-16' },
  }) }
  assert.equal(assessPricingReview(withInventedFreePrice, { ...review, inventoryIdentity: pricingIdentity(withInventedFreePrice) }, now).reason,
    'unpublished_price_receipt_contains_prices')
})

test('the unchanged owner street binds only the unique municipal postal point, not an inferred entrance or Saturday schedule', async () => {
  assert.equal(source.neighborhood, 'Княжево')
  assert.equal(source.address, 'София, кв. Княжево, ул. Любляна 69')
  assert.deepEqual(source.coordinates, {
    ...point, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: source.address, sourceCityCode: '68134', sourceNeighborhood: 'Княжево', sourceWebsite: site,
    checkedOn: '2026-11-16', addressId: '93387', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION,
  })
  assert.equal(catalogueBoundCoordinates(source), source.coordinates)
  const ledger = JSON.parse(await readFile(new URL('../docs/catalogue-coverage/research-official-address-004-20261116.json', import.meta.url)))
  assert.equal(ledger.checkedOn, '2026-11-16')
  assert.equal(ledger.source.url, OFFICIAL_SOFIA_SOURCE_URL)
  assert.equal(ledger.source.sha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(ledger.source.licence, source.coordinates.licence)
  assert.equal(ledger.source.attribution, OFFICIAL_SOFIA_ATTRIBUTION)
  const evidence = ledger.ready.find(item => item.id === id)
  for (const key of ['address', 'neighborhood', 'website']) assert.equal(evidence[key], source[key], key)
  assert.equal(evidence.ownerSource, source.verification.contact)
  assert.equal(evidence.result.status, 'unique')
  assert.equal(evidence.result.candidates, 1)
  assert.deepEqual(evidence.result.coordinates, point)
  assert.equal(evidence.result.officialAddress.rn, source.coordinates.addressId)
  assert.equal(evidence.result.officialAddress.street, 'ул. Любляна')
  assert.equal(evidence.result.officialAddress.house, '69')
  assert.equal(evidence.result.officialAddress.settlement, 'гр. София')
  assert.equal(evidence.result.officialAddress.entrance, '', 'No entrance is certified by the reviewed postal match')
  assert.equal(source.openingHours, undefined)
  assert.equal(source.phone, '+359895969696')
  assert.deepEqual(source.booking, { kind: 'form', url: book })
  assert.equal(source.verification.contact, `${site}kontakti/`)
  assert.equal(source.verification.booking.url, book)
  assert.match(source.verification.booking.excerpt, /желани дата и час/u)
  assert.match(batch.reviews[0].notes, /Saturday09–17.*Saturdayclosed/u)
  assert.match(batch.reviews[0].notes, /DPF\/EGR removal or defeat.*excluded/u)
  assert.match(batch.reviews[0].notes, /Coordinates were initially null/u)
  assert.match(batch.reviews[0].notes, /not independent certification of the workshop entrance/u)
  for (const service of source.services) {
    assert.match(service.description, /заявка/iu)
    assert.match(service.description, /дата и час/u)
    assert.match(service.description, /потвърждава посещението/u)
    assert.match(service.description, /цената.*на място/u)
    assert.doesNotMatch(service.description, /безплат|гарантиран|\d+\s*(?:€|лв|мин)/iu)
  }
})

test('the official MIM point fails closed on changed address, city, quarter, owner website or municipal source', () => {
  const intent = { cityCode: '68134', category: 'auto_repair', browse: true, searchV2: true }
  const mutations = [
    { address: 'София, кв. Княжево, ул. Любляна 70' },
    { cityCode: '56784' },
    { neighborhood: 'Карпузица' },
    { neighborhood: null },
    { website: 'https://example.org/' },
    ...[
      { source: `${OFFICIAL_SOFIA_SOURCE_URL}?unreviewed=1` },
      { source: source.verification.contact },
      { sourceAddress: 'София, кв. Княжево, ул. Любляна 70' },
      { sourceCityCode: '56784' },
      { sourceNeighborhood: 'Карпузица' },
      { sourceWebsite: 'https://example.org/' },
    ].map(patch => ({ coordinates: { ...source.coordinates, ...patch } })),
  ]
  for (const patch of mutations) {
    const changed = { ...source, ...patch }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, JSON.stringify(patch))
    assert.equal(catalogueBoundCoordinates(changed), null, JSON.stringify(patch))
    assert.equal(applyCatalogueCoordinateBindings([changed])[0].coordinates, null, JSON.stringify(patch))
    assert.equal(approvedCatalogueRecord(changed, now), null, JSON.stringify(patch))
    assert.deepEqual(normalizeCatalogueBusinesses([changed], intent, { now }), [], JSON.stringify(patch))
  }
})

test('the common catalogue contains MIM exactly once with one current, identity-bound service-reviewed receipt', () => {
  assert.equal(SOFIA_CATALOGUE.filter(item => item.id === id).length, 1)
  assert.deepEqual(row(), validateCatalogue(batch.records)[0])
  assert.equal(SOFIA_CATALOGUE.filter(item => new URL(item.website).hostname.replace(/^www\./u, '') === 'mim96.eu').length, 1)
  assert.equal(SOFIA_CATALOGUE.filter(item => item.phone === source.phone && item.address === source.address).length, 1)
  const reviews = COVERAGE_20261116_REVIEWS.filter(review => review.id === id)
  assert.equal(reviews.length, 1)
  assert.equal(pricingIdentity(row()), inventoryIdentityBeforeAddressEnrichment)
  assert.equal(reviews[0].inventoryIdentity, inventoryIdentityBeforeAddressEnrichment)
  assert.equal(reviews[0].inventoryIdentity, pricingIdentity(row()))
  assert.equal(assessPricingReview(row(), reviews[0], now).state, 'service_reviewed')
  assert.ok(approvedCatalogueRecord(row(), now))
  assert.equal(approvedCatalogueRecord(row(), Date.parse('2027-02-15T00:00:00Z')), null)
  assert.equal(approvedCatalogueRecord({ ...row(), verification: { ...row().verification, status: 'draft' } }, now), null)
})

test('BG and EN onboarding prefill all four actual services, the primary telephone and street without fees or minutes, and do not leak point-binding metadata', async () => {
  const handler = createCatalogueOnboardingHandler({ catalogue: SOFIA_CATALOGUE, now: () => now, allowAttempt: () => true })
  const matches = searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: source.name, cityCode: '68134' }, { now })
  assert.equal(matches.filter(item => item.id === id).length, 1)
  const search = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?q=${encodeURIComponent(source.name)}&city=68134&lang=bg`))
  assert.equal(search.status, 200)
  assert.equal((await search.json()).businesses.filter(item => item.id === id).length, 1)
  for (const locale of ['bg', 'en']) {
    const response = await handler(new Request(`https://www.gorez.co/api/public/catalogue-onboarding?id=${id}&city=68134&lang=${locale}`))
    assert.equal(response.status, 200)
    const draft = await response.json()
    assert.deepEqual(draft, catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now, cityCode: '68134', locale }))
    assert.equal(draft.business.name, source.name)
    assert.equal(draft.business.neighborhood, source.neighborhood)
    assert.equal(draft.business.address, source.address)
    assert.equal(draft.business.phone, source.phone)
    assert.equal(draft.business.website, site)
    assert.equal(draft.business.coordinates, undefined)
    assert.equal(draft.serviceCount, 4)
    assert.deepEqual(draft.services.map(service => service.name), names)
    draft.services.forEach((service, index) => {
      assert.equal(service.price, '')
      assert.equal(service.duration_min, '')
      assert.deepEqual(service.price_details, {})
      assert.equal(service.catalogueHint.priceLabel, undefined)
      assert.equal(service.description, source.services[index].description)
      assert.equal(service.catalogueHint.description, source.services[index].description)
    })
  }
})

test('public Knyazhevo auto-repair discovery preserves external confirmation with no fabricated slots, zero prices or workshop hours', () => {
  const results = normalizeCatalogueBusinesses(SOFIA_CATALOGUE, { cityCode: '68134', neighborhood: 'Княжево', category: 'auto_repair', browse: true, searchV2: true }, { now })
  const result = results.find(item => item.id === id)
  assert.ok(result)
  assert.equal(results.filter(item => item.id === id).length, 1)
  assert.equal(result.neighborhood, source.neighborhood)
  assert.equal(result.address, source.address)
  assert.deepEqual(result.coordinates, point)
  assert.deepEqual(result.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
  assert.doesNotMatch(JSON.stringify(result), /sourceAddress|sourceCityCode|sourceNeighborhood|sourceWebsite|addressId|verified_official_address/u)
  assert.equal(result.distanceKm, undefined)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(railExternalAction(result, now), { kind: 'form', href: book })
  assert.deepEqual(result.details.hours, [])
  assert.equal(result.details.hoursSourceUrl, null)
  assert.deepEqual(result.details.services.map(service => service.name), names)
  assert.deepEqual(result.details.services, catalogueBusinessDetails(row(), now).services.map((service, index) => ({
    ...service, ...(index < 3 ? { illustrativePhotoKey: photoKeys[index] } : {}),
  })))
  result.details.services.forEach((service, index) => {
    assert.equal(service.price, null)
    assert.equal(service.priceSourceUrl, null)
    assert.equal(service.durationMin, null)
    assert.equal(service.description, source.services[index].description)
  })
  assert.deepEqual(normalizeCatalogueBusinesses([row()], { cityCode: '68134', neighborhood: 'Свобода', category: 'auto_repair', browse: true, searchV2: true }, { now }), [])
  assert.deepEqual(normalizeCatalogueBusinesses([row()], { cityCode: '68134', neighborhood: 'Княжево', category: 'pets', browse: true, searchV2: true }, { now }), [])
})

test('public MIM distance and directions use the exact reviewed postal point without changing the numbered owner address', () => {
  const intent = { cityCode: '68134', neighborhood: 'Княжево', category: 'auto_repair', browse: true, searchV2: true }
  const [result] = normalizeCatalogueBusinesses([row()], intent, { now })
  assert.ok(result)
  const [atAddress] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: point })
  assert.equal(atAddress.distanceKm, 0)
  const [nearby] = rankCatalogueBusinesses([], [result], { ...intent, coordinates: { latitude: point.latitude, longitude: point.longitude + 0.01 } })
  assert.equal(nearby.distanceKm, 0.8, 'Rounded straight-line distance is not a road distance or travel time')
  assert.deepEqual(nearby.coordinates, point)
  const directions = new URL(businessMapsDirectionsUrl(nearby))
  assert.equal(directions.origin, 'https://www.google.com')
  assert.equal(directions.pathname, '/maps/dir/')
  assert.equal(directions.searchParams.get('api'), '1')
  assert.equal(nearby.address, source.address)
  assert.equal(directions.searchParams.get('destination'), `${point.latitude},${point.longitude}`)
  assert.equal(directions.searchParams.has('origin'), false, 'A visitor location is not sent by constructing directions')
  assert.equal(directions.searchParams.has('destination_place_id'), false)
  assert.doesNotMatch(directions.href, /Karpuzitsa|Карпузица|941/u)
})

test('MIM has precise mechanical, suspension, brake and oil/filter artwork instead of a computer-diagnostics claim or neutral notebook', async () => {
  for (const [index, service] of source.services.entries()) for (const locale of ['bg', 'en']) {
    const fields = catalogueServicePhotoFields(service, row())
    if (index < 3) assert.equal(fields.illustrativePhotoKey, photoKeys[index])
    const image = serviceThumbnail({ ...service, ...fields }, { business: row(), locale })
    assert.equal(image.type, 'photo')
    assert.equal(image.src, `/service-photos/${photoKeys[index]}-v1.webp`)
    assert.ok(['activity', 'exact'].includes(image.photoMatch))
    assert.ok(image.alt)
    assert.doesNotMatch(image.src, /appointment-workspace|auto-diagnostics-v1/u)
    const bytes = await readFile(new URL(`../public${image.src}`, import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
  }
})
