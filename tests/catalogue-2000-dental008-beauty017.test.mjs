import test from 'node:test'
import assert from 'node:assert/strict'
import dental from '../lib/discovery/catalogue-data/neighborhood-dental-2000-008-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-017-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const sources = validateCatalogue([...dental.records, ...beauty.records])
const row = id => {
  const business = SOFIA_CATALOGUE.find(item => item.id === id)
  assert.ok(business, 'integrated runtime business: ' + id)
  return business
}
const found = business => normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
  { cityCode: '68134', category: business.category, browse: true, searchV2: true }, { now })
  .find(item => item.id === business.id)

test('Apex two premises and Bridal Gallery retain exactly three approved inventories and nine source-bound services', () => {
  assert.deepEqual([dental.records.length, dental.reviews.length, beauty.records.length, beauty.reviews.length], [2, 2, 1, 1])
  assert.equal(sources.length, 3)
  assert.equal(sources.flatMap(item => item.services).length, 9)
  assert.equal(new Set(sources.map(item => item.id)).size, 3)
  for (const source of sources) {
    const business = row(source.id)
    assert.deepEqual(business.services, source.services, source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state, 'reviewed', source.id)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.equal(approvedCatalogueRecord(business, Date.parse('2027-02-13T12:00:00Z')), null)
  }
})

test('all three businesses are discoverable and import the same literal inventory, booking path and qualifications', () => {
  for (const source of sources) {
    const business = row(source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const search = found(business)
    assert.ok(search, source.id)
    assert.equal(search.booking.verified, true)
    assert.deepEqual(search.availability, { status: 'external', slots: [] })
    assert.deepEqual(search.services.map(item => item.name), business.services.map(item => item.name))
    const detail = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.equal(detail.business.address, source.address)
    assert.deepEqual(detail.services.map(item => item.name), source.services.map(item => item.name))
    for (const [index, service] of source.services.entries()) {
      assert.equal(search.services[index].price, service.price.amount)
      assert.equal(search.services[index].priceKind, service.price.kind)
      assert.equal(search.services[index].priceUnit, service.price.unit)
      assert.equal(detail.services[index].price, String(service.price.amount))
      assert.equal(detail.services[index].currency, service.price.currency)
      assert.equal(detail.services[index].price_details.kind, service.price.kind)
      assert.equal(detail.services[index].description, service.description)
      assert.equal(detail.services[index].duration_min, service.durationMin ? String(service.durationMin) : '')
    }
  }
})

test('Apex represents two real selectable clinics with distinct addresses and phones, not duplicate staff or invented branch URLs', () => {
  const iztok = row('sofia-apex-dental-iztok-haytov1')
  const slatina = row('sofia-apex-dental-slatina101a')
  assert.deepEqual([iztok.neighborhood, iztok.address, iztok.phone],
    ['Изток', 'София, кв. Изток, ул. Николай Хайтов 1', '+359897523411'])
  assert.deepEqual([slatina.neighborhood, slatina.address, slatina.phone],
    ['Слатина', 'София, кв. Слатина, ул. Слатинска 101А, ет. 2', '+359877879344'])
  for (const business of [iztok, slatina]) {
    assert.deepEqual(business.booking, { kind: 'form', url: 'https://apexdental.bg/' })
    assert.equal(business.verification.booking.url, 'https://apexdental.bg/')
    assert.match(business.verification.booking.excerpt, /избор между двата реални кабинета/)
    assert.match(business.verification.booking.excerpt, /не е календар с потвърден свободен час/)
    assert.deepEqual(business.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5, 6, 7])
    assert.ok(business.openingHours.days.slice(0, 5).every(day =>
      day.periods.length === 1 && day.periods[0].open === '08:00' && day.periods[0].close === '20:00'))
    assert.ok(business.openingHours.days.slice(5).every(day => day.periods.length === 0))
  }
  assert.deepEqual(iztok.services, slatina.services, 'the actual shared owner tariff, not inferred staff prices')
})

test('Apex keeps private30 EUR and exact50/50 fees distinct from NHS15 and preserves the70–80 combined-cleaning range without guessed minutes', () => {
  for (const source of dental.records) {
    const business = row(source.id)
    assert.deepEqual(business.services.map(service => [service.price.amount, service.price.currency, service.price.kind]),
      [[30, 'EUR', 'fixed'], [50, 'EUR', 'fixed'], [50, 'EUR', 'fixed'], [70, 'EUR', 'range']])
    assert.match(business.services[0].description, /Частен дентален преглед/)
    assert.match(business.services[0].description, /Не е вариантът за преглед по НЗОК/)
    assert.match(business.services[1].description, /план за лечение.*не са включен пакет/)
    const combined = business.services[3]
    assert.equal(combined.price.maximum, 80)
    assert.match(combined.name, /Ултразвуково.*Air Flow/)
    assert.match(combined.description, /диапазон 70–80 €/)
    assert.match(combined.description, /Не е само отделното полиране/)
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
    assert.equal(imported.services[3].price_details.maximum, 80)
    for (const [index, service] of business.services.entries()) {
      assert.equal(service.price.sourceUrl, 'https://apexdental.bg/ceni/')
      assert.equal(service.durationMin, undefined)
      assert.equal(imported.services[index].duration_min, '')
      assert.equal(service.price.amount === 15, false)
    }
  }
})

test('Bridal Gallery20 EUR buys one60-minute reserved fitting with at most three companions and final callback, not a dress or separate styling session', () => {
  const business = row('sofia-bridal-gallery-karnigradska13'), service = business.services[0]
  assert.equal(business.services.length, 1)
  assert.equal(business.category, 'consulting')
  assert.equal(business.address, 'София, ул. Кърниградска 13')
  assert.equal(business.phone, '+359885308371')
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://www.bridalgallery.bg/' })
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind, service.durationMin], [20, 'EUR', 'fixed', 60])
  assert.equal(service.name, 'Индивидуална проба на булчински рокли')
  assert.match(service.description, /неограничен брой рокли/)
  assert.match(service.description, /финално потвърждение от бутика по телефона/)
  assert.match(service.description, /До трима придружители/)
  assert.match(service.description, /лек или никакъв грим/)
  assert.match(service.description, /styling session се заплаща отделно и не е включена/)
  assert.match(service.description, /не е цена за покупка на рокля/)
  assert.doesNotMatch(service.description, /приспад|кредит|възстанов|безплатн|отказ/)
  assert.deepEqual(business.openingHours.days.map(day => day.weekday), [3, 4, 5, 6, 7])
  const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
  assert.equal(imported.services[0].duration_min, '60')
})

test('all nine branch services resolve exact reviewed activity photos including combined scaling+Airflow and bridal fitting, never generic neutral imagery', () => {
  for (const source of sources) {
    const business = row(source.id)
    const expected = source.id === 'sofia-bridal-gallery-karnigradska13'
      ? ['sx-bridal-dress-fitting-consultation']
      : ['dental-exam', 'dental-exam', 'dental-cleaning', 'sx-dental-scale-airflow']
    for (const [index, service] of business.services.entries()) {
      const fields = catalogueServicePhotoFields(service, business)
      const image = serviceThumbnail({ ...service, ...fields }, { business })
      assert.equal(image.type, 'photo')
      assert.equal(image.source, 'illustrative')
      assert.ok(['exact', 'activity'].includes(image.photoMatch))
      assert.equal(image.src, `/service-photos/${expected[index]}-v1.webp`, source.id)
      assert.doesNotMatch(image.src, /neutral|notebook|appointment-workspace/)
    }
  }
})
