import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-018-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => {
  const business = SOFIA_CATALOGUE.find(item => item.id === id)
  assert.ok(business, id)
  return business
}
const review = id => reviews.find(item => item.id === id)
const image = business => serviceThumbnail({
  ...business.services[0], ...catalogueServicePhotoFields(business.services[0], business),
}, { business })

test('018 retains five distinct actual providers, one explicitly free diagnostic and four genuinely unpublished services through runtime search and onboarding', () => {
  assert.equal(auto.records.length, 5)
  assert.equal(new Set(auto.records.map(item => item.id)).size, 5)
  assert.equal(validateCatalogue(auto.records).length, 5)
  const states = []
  for (const source of auto.records) {
    const business = row(source.id), service = business.services[0]
    assert.equal(business.services.length, 1)
    assert.deepEqual(business.services, source.services)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    const state = assessPricingReview(business, review(source.id), now).state
    assert.equal(state, service.price ? 'reviewed' : 'service_reviewed', source.id)
    states.push(state)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const found = normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
      { cityCode: '68134', category: business.category, browse: true, searchV2: true }, { now })
      .find(item => item.id === source.id)
    assert.ok(found, source.id)
    assert.equal(found.services[0].price, service.price ? service.price.amount : null)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.equal(imported.services[0].name, service.name)
    assert.equal(imported.services[0].price, service.price ? String(service.price.amount) : '')
    assert.equal(imported.services[0].description, service.description)
    assert.equal(imported.services[0].duration_min, '')
    assert.equal(service.durationMin, undefined)
    const photo = image(business)
    assert.equal(photo.type, 'photo')
    assert.ok(['exact', 'activity'].includes(photo.photoMatch))
    assert.doesNotMatch(photo.src, /notebook|neutral/)
    if (!service.price) {
      const receipt = review(source.id)
      assert.equal(receipt.pricingDecision, 'not_publicly_listed')
      assert.equal(receipt.priceSearch.outcome, 'not_published')
      assert.ok(receipt.reviewedUrls.includes(receipt.priceSearch.bookingUrl))
      assert.ok(receipt.priceSearch.serviceUrls.length)
      assert.ok(receipt.priceSearch.serviceUrls.every(url => receipt.reviewedUrls.includes(url)))
    }
  }
  assert.equal(states.filter(state => state === 'reviewed').length, 1)
  assert.equal(states.filter(state => state === 'service_reviewed').length, 4)
})

test('Mitaka is its own GTP phone appointment at65E, not another workshop contact, a guessed duration or an inferred numeric fee', () => {
  const business = row('sofia-mitaka-service-gtp-kliment65e'), service = business.services[0]
  assert.equal(business.address, 'София, бул. Св. Климент Охридски 65Е')
  assert.equal(business.website, 'https://subarumitaka.com/')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359877338533' })
  assert.equal(business.verification.booking.url, 'https://subarumitaka.com/за-нас/')
  assert.equal(service.name, 'Годишен технически преглед на автомобил')
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.openingHours, undefined, 'generic repair hours do not prove inspection-department hours')
  assert.match(image(business).src, /vehicle-technical-inspection-v1\.webp$/)
})

test('Become Pro is one arranged Sofia in-person football service for10–24, not a digital0.50EUR programme or fixed invented field', () => {
  const business = row('sofia-become-pro-football-sofia'), service = business.services[0]
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.neighborhood, null)
  assert.equal(business.coordinates, null)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://becomeprofootball.com/individual-training' })
  assert.match(service.name, /футболна тренировка.*10–24/)
  assert.equal(service.appointmentModel, 'individual_training')
  assert.match(service.description, /след заявка и потвърждение/)
  assert.match(service.description, /терен, ден, час и такса се уточняват/)
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.doesNotMatch(service.description, /0[.,]50|безплатн|гарантиран/i)
  assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now }).business.coordinates, undefined)
  assert.match(image(business).src, /sx-football-private-coaching-v1\.webp$/)
})

test('Motorche literal0 is only diagnosis of a detached automobile electricmotor, not free repair, removal, installation or a whole-car inspection', () => {
  const business = row('sofia-motorche-ivan-ivanov58'), service = business.services[0]
  assert.equal(business.address, 'София, бул. Инженер Иван Иванов 58')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359888892924' })
  assert.deepEqual(service.price, {
    amount: 0, currency: 'EUR', kind: 'fixed',
    unit: 'само диагностика на вече свален автомобилен електромотор',
    sourceUrl: 'https://motorche.bg/bezplatna-diagnostika/', checkedOn: '2026-11-14', validUntil: '2027-02-12',
  })
  assert.match(service.name, /предварително свален автомобилен електромотор/)
  assert.match(service.description, /Безплатна е само диагностиката на вече свален автомобилен електромотор/)
  assert.match(service.description, /Демонтаж и монтаж не се извършват/)
  assert.match(service.description, /ремонт е по отделна оферта/)
  assert.match(service.description, /не е преглед на цял автомобил/)
  assert.equal(review(business.id).pricingDecision, undefined)
  assert.equal(review(business.id).priceSearch, undefined)
  assert.deepEqual(business.openingHours.days.map(day => [day.weekday, day.periods]),
    [1, 2, 3, 4, 5].map(weekday => [weekday, [{ open: '10:00', close: '18:00' }]]))
  assert.match(image(business).src, /sx-auto-detached-electric-motor-diagnosis-v1\.webp$/)
})

test('Folklorika adds two actual separate premises for confirmed PRIVATE adult folk lessons, never advanced-group or room clones', () => {
  const businesses = ['sofia-folklorika-oki-nadezhda-lomsko2', 'sofia-folklorika-serdika-gyueshevo50'].map(row)
  assert.equal(new Set(businesses.map(business => business.address)).size, 2)
  assert.match(businesses[0].address, /Ломско шосе 2, ОКИ Надежда, зала на приземния етаж/)
  assert.match(businesses[1].address, /Гюешево 50, до бл\. 12, спортен комплекс G & R Gym Serdika/)
  for (const business of businesses) {
    const service = business.services[0]
    assert.deepEqual(business.booking, { kind: 'phone', phone: '+359888973718' })
    assert.equal(business.verification.booking.url, 'https://www.folklorika.com/individual.html')
    assert.equal(service.name, 'Индивидуален урок по български народни танци за възрастен')
    assert.equal(service.appointmentModel, 'individual_training')
    assert.equal(service.price, undefined)
    assert.equal(service.durationMin, undefined)
    assert.equal(business.openingHours, undefined)
    assert.match(service.description, /само след телефонна уговорка/)
    assert.match(service.description, /мястото и възможността се потвърждават от школата/)
    assert.match(service.description, /Не е записване в начинаеща група или свободен достъп/)
    assert.doesNotMatch(service.name, /груп|пеене|ниво/i)
    assert.match(image(business).src, /sx-bulgarian-folk-private-lesson-v1\.webp$/)
    assert.ok(review(business.id).reviewedUrls.includes('https://www.folklorika.com/adults.html'))
  }
})

test('018 facts expire at the same dated boundary in public normalization and draft lookup', () => {
  const expired = Date.parse('2027-02-13T12:00:00Z')
  for (const source of auto.records) {
    const business = row(source.id)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.equal(approvedCatalogueRecord(business, expired), null)
    assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now: expired }), null)
    assert.deepEqual(normalizeCatalogueBusinesses([business],
      { cityCode: '68134', category: business.category, browse: true, searchV2: true }, { now: expired }), [])
  }
})
