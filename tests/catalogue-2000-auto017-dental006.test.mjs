import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-017-20261113.mjs'
import dental from '../lib/discovery/catalogue-data/neighborhood-dental-2000-006-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const records = [...auto.records, ...dental.records]
const row = id => {
  const business = SOFIA_CATALOGUE.find(item => item.id === id)
  assert.ok(business, id)
  return business
}
const image = (business, index = 0) => serviceThumbnail({
  ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business),
}, { business })

test('five actual businesses and seven literal services retain their reviewed inventories in runtime, search and onboarding', () => {
  assert.deepEqual([auto.records.length, dental.records.length], [4, 1])
  assert.equal(records.flatMap(item => item.services).length, 7)
  assert.equal(validateCatalogue(records).length, 5)
  for (const source of records) {
    const business = row(source.id)
    assert.deepEqual(business.services, source.services, source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state,
      'reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const found = normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
      { category: business.category, cityCode: '68134', browse: true, searchV2: true }, { now })
      .find(item => item.id === source.id)
    assert.ok(found, source.id)
    assert.deepEqual(found.services.map(service => service.name), business.services.map(service => service.name))
    assert.equal(found.booking.verified, true)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    for (const [index, service] of business.services.entries()) {
      assert.equal(found.services[index].price, service.price.amount)
      assert.equal(found.services[index].priceKind, service.price.kind)
      assert.equal(found.services[index].priceUnit, service.price.unit)
      assert.equal(imported.services[index].price, String(service.price.amount))
      assert.equal(imported.services[index].currency, service.price.currency)
      assert.equal(imported.services[index].price_details.kind, service.price.kind)
      assert.equal(imported.services[index].price_details.unit, service.price.unit)
      assert.equal(imported.services[index].description, service.description)
      assert.equal(imported.services[index].duration_min, '')
      assert.equal(service.durationMin, undefined)
      const photo = image(business, index)
      assert.equal(photo.type, 'photo')
      assert.ok(['exact', 'activity'].includes(photo.photoMatch), source.id)
      assert.doesNotMatch(photo.src, /neutral|notebook/)
    }
  }
})

test('mobile ignition repair keeps FROM26 EUR per labour hour and the mandatory separate30 EUR attendance, not a computed total', () => {
  const business = row('sofia-mobile-auto-899195996'), service = business.services[0]
  assert.deepEqual([service.price.kind, service.price.amount, service.price.currency], ['from', 26, 'EUR'])
  assert.equal(service.price.unit, 'час труд; такса посещение в София +30 EUR')
  assert.match(service.name, /труд на час/)
  assert.match(service.description, /от 26 EUR на час/)
  assert.match(service.description, /Отделно се дължи такса за посещение в София 30 EUR/)
  assert.match(service.description, /26 EUR не е крайна цена/)
  assert.doesNotMatch(service.description + service.price.unit, /56 EUR/)
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.coordinates, null)
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359899195996' })
  assert.match(image(business).src, /sx-auto-mobile-ignition-repair-v1\.webp$/)
})

test('Feeria Center uses the ordinary15.34 EUR coach session, never the Vanya-specific20.40 or a free first visit', () => {
  const business = row('sofia-feeria-buzludzha42'), service = business.services[0]
  assert.equal(business.address, 'София, ул. Бузлуджа 42')
  assert.equal(service.price.amount, 15.34)
  assert.equal(service.price.kind, 'fixed')
  assert.equal(service.price.unit, 'една тренировка с личен треньор · зала Център')
  assert.equal(service.appointmentModel, 'individual_training')
  assert.match(service.name, /за дами/)
  assert.match(service.description, /Една редовна тренировка/)
  assert.match(service.description, /Не е свободен фитнес вход, безплатно първо посещение/)
  assert.match(service.description, /не е|Не е|или специалната тренировка с Ваня Василева/)
  assert.match(service.description, /потвърждават с обаждане/)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://feeria-bg.com/' })
  assert.match(image(business).src, /strength-training-v1\.webp$/)
})

