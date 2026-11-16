import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'

const now = Date.parse('2026-11-16T12:00:00Z')
const row = SOFIA_CATALOGUE.find(item => item.id === 'sofia-uli-nails')

test('Uli recovers only its owner-stated premises quarter and literal address-bound destination', () => {
  assert.equal(row.neighborhood, 'Гео Милев')
  assert.equal(row.address, 'София, ул. Гео Милев 22')
  assert.equal(row.website, 'https://uli.bg/')
  assert.equal(row.coordinates.latitude, 42.684432)
  assert.equal(row.coordinates.longitude, 23.3582824)
  assert.equal(row.coordinates.source, 'https://uli.bg/contacts')
  assert.equal(row.coordinates.method, 'first_party_coordinates')
  assert.equal(row.coordinates.sourceAddress, row.address)
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...row, address: 'София, друг адрес 22' }), null)
  assert.equal(catalogueBoundCoordinates({ ...row, locationKind: 'service_area' }), null)
})

test('quarter recovery neither changes nor refreshes the existing price/service/booking identity', () => {
  assert.equal(pricingIdentity(row), pricingIdentity({ ...row, neighborhood: null, coordinates: null }))
  const prior = { ...row, neighborhood: null, coordinates: null }
  const before = catalogueOnboardingDetail([prior], row.id, { now, cityCode: '68134' })
  const after = catalogueOnboardingDetail([row], row.id, { now, cityCode: '68134' })
  assert.deepEqual(after.services, before.services)
  assert.equal(after.business.id, before.business.id)
  assert.equal(after.business.address, before.business.address)
  assert.equal(after.business.neighborhood, 'Гео Милев')
  assert.equal(after.business.phone, before.business.phone)
})

test('public neighborhood browse and directions receive the same recovered point without a runtime geocoder', () => {
  const results = normalizeCatalogueBusinesses([row], { cityCode: '68134', neighborhood: 'Гео Милев', category: 'nails', browse: true, searchV2: true }, { now })
  assert.equal(results.length, 1)
  assert.equal(results[0].id, row.id)
  assert.deepEqual(results[0].coordinates, { latitude: 42.684432, longitude: 23.3582824 })
  assert.equal(results[0].booking.phone, '+359876471110')
})
