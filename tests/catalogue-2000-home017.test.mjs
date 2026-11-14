import test from 'node:test'
import assert from 'node:assert/strict'
import intake from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-017-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(business => business.id === id)
const detail = business => catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })

test('home017 exposes three unique appointment providers and three literal-price services through runtime and onboarding', () => {
  assert.equal(intake.records.length, 3)
  assert.equal(intake.records.flatMap(business => business.services).length, 3)
  assert.equal(new Set(intake.records.map(business => business.id)).size, 3)
  for (const source of intake.records) {
    const business = row(source.id), imported = detail(business)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(review => review.id === source.id), now).state, 'reviewed')
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id))
    assert.equal(imported.business.address, source.address)
    assert.deepEqual(imported.services.map(service => service.name), source.services.map(service => service.name))
    assert.equal(imported.services[0].price, String(source.services[0].price.amount))
    assert.equal(imported.services[0].currency, 'EUR')
    assert.equal(imported.services[0].price_details.unit, source.services[0].price.unit)
    assert.equal(source.coordinates, null, 'the research intake invented no owner marker')
  }
})

test('KirbyPro offers real window cleaning at 23 euros TOTAL for UP TO ten square metres, not appliance rental', () => {
  const business = row('sofia-kirbypro-home-cleaning'), service = business.services[0]
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.coordinates, null)
  assert.equal(business.booking.kind, 'phone')
  assert.equal(service.appointmentModel, 'home_visit')
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [23, 'EUR', 'fixed'])
  assert.equal(service.price.unit, 'почистване на прозорци · до 10 м²')
  assert.match(service.description, /первази и рамки отвътре и отвън, без стълба/)
  assert.match(service.description, /обем до 10 м²/)
  assert.match(service.description, /не е наем на уред/)
  assert.equal(business.openingHours, undefined, 'rental delivery hours are not cleaning appointment hours')
  assert.equal(intake.records.filter(item => item.website === 'https://kirbyrental.com/').length, 1)
})

test('Avia Invest limits the zero-euro offer to the FIRST orientation meeting, not monthly accountancy or declarations', () => {
  const business = row('sofia-avia-invest-stamboliyski41'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(service.price.unit, 'първа ориентационна консултация · без обвързване')
  assert.match(service.description, /Първа среща за уточняване/)
  assert.match(service.description, /не е цялостно счетоводно обслужване, подаване на декларации или платен абонамент/)
  assert.match(service.description, /Последващите услуги се договарят отделно/)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://accountingservice-bg.com/kontakti/' })
  assert.match(business.address, /Стамболийски.*41.*вх. А.*ет. 1.*ап. 1/)
  assert.equal(business.openingHours.days.length, 5)
  assert.ok(business.openingHours.days.every(day => day.weekday >= 1 && day.weekday <= 5 && day.periods[0].open === '09:00' && day.periods[0].close === '17:00'))
})

test('Vyarabel preserves the whole FUTURE Bulgarian-language course fee, dates, parental advance contract, extra materials and cancellation conditions', () => {
  const business = row('sofia-vyarabel-mladost4-fontanite460v'), service = business.services[0]
  assert.equal(business.neighborhood, 'Младост 4')
  assert.match(business.address, /Младост.*4.*Фонтаните.*460 В.*вътрешния двор/)
  assert.equal(business.booking.url, 'https://www.vyarabel.com/intenzivni-kursove-nvo-7')
  assert.equal(service.appointmentModel, 'group_reservation')
  assert.equal(service.price.amount, 797)
  assert.equal(service.price.unit, 'пълен курс · 10 седмици по 4 уч.ч.; 3 сборника и пробни изпити отделно')
  assert.match(service.name, /БЕЛ за НВО 7. клас · 2027/)
  assert.match(service.description, /Неделя 07:40–10:20, 28.03–13.06.2027/)
  assert.match(service.description, /Под 18 г.: договор с родител и авансово плащане/)
  assert.match(service.description, /≥2 седмици преди старта без удръжка; до старта 10%/)
  assert.match(service.description, /до средата 20% плюс изминалите занятия, дори при отсъствие/)
  assert.match(service.description, /след средата сумата не се връща/)
  assert.doesNotMatch(service.description, /гарантиран|незабавн/)
})

test('mathematics stays HELD and no hourly, academic or package unit becomes an invented fixed appointment duration', () => {
  const business = row('sofia-vyarabel-mladost4-fontanite460v')
  assert.equal(business.services.length, 1)
  assert.ok(business.services.every(service => !/математ/i.test(service.name)))
  const sourceReview = intake.reviews.find(review => review.id === business.id)
  assert.match(sourceReview.notes, /MATHoptionisOBSERVEDBUTHELD, NOTincludedinventory/)
  assert.match(sourceReview.notes, /no30\/40\/45minarithmeticor797division/)
  assert.equal(business.openingHours, undefined, 'a future course timetable is not general weekly business hours')
  for (const source of intake.records) {
    assert.equal(row(source.id).services[0].durationMin, undefined)
    assert.equal(detail(row(source.id)).services[0].duration_min, '')
  }
})

test('all three services have reviewed activity-matched illustrative photos rather than rental, accounting-package or neutral imagery', () => {
  const expected = new Map([
    ['sofia-kirbypro-home-cleaning', 'window-cleaning'],
    ['sofia-avia-invest-stamboliyski41', 'accounting-consultation'],
    ['sofia-vyarabel-mladost4-fontanite460v', 'sx-school-literature-group'],
  ])
  for (const source of intake.records) {
    const business = row(source.id), service = business.services[0]
    const fields = catalogueServicePhotoFields(service, business)
    const image = serviceThumbnail({ ...service, ...fields }, { business })
    assert.equal(fields.illustrativePhotoKey, expected.get(source.id))
    assert.equal(image.src, `/service-photos/${expected.get(source.id)}-v1.webp`)
    assert.equal(image.type, 'photo')
    assert.equal(image.source, 'illustrative')
    assert.equal(image.photoMatch, 'activity')
    assert.doesNotMatch(image.src, /notebook|neutral|vacuum-rental/)
  }
})
