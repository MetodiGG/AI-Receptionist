import test from 'node:test'
import assert from 'node:assert/strict'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-016-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-016-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const sources = validateCatalogue([...home.records, ...beauty.records])
const sourceRow = id => sources.find(business => business.id === id)
const row = id => SOFIA_CATALOGUE.find(business => business.id === id)

test('home016 and beauty016 expose six independent businesses and eleven literal-price services in runtime, search and onboarding', () => {
  assert.deepEqual([home.records.length, home.reviews.length, beauty.records.length, beauty.reviews.length], [4, 4, 2, 2])
  assert.equal(sources.length, 6)
  assert.equal(sources.flatMap(business => business.services).length, 11)
  assert.equal(new Set(sources.map(business => business.id)).size, 6)
  for (const source of sources) {
    const business = row(source.id)
    assert.ok(business, 'integrated runtime business: ' + source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(review => review.id === source.id), now).state, 'reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now })
      .some(result => result.id === source.id), source.id)
    const detail = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.equal(detail.business.address, source.address)
    assert.deepEqual(detail.services.map(service => service.name), source.services.map(service => service.name))
    for (const [index, service] of source.services.entries()) {
      const imported = detail.services[index]
      assert.equal(imported.price, String(service.price.amount), source.id)
      assert.equal(imported.currency, service.price.currency, source.id)
      assert.equal(imported.price_details.kind, service.price.kind, source.id)
      assert.equal(imported.price_details.unit, service.price.unit, source.id)
      assert.equal(imported.duration_min, service.durationMin ? String(service.durationMin) : '', source.id)
      assert.equal(imported.description, service.description, source.id)
    }
  }
})

test('University Champions keeps forty free minutes with parental presence separate from fifty BGN per additional specialised hour', () => {
  const business = sourceRow('sofia-university-champions-hadzhi-dimitar135a')
  const [orientation, additional] = business.services
  assert.deepEqual([orientation.price.amount, orientation.price.currency, orientation.durationMin], [0, 'EUR', 40])
  assert.match(orientation.description, /кандидат-студента.*родител/)
  assert.match(orientation.description, /не включва целия пакет/)
  assert.deepEqual([additional.price.amount, additional.price.currency], [50, 'BGN'])
  assert.equal(additional.price.unit, 'час допълнителна специализирана консултация')
  assert.equal(additional.durationMin, undefined, 'hourly billing does not create a sixty-minute appointment')
  assert.match(additional.description, /след безплатната ориентационна среща/)
  assert.match(additional.description, /почасова в лева/)
  assert.equal(business.booking.kind, 'phone')
  assert.equal(business.phone, '+359893291761')
  assert.match(business.address, /Хаджи Димитър.*135А/)
  assert.equal(home.records.filter(item => item.website === business.website).length, 1, 'Danbul/site/staff aliases do not make extra venues')
})

test('Student Compass offers only the free orientation, with subsequent agency representation contracted and charged separately', () => {
  const business = sourceRow('sofia-student-compass-stamboliyski175a'), service = business.services[0]
  assert.equal(business.services.length, 1)
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(service.price.unit, 'ориентационна консултация за изискванията за прием')
  assert.match(service.description, /Безплатната среща не е цялата процедура/)
  assert.match(service.description, /отделен договор и такса според държавата/)
  assert.equal(business.phone, '+359886338883')
  assert.match(business.address, /Стамболийски.*175 А/)
  assert.equal(business.openingHours, undefined)
  assert.equal(service.durationMin, undefined)
})

test('Shiny House preserves the 2.80 EUR square-metre rate, 160 EUR minimum and every published shared surcharge', () => {
  const business = sourceRow('sofia-shiny-house-home-cleaning'), service = business.services[0]
  assert.deepEqual([business.locationKind, business.address, service.appointmentModel], ['service_area', null, 'home_visit'])
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [2.8, 'EUR', 'fixed'])
  assert.equal(service.price.unit, 'м² · минимум 160 EUR за посещение; доплащанията са отделно')
  assert.match(service.description, /Минимум 160 € за посещение/)
  assert.match(service.description, /празници\/нощем \+50%/)
  assert.match(service.description, /извън работно време\/почивни дни \+20%/)
  assert.match(service.description, /без асансьор 1 €\/етаж/)
  assert.match(service.description, /извън Околовръстния път транспорт 0,55 €\/км/)
  assert.match(service.description, /вода и ток/)
  assert.match(service.description, /потвърждение на ден и час/)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.booking.kind, 'form')
  assert.deepEqual(business.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5, 6, 7])
  assert.ok(business.openingHours.days.every(day => day.periods[0].open === '07:00' && day.periods[0].close === '19:00'))
})

