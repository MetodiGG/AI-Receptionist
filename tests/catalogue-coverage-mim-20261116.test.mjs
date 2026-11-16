import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import batch from '../lib/discovery/catalogue-data/neighborhood-coverage-mim-20261116.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { COVERAGE_20261116_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-coverage-20261116.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
import { catalogueOnboardingDetail, createCatalogueOnboardingHandler, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
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
  for (const key of ['name', 'cityCode', 'neighborhood', 'address', 'locationKind', 'coordinates', 'category', 'website', 'phone', 'booking']) {
    assert.deepEqual(source[key], evidence[key], key)
  }
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
  assert.deepEqual(review.reviewedUrls, [site, book, `${site}uslugi/`, `${site}kontakti/`, `${site}za-nas/`])
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

test('the owner quarter and numbered street are retained without inventing a point or a coherent Saturday schedule', () => {
  assert.equal(source.neighborhood, 'Княжево')
  assert.equal(source.address, 'София, кв. Княжево, ул. Любляна 69')
  assert.equal(source.coordinates, null)
  assert.equal(catalogueBoundCoordinates(source), null)
  assert.equal(source.openingHours, undefined)
  assert.equal(source.phone, '+359895969696')
  assert.deepEqual(source.booking, { kind: 'form', url: book })
  assert.equal(source.verification.contact, `${site}kontakti/`)
  assert.equal(source.verification.booking.url, book)
  assert.match(source.verification.booking.excerpt, /желани дата и час/u)
  assert.match(batch.reviews[0].notes, /Saturday09–17.*Saturdayclosed/u)
  assert.match(batch.reviews[0].notes, /DPF\/EGR removal or defeat.*excluded/u)
  for (const service of source.services) {
    assert.match(service.description, /заявка/iu)
    assert.match(service.description, /дата и час/u)
    assert.match(service.description, /потвърждава посещението/u)
    assert.match(service.description, /цената.*на място/u)
    assert.doesNotMatch(service.description, /безплат|гарантиран|\d+\s*(?:€|лв|мин)/iu)
  }
})

test('the common catalogue contains MIM exactly once with one current, identity-bound service-reviewed receipt', () => {
  assert.equal(SOFIA_CATALOGUE.filter(item => item.id === id).length, 1)
  assert.deepEqual(row(), validateCatalogue(batch.records)[0])
  assert.equal(SOFIA_CATALOGUE.filter(item => new URL(item.website).hostname.replace(/^www\./u, '') === 'mim96.eu').length, 1)
  assert.equal(SOFIA_CATALOGUE.filter(item => item.phone === source.phone && item.address === source.address).length, 1)
  const reviews = COVERAGE_20261116_REVIEWS.filter(review => review.id === id)
  assert.equal(reviews.length, 1)
  assert.equal(reviews[0].inventoryIdentity, pricingIdentity(row()))
  assert.equal(assessPricingReview(row(), reviews[0], now).state, 'service_reviewed')
  assert.ok(approvedCatalogueRecord(row(), now))
  assert.equal(approvedCatalogueRecord(row(), Date.parse('2027-02-15T00:00:00Z')), null)
  assert.equal(approvedCatalogueRecord({ ...row(), verification: { ...row().verification, status: 'draft' } }, now), null)
})

test('BG and EN onboarding prefill all four actual services, the primary telephone and street without fees, minutes or guessed coordinates', async () => {
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
  assert.equal(result.coordinates, null)
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