test('Feeria Strelbishte preserves the whole153.40 EUR Bronze programme, exact8+2 Power Plate variant and prior acceptance', () => {
  const business = row('sofia-feeria-strelbishte-dedeagach40'), service = business.services[0]
  assert.equal(business.address, 'София, ж.к. Стрелбище, ул. Дедеагач 40')
  assert.equal(service.price.amount, 153.4)
  assert.equal(service.name, 'Програма Бронз: 8 кондиционни + 2 Power Plate тренировки')
  assert.equal(service.price.unit, 'цяла програма · 8 кондиционни + 2 Power Plate · макс. 4 седмици')
  assert.match(service.description, /8 кондиционни тренировки и 2 с Power Plate/)
  assert.match(service.description, /максимум 4 седмици/)
  assert.match(service.description, /само след предварителен разговор с Ваня Василева/)
  assert.match(service.description, /153\.40 EUR е обща цена, не цена на посещение/)
  assert.doesNotMatch(service.name + service.description + service.price.unit, /Huber|хубер|медицинск|рехабилитац/i)
  assert.equal(business.openingHours, undefined, 'conflicting morning hours are not arbitrarily selected')
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://feeria-bg.com/' })
  assert.match(image(business).src, /sx-conditioning-powerplate-programme-v1\.webp$/)
})

test('Azbuki25 EUR is an adult private swim lesson with the public after17 external-visitor restriction, not a child group or fixed duration', () => {
  const business = row('sofia-azbuki-sport-musagenitsa-swimming'), service = business.services[0]
  assert.equal(service.name, 'Индивидуален урок по плуване за възрастен')
  assert.deepEqual([service.price.kind, service.price.amount, service.price.currency, service.price.unit],
    ['fixed', 25, 'EUR', 'един индивидуален урок за възрастен'])
  assert.match(service.description, /външни посетители се приемат след 17:00/)
  assert.match(service.description, /потвърждават с рецепцията/)
  assert.match(service.description, /Не е свободно плуване, детска група или медицинска рехабилитация/)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.openingHours, undefined)
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359878019013' })
  assert.equal(business.verification.booking.url, 'https://azbuki-sport.bg/contact_us')
  assert.match(image(business).src, /sx-adult-swimming-individual-v1\.webp$/)
  const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
  assert.match(imported.services[0].description, /след 17:00/)
  assert.equal(imported.services[0].duration_min, '')
})

test('Estedental free consultation remains distinct from the paid50 EUR detailed examination with NZIS card', () => {
  const business = row('sofia-estedental-maya-zhivkova-pernik90')
  assert.equal(business.services.length, 3)
  assert.equal(business.address, 'София, ул. Перник 90')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359889217402' })
  const [consultation, examination] = business.services
  assert.deepEqual([consultation.price.amount, consultation.price.currency, consultation.price.unit],
    [0, 'EUR', 'само консултация'])
  assert.match(consultation.description, /Не включва отделния детайлен преглед.*или последващо лечение/)
  assert.equal(examination.price.amount, 50)
  assert.match(examination.name, /Детайлен дентален преглед и пациентски картон в НЗИС/)
  assert.match(examination.description, /Отделна платена услуга/)
  assert.match(examination.description, /Не е безплатната/)
  assert.match(image(business, 0).src, /dental-exam-v1\.webp$/)
  assert.match(image(business, 1).src, /dental-exam-v1\.webp$/)
})

test('Estedental60 EUR is ultrasound plus paste polishing for the whole dentition, not a tooth unit, bonding clean or obsolete PDF conversion', () => {
  const business = row('sofia-estedental-maya-zhivkova-pernik90'), service = business.services[2]
  assert.equal(service.name, 'Почистване на зъбен камък с ултразвук и полиране с паста')
  assert.deepEqual([service.price.kind, service.price.amount, service.price.currency, service.price.unit],
    ['fixed', 60, 'EUR', 'цяло съзъбие'])
  assert.match(service.description, /за цялото съзъбие/)
  assert.match(service.description, /Не е цена за един зъб, избелване или отделното почистване на бондинг/)
  for (const selected of business.services) {
    assert.equal(selected.price.sourceUrl, 'https://estedental.com/stomatolog-sofia-ceni/')
    assert.equal(selected.price.checkedOn, '2026-11-14')
    assert.equal(selected.price.validUntil, '2027-02-12')
  }
  assert.ok(!reviews.find(item => item.id === business.id).reviewedUrls.some(url => /\.pdf(?:\?|$)/i.test(url)))
  assert.match(image(business, 2).src, /dental-cleaning-v1\.webp$/)
})

test('these exact dated booking and price facts expire after the reviewed period without offering stale onboarding imports', () => {
  const expired = Date.parse('2027-02-13T12:00:00Z')
  for (const source of records) {
    const business = row(source.id)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.equal(approvedCatalogueRecord(business, expired), null)
    assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now: expired }), null)
    assert.deepEqual(normalizeCatalogueBusinesses([business],
      { cityCode: '68134', category: business.category, browse: true, searchV2: true }, { now: expired }), [])
  }
})
