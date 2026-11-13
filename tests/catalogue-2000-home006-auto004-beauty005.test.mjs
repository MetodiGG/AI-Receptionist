import test from 'node:test'
import assert from 'node:assert/strict'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-004-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-005-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-13T22:30:00Z')
const sources = [...home.records, ...auto.records, ...beauty.records]
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('three frozen intakes add thirty-seven real businesses with fifty-six inventory-bound service photos', () => {
  assert.deepEqual([home.records.length, auto.records.length, beauty.records.length], [15, 12, 10])
  assert.equal(new Set(sources.map(item => item.id)).size, 37)
  assert.equal(sources.flatMap(item => item.services).length, 56)
  for (const source of sources) {
    const current = row(source.id)
    assert.ok(approvedCatalogueRecord(current, now), source.id)
    const outcome = assessPricingReview(current, reviews.find(item => item.id === source.id), now)
    assert.equal(outcome.state, current.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', `${source.id}: ${outcome.reason}`)
    current.services.forEach((service, index) => {
      const image = photo(current, index)
      assert.equal(image.type, 'photo', `${source.id}: ${service.name}`)
      assert.ok(['exact', 'activity'].includes(image.photoMatch), source.id)
      assert.ok(!image.src.includes('appointment-workspace'), source.id)
    })
  }
})

test('all new businesses are searchable in partner registration with actual services and literal prices', () => {
  for (const source of sources) {
    const current = row(source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: current.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === current.id), current.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, current.id, { now, cityCode: '68134' })
    assert.equal(draft.business.id, current.id)
    assert.equal(draft.business.address, current.address)
    assert.deepEqual(draft.services.map(service => service.name), current.services.map(service => service.name))
    current.services.forEach((service, index) => {
      assert.equal(draft.services[index].price, service.price ? String(service.price.amount) : '', `${current.id}: ${service.name}`)
      if (service.price) assert.equal(draft.services[index].currency, service.price.currency)
    })
  }
})

test('monthly and course fees remain whole packages and dated art offers expire with their event', () => {
  const abacus = row('sofia-moliks-tsvetna-gradina72')
  assert.equal(abacus.services[0].price.amount, 160)
  assert.equal(abacus.services[0].price.currency, 'BGN')
  assert.match(abacus.services[0].price.unit, /4|месец/)
  assert.match(photo(abacus).src, /sx-child-abacus-group-v1\.webp$/)
  assert.equal(row('sofia-maximum-solunska8').services[0].price.amount, 535)
  for (const [id, expires] of [['sofia-svetlinki-sheynovo13a', '2026-11-21'], ['sofia-artizba-cherni-vrah33e', '2026-11-18'], ['sofia-paintme-bulgaria-mall69', '2026-12-29']]) {
    const business = row(id)
    assert.equal(business.verification.validUntil, expires)
    assert.ok(business.services.every(service => service.price.validUntil === expires))
    assert.equal(approvedCatalogueRecord(business, Date.parse(expires + 'T23:59:00Z')), business)
    assert.equal(approvedCatalogueRecord(business, Date.parse(expires + 'T23:59:00Z') + 60000), null)
  }
  for (const id of ['sofia-artizba-cherni-vrah33e', 'sofia-paintme-bulgaria-mall69']) assert.match(photo(row(id)).src, /sx-adult-acrylic-painting-wine-v1\.webp$/)
  assert.match(photo(row('sofia-svetlinki-sheynovo13a')).src, /sx-child-art-group-v1\.webp$/)
})

test('swimming age context, sensor programming and mat versus reformer apparatus stay distinct', () => {
  assert.match(photo(row('sofia-malkite-ribki-kiril-buyukliyski30')).src, /sx-child-swimming-individual-v1\.webp$/)
  assert.match(photo(row('sofia-autodiag-gorublyane-deyan-popov10')).src, /sx-auto-tpms-programming-v1\.webp$/)
  const mat = row('sofia-quickfit-otets-paisiy3')
  assert.equal(mat.services[0].price.amount, 36)
  assert.equal(mat.services[0].durationMin, undefined)
  assert.match(photo(mat).src, /sx-mat-pilates-individual-v1\.webp$/)
  assert.match(photo(row('sofia-balansense-galichitsa33')).src, /reformer-pilates-v1\.webp$/)
  const climb = row('sofia-balkan-climbing-187ma9')
  assert.match(climb.services[0].description, /2,95/)
  assert.match(photo(climb).src, /sx-climbing-private-v1\.webp$/)
})

test('spa qualifications and unpublished appointment fees are not replaced by courses or inaccessible calendars', () => {
  const unpriced = row('sofia-healing-hands-chavdar39b')
  assert.ok(unpriced.services.every(service => !service.price && !service.durationMin))
  assert.equal(unpriced.booking.kind, 'phone')
  const homeVisit = row('sofia-golden-hands-massage-home-visits')
  assert.equal(homeVisit.locationKind, 'service_area')
  assert.equal(homeVisit.coordinates, null)
  assert.equal(homeVisit.services[0].price.amount, 61)
  assert.equal(homeVisit.services[0].durationMin, 120)
  assert.match(photo(homeVisit).src, /sx-home-classical-massage-v1\.webp$/)
  for (const service of row('sofia-grand-hotel-sofia-health-centre').services) {
    assert.match(service.name, /включен СПА ден/)
    assert.match(service.description, /ДДС/)
    assert.equal(service.price.currency, 'BGN')
  }
  const ortus = row('sofia-ortus-wellness-hyatt')
  assert.ok(ortus.services.every(service => service.price.sourceUrl.endsWith('/treatments')))
  assert.equal(ortus.booking.kind, 'phone')
})

test('owner literal complex GPS is used instead of its different postal point and ambiguous entrances remain unlocated', () => {
  const complex = row('sofia-malinova-dolina-sport-kliment127g')
  assert.deepEqual(complex.coordinates, { latitude: 42.630767, longitude: 23.360355, method: 'first_party_coordinates', source: 'https://malinovasport.bg/', sourceAddress: complex.address })
  assert.equal(catalogueBoundCoordinates(complex), complex.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...complex, address: complex.address + 'А' }), null)
  for (const id of ['sofia-dirty-garage-mladost2-block272b', 'sofia-malkite-ribki-kiril-buyukliyski30', 'sofia-balansense-galichitsa33', 'sofia-quickfit-otets-paisiy3']) assert.equal(row(id).coordinates, null, id)
})