test('Remont Sofia books a free on-site survey for up-to-one-hundred-square-metre homes, never free renovation work', () => {
  const business = sourceRow('sofia-remontiram-home-survey'), service = business.services[0]
  assert.deepEqual([business.locationKind, business.address, service.appointmentModel], ['service_area', null, 'home_visit'])
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(service.price.unit, 'оглед за цялостен ремонт · жилище до 100 м² РЗП')
  assert.match(service.description, /апартамент или къща до 100 м² РЗП/)
  assert.match(service.description, /Безплатен е огледът, не ремонтът/)
  assert.match(service.description, /индивидуална оферта/)
  assert.match(service.description, /се потвърждава/)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.openingHours, undefined)
  assert.equal(business.booking.url, 'https://remontiram.bg/')
})

test('the two hair salons retain standalone menu amounts and fixed durations without substituting promotional bundles or staff tiers', () => {
  const aurea = sourceRow('sofia-aurea-james-baucher33')
  const kosara = sourceRow('sofia-kosara-style-knyaz-boris132')
  assert.deepEqual(aurea.services.map(service => [service.price.amount, service.price.currency, service.durationMin]),
    [[25, 'EUR', 30], [17, 'EUR', 30], [30, 'EUR', 45]])
  assert.deepEqual(kosara.services.map(service => [service.price.amount, service.price.currency, service.durationMin]),
    [[20, 'EUR', 30], [20, 'EUR', 30], [15, 'EUR', 30]])
  for (const service of aurea.services) assert.match(service.description, /промоционалният пакет.*не е тази услуга/)
  for (const service of kosara.services) {
    assert.match(service.description, /Велислава Крумова/)
    assert.match(service.description, /Сешоар и цвят се избират отделно/)
    assert.match(service.description, /крайната цена се договаря в салона преди услугата/)
  }
  assert.deepEqual([aurea.booking.kind, kosara.booking.kind], ['phone', 'phone'])
  assert.ok(aurea.services.every(service => service.price.amount !== 50 && service.price.amount !== 55))
})

test('all eleven services have exact reviewed illustrative associations for their actual activities, including renovation SURVEY rather than design or execution', () => {
  const expected = new Map([
    ['sofia-university-champions-hadzhi-dimitar135a', ['sx-university-admissions-consultation', 'sx-university-admissions-consultation']],
    ['sofia-student-compass-stamboliyski175a', ['sx-university-admissions-consultation']],
    ['sofia-shiny-house-home-cleaning', ['home-deep-clean']],
    ['sofia-remontiram-home-survey', ['sx-home-renovation-onsite-survey']],
    ['sofia-aurea-james-baucher33', ['womens-haircut', 'mens-haircut', 'hair-blowdry']],
    ['sofia-kosara-style-knyaz-boris132', ['womens-haircut', 'mens-haircut', 'kids-haircut']],
  ])
  for (const source of sources) {
    const business = row(source.id)
    assert.ok(business, 'integrated runtime business: ' + source.id)
    for (const [index, service] of business.services.entries()) {
      const fields = catalogueServicePhotoFields(service, business)
      const image = serviceThumbnail({ ...service, ...fields }, { business })
      const genericBlowdry = source.id === 'sofia-aurea-james-baucher33' && index === 2
      // The reviewed generic blowdry matcher already resolves this exact
      // activity; an unnecessary business-name association is not required.
      if (genericBlowdry) assert.deepEqual(fields, {})
      else assert.equal(fields.illustrativePhotoKey, expected.get(source.id)[index], source.id)
      assert.equal(image.src, `/service-photos/${expected.get(source.id)[index]}-v1.webp`, source.id)
      assert.equal(image.type, 'photo')
      assert.equal(image.source, 'illustrative')
      assert.equal(image.photoMatch, genericBlowdry ? 'exact' : 'activity')
      assert.doesNotMatch(image.src, /notebook|neutral|appointment-workspace/)
    }
  }
})
