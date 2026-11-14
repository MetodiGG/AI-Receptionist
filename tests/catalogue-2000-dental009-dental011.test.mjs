import test from 'node:test'
import assert from 'node:assert/strict'
import dental009 from '../lib/discovery/catalogue-data/neighborhood-dental-2000-009-20261113.mjs'
import dental010 from '../lib/discovery/catalogue-data/neighborhood-dental-2000-010-20261113.mjs'
import dental011 from '../lib/discovery/catalogue-data/neighborhood-dental-2000-011-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const sources = validateCatalogue([...dental009.records, ...dental010.records, ...dental011.records])
const expected = new Map([
  ['sofia-coldy-dent-balgarska-legiya2', [
    ['sofia-coldy-dent-balgarska-legiya2-0', 'Първичен консултативен дентален преглед', 'dental-exam'],
  ]],
  ['sofia-andreev-dental-totleben95', [
    ['sofia-andreev-dental-totleben95-0', 'Общ дентален преглед', 'dental-exam'],
    ['sofia-andreev-dental-totleben95-1', 'Професионално почистване с ултразвук и полиране', 'dental-cleaning'],
  ]],
  ['sofia-nurident-zlatovrah52', [
    ['sofia-nurident-zlatovrah52-0', 'Безплатна присъствена дентална консултация', 'dental-exam'],
  ]],
  ['sofia-mh-dental-center-lagera59', [
    ['sofia-mh-dental-center-lagera59-0', 'Безплатна дентална консултация', 'dental-exam'],
  ]],
])
const row = id => {
  const business = SOFIA_CATALOGUE.find(item => item.id === id)
  assert.ok(business, 'integrated runtime business: ' + id)
  return business
}
const searches = new Map(normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
  { cityCode: '68134', category: 'other', browse: true, searchV2: true }, { now })
  .map(item => [item.id, item]))

test('dental009–011 retain four approved source-bound inventories and exactly five ordinary dental services', () => {
  assert.deepEqual([dental009.records.length, dental010.records.length, dental011.records.length], [2, 1, 1])
  assert.deepEqual(sources.map(item => item.id), [...expected.keys()])
  assert.equal(sources.flatMap(item => item.services).length, 5)
  for (const source of sources) {
    const business = row(source.id)
    assert.deepEqual(business.services, source.services, source.id)
    assert.deepEqual(business.services.map(item => item.name), expected.get(source.id).map(item => item[1]))
    assert.equal(business.category, 'other')
    assert.equal(business.cityCode, '68134')
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    const review = reviews.find(item => item.id === source.id)
    assert.equal(assessPricingReview(business, review, now).state,
      source.id === 'sofia-coldy-dent-balgarska-legiya2' ? 'service_reviewed' : 'reviewed', source.id)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.equal(approvedCatalogueRecord(business, Date.parse('2027-02-13T12:00:00Z')), null)
  }
})

test('runtime search and onboarding preserve the five actual service IDs, literal prices, durations and request-only booking', () => {
  for (const source of sources) {
    const business = row(source.id), search = searches.get(source.id)
    assert.ok(search, source.id)
    assert.deepEqual(search.services.map(item => [item.id, item.name]), expected.get(source.id).map(item => item.slice(0, 2)))
    assert.equal(search.booking.kind, 'form')
    assert.equal(search.booking.url, business.booking.url)
    assert.equal(search.booking.verified, true)
    assert.deepEqual(search.availability, { status: 'external', slots: [] })
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const detail = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.equal(detail.business.address, source.address)
    assert.equal(detail.business.cityCode, '68134')
    assert.equal(detail.serviceCount, source.services.length)
    for (const [index, service] of source.services.entries()) {
      assert.equal(search.services[index].price, service.price?.amount ?? null)
      assert.equal(detail.services[index].name, service.name)
      assert.equal(detail.services[index].price, service.price ? String(service.price.amount) : '')
      assert.equal(detail.services[index].currency, service.price?.currency ?? 'EUR')
      assert.equal(detail.services[index].duration_min, service.durationMin ? String(service.durationMin) : '')
      assert.equal(detail.services[index].description, service.description)
      assert.deepEqual(detail.services[index].price_details, service.price
        ? { kind: service.price.kind, ...(service.price.unit ? { unit: service.price.unit } : {}) } : {})
    }
  }
})

test('Coldy imports only the initial consultative examination with a genuine unpublished-price receipt, never a zero or full treatment protocol', () => {
  const business = row('sofia-coldy-dent-balgarska-legiya2'), service = business.services[0]
  const review = reviews.find(item => item.id === business.id)
  assert.equal(business.services.length, 1)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://coldydent.com/contact/' })
  assert.match(service.description, /конкретен поставен от пациента проблем/)
  assert.match(service.description, /предварителна заявка и потвърждение по имейл/)
  assert.match(service.description, /Не представлява целия диагностичен протокол или последващо лечение/)
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.equal(searches.get(business.id).services[0].price, null)
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, business.booking.url)
  assert.deepEqual(review.priceSearch.serviceUrls, [
    'https://coldydent.com/general-dentistry-coldy-dent/',
    'https://coldydent.com/general-terms-eng/',
    'https://coldydent.com/welcome-to-coldy-dent/',
    'https://coldydent.com/faq/',
  ])
  for (const url of [review.priceSearch.bookingUrl, ...review.priceSearch.serviceUrls]) assert.ok(review.reviewedUrls.includes(url))
  assert.ok(review.priceSearch.notes.length >= 20)
  assert.deepEqual(assessPricingReview(business, review, now), {
    id: business.id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-14', reviewedPriceCount: 0,
  })
  assert.equal(assessPricingReview(business, { ...review, priceSearch: undefined }, now).state, 'pending')
})

