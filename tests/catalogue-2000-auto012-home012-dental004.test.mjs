import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-012-20261113.mjs'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-012-20261113.mjs'
import dental from '../lib/discovery/catalogue-data/neighborhood-dental-2000-004-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = business => serviceThumbnail({ ...business.services[0], ...catalogueServicePhotoFields(business.services[0], business) }, { business })

test('fourteen independently reviewed providers are searchable with their real services, prices and specific photos in onboarding', () => {
  const records = [auto, home, dental].flatMap(batch => batch.records)
  assert.equal(records.length, 14)
  assert.equal(records.flatMap(item => item.services).length, 14)
  for (const source of records) {
    const business = row(source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state,
      business.services[0].price ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    assert.equal(imported.services[0].price, business.services[0].price ? String(business.services[0].price.amount) : '')
    if (business.services[0].price) {
      assert.equal(imported.services[0].currency, 'EUR')
      assert.equal(imported.services[0].price_details.kind, business.services[0].price.kind)
      assert.equal(imported.services[0].price_details.unit, business.services[0].price.unit)
    }
    assert.equal(image(business).type, 'photo')
    assert.ok(['exact', 'activity'].includes(image(business).photoMatch), source.id)
  }
})

test('fitting consultations preserve paid-first, maximum length, purchase credits and garment-value restrictions', () => {
  const areti = row('sofia-areti-krum-popov63').services[0]
  assert.equal(areti.price.amount, 30)
  assert.equal(areti.durationMin, 90)
  const jollie = row('sofia-atelier-jollie-rozova-dolina12b').services[0]
  assert.equal(jollie.price.amount, 20)
  assert.equal(jollie.durationMin, undefined)
  assert.match(jollie.description, /отпада при покупка/)
  const queen = row('sofia-be-queen-kaliakra27').services[0]
  assert.match(queen.description, /седем модела/)
  assert.match(queen.description, /38 EU/)
  const carrie = row('sofia-carrie-bridal-vaccarini3').services[0]
  assert.equal(carrie.price.amount, 35)
  assert.match(carrie.name, /над 1500 EUR/)
  assert.match(carrie.description, /приспада при поръчка/)
  const residence = row('sofia-wedding-residence-bunaya16').services[0]
  assert.equal(residence.price.amount, 30)
  assert.match(residence.description, /съответния модел/)
  for (const business of home.records.filter(item => item.category === 'other')) {
    assert.match(image(row(business.id)).src, /sx-dress-fitting-consultation-v1\.webp$/)
  }
})

test('three onsite computer providers have one citywide record each, real visit pricing or a strict unpublished receipt and no notebook image', () => {
  const businesses = home.records.filter(item => item.category === 'home_services').map(item => row(item.id))
  assert.equal(businesses.length, 3)
  for (const business of businesses) {
    assert.equal(business.locationKind, 'service_area')
    assert.equal(business.address, null)
    assert.equal(business.coordinates, null)
    assert.equal(business.services[0].durationMin, undefined)
    assert.match(image(business).src, /sx-home-computer-support-v1\.webp$/)
  }
  assert.deepEqual([businesses[0].services[0].price.amount, businesses[0].services[0].price.kind], [45, 'from'])
  assert.ok(businesses.slice(1).every(item => item.services[0].price === undefined))
  assert.equal(row('sofia-serviz-computri-home-support').openingHours.days.length, 7)
})

test('badminton coach-only fee cannot silently become an all-inclusive lesson or a child-class image', () => {
  const business = row('sofia-badminton-teo-vitosha155'), service = business.services[0]
  assert.equal(service.price.amount, 20)
  assert.equal(service.durationMin, 60)
  assert.match(service.name, /без корт/)
  assert.match(service.price.unit, /без задължителната отделна такса корт/)
  assert.match(service.description, /8 EUR/)
  assert.match(service.description, /11 EUR/)
  assert.match(image(business).src, /sx-adult-badminton-private-coaching-v1\.webp$/)
  assert.equal(business.openingHours, undefined, 'court opening times do not imply coach availability')
})

test('mobile booster fee includes Sofia attendance but conflicting diagnostic fees and metadata-only PM coverage stay held', () => {
  const business = row('sofia-bgdiagnostika-mobile-booster'), service = business.services[0]
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(service.price.amount, 25)
  assert.match(service.description, /12V бустер/)
  assert.match(service.price.unit, /включено посещение/)
  assert.equal(business.services.length, 1)
  assert.match(image(business).src, /sx-auto-mobile-booster-preparation-v1\.webp$/)
  assert.ok(!auto.records.some(item => /pm.?garage/i.test(item.id + item.website)))
  assert.equal(row('sofia-ben-garage-filip-kutev7').services[0].price, undefined)
  assert.equal(row('sofia-mobilcar-parva-armiya92').services[0].price, undefined)
})

test('dentistry stays within scope without free-all-days pricing, form-window hours or invented clinical outcomes', () => {
  const asova = row('sofia-spaska-asova-ekzarh-stefan62')
  assert.equal(asova.services[0].price, undefined)
  assert.match(asova.services[0].description, /в четвъртък/)
  assert.deepEqual(asova.openingHours.days.map(item => item.weekday), [1, 2, 3, 4, 5])
  assert.match(image(asova).src, /dental-exam-v1\.webp$/)
  const bgm = row('sofia-bgm-dent-lyulin8-block802')
  assert.equal(bgm.services.length, 1)
  assert.equal(bgm.services[0].price, undefined)
  assert.equal(bgm.openingHours, undefined)
  assert.equal(bgm.services[0].durationMin, undefined)
  assert.match(image(bgm).src, /dental-filling-v1\.webp$/)
  assert.ok(!dental.records.some(item => /diamonddent|sidentbg/.test(item.website)))
})

test('five owner street-house-suffix matches keep exact municipal provenance and fail closed after an address change', () => {
  for (const [id, rn] of [['sofia-areti-krum-popov63', '363'], ['sofia-atelier-jollie-rozova-dolina12b', '110639'],
    ['sofia-be-queen-kaliakra27', '1102'], ['sofia-wedding-residence-bunaya16', '42289'], ['sofia-spaska-asova-ekzarh-stefan62', '57162']]) {
    const business = row(id)
    assert.equal(business.coordinates.addressId, rn)
    assert.equal(business.coordinates.method, 'verified_official_address')
    assert.equal(catalogueBoundCoordinates({ ...business, address: business.address + 'А' }), null)
  }
})

test('Mobilcar uses its explicitly printed owner GPS, never the other workshop on the same street or a viewport', () => {
  const business = row('sofia-mobilcar-parva-armiya92')
  assert.deepEqual([business.coordinates.latitude, business.coordinates.longitude], [42.71083, 23.34597])
  assert.equal(business.coordinates.source, 'https://mobilcar.info/contact/')
  assert.equal(business.coordinates.method, 'first_party_coordinates')
  assert.equal(catalogueBoundCoordinates({ ...business, address: business.address.replace('92', '47') }), null)
  assert.notDeepEqual(business.coordinates, row('sofia-lr-solution-parva-armiya47').coordinates)
})