test('Andreev preserves FROM16 EUR/15min and FROM70 EUR/45min, ultrasound without added AirFlow, callback and no conflicting weekly hours', () => {
  const business = row('sofia-andreev-dental-totleben95'), search = searches.get(business.id)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://andreevdentalclinic.com/uslugi/' })
  assert.deepEqual(business.services.map(service => [service.price.amount, service.price.currency, service.price.kind, service.durationMin]),
    [[16, 'EUR', 'from', 15], [70, 'EUR', 'from', 45]])
  for (const service of business.services) {
    assert.equal(service.price.sourceUrl, 'https://andreevdentalclinic.bookdento.com/')
    assert.equal(service.durationSourceUrl, service.price.sourceUrl)
    assert.equal(service.price.maximum, undefined)
    assert.doesNotMatch(service.name, /Air\s*Flow|консултация/i)
    assert.match(service.description, /потвърждение от екипа/)
  }
  assert.match(business.services[0].description, /не е доплащане по НЗОК/)
  assert.match(business.services[1].description, /ултразвуков апарат и полиране/)
  assert.match(business.services[1].description, /не добавяме Air Flow от друга позиция/)
  assert.match(business.verification.booking.excerpt, /потвърждава след телефонна връзка/)
  assert.equal(business.openingHours, undefined)
  assert.deepEqual(search.details.hours, [])
  assert.equal(search.details.hoursSourceUrl, null)
  assert.deepEqual(search.details.services.map(service => [service.price, service.priceKind, service.durationMin]), [[16, 'from', 15], [70, 'from', 45]])
})

test('Nuri52 and M&H Sofia offer only literal zero-price consultations, not the unverified second branch, Burgas, imaging or treatment', () => {
  const nuri = row('sofia-nurident-zlatovrah52'), mh = row('sofia-mh-dental-center-lagera59')
  assert.deepEqual([nuri.address, nuri.phone, nuri.booking.url],
    ['София, ж.к. Лозенец, ул. Златовръх 52', '+359887770703', 'https://nurident.com/bg/contact/'])
  assert.deepEqual(SOFIA_CATALOGUE.filter(item => item.website === nuri.website).map(item => item.id), [nuri.id])
  assert.match(nuri.services[0].description, /Консултация на място.*не изпращане на снимка за дистанционно запитване/)
  assert.match(nuri.services[0].description, /не рентгеновите изследвания, имплантите, протезирането или целият курс на лечение/)
  assert.equal(nuri.services[0].price.sourceUrl, 'https://nurident.com/bg/ceni/')
  assert.deepEqual([mh.address, mh.phone, mh.booking.url],
    ['София, ж.к. Лагера, бл. 59, партер', '+359886320669', 'https://mh-dentalcenter.com/'])
  assert.deepEqual(SOFIA_CATALOGUE.filter(item => item.website === mh.website).map(item => item.id), [mh.id])
  assert.match(mh.services[0].description, /предварителна заявка за кабинета в София/)
  assert.match(mh.services[0].description, /не изработката на конструкции, протезирането, имплантите или последващото лечение/)
  assert.equal(mh.services[0].price.sourceUrl, mh.website)
  assert.equal(mh.openingHours, undefined)
  for (const business of [nuri, mh]) {
    assert.equal(business.services.length, 1)
    const service = business.services[0]
    assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [0, 'EUR', 'fixed'])
    assert.match(service.price.unit, /^само .*консултация/)
    assert.equal(service.durationMin, undefined)
    assert.doesNotMatch(service.name, /рентген|имплант|лечение|кардиолог|Бургас/i)
    const detail = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
    assert.equal(detail.services[0].price, '0')
    assert.equal(detail.services[0].duration_min, '')
  }
})

test('all five actual service IDs resolve exact activity photos: four dental exams and one ultrasound-cleaning photo, never combined AirFlow or neutral imagery', () => {
  for (const [id, services] of expected) {
    const business = row(id), search = searches.get(id)
    for (const [index, [serviceId, name, photoId]] of services.entries()) {
      assert.equal(search.services[index].id, serviceId)
      assert.equal(search.services[index].name, name)
      assert.equal(search.services[index].illustrativePhotoKey, photoId)
      const service = business.services[index], fields = catalogueServicePhotoFields(service, business)
      assert.equal(fields.illustrativePhotoKey, photoId)
      const image = serviceThumbnail({ ...service, ...fields }, { business })
      assert.equal(image.type, 'photo')
      assert.equal(image.source, 'illustrative')
      assert.ok(['exact', 'activity'].includes(image.photoMatch))
      assert.equal(image.src, `/service-photos/${photoId}-v1.webp`, serviceId)
      assert.doesNotMatch(image.src, /neutral|notebook|appointment-workspace|airflow/)
    }
  }
})
