import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import evidence from '../docs/catalogue-coverage/swimming-lyulin3-verified-location-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyReviewedSwimmingLyulin3Location20261123 as apply } from '../lib/discovery/catalogue-data/swimming-lyulin3-verified-location-20261123.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-23T00:00:00Z')
const id = evidence.business.id
const original = SOFIA_CATALOGUE.find(row => row.id === id)
const before = { ...original, coordinates: null }
const [after] = validateCatalogue(apply([before]))
const hash = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')

test('the checked school postal point is the only field changed on the exact premises', () => {
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.equal(hash(before), evidence.identities.normalizedPriorRowSha256)
  assert.equal(hash(after), evidence.identities.normalizedAfterRowSha256)
  assert.deepEqual({ ...after, coordinates: null }, before)
  assert.equal(pricingIdentity(before), evidence.identities.unchangedPricingIdentitySha256)
  assert.equal(pricingIdentity(after), pricingIdentity(before))
  const point = catalogueBoundCoordinates(after)
  const { uniqueCivicRow: civic, municipalSource: source } = evidence.coordinateReview
  assert.deepEqual([point.addressId, point.latitude, point.longitude], [civic.rn, civic.latitude, civic.longitude])
  assert.deepEqual([point.source, point.licence, point.attribution], [source.url, source.licence, source.attribution])
  assert.equal(point.sourceAddress, before.address)
  if (original.coordinates) assert.deepEqual(original, after)
  for (const row of [after, { ...before, address: before.address.replace('№ 8', '№ 9') },
    { ...before, neighborhood: 'Люлин 2' }, { ...before, booking: { ...before.booking, phone: '+359885721338' } },
    { ...before, verification: { ...before.verification, contact: before.website } }]) {
    assert.equal(apply([row])[0], row)
  }
})

test('the existing phone-only swimming lesson fills one nearby sport cell without adding a business', () => {
  const point = catalogueBoundCoordinates(after)
  const intent = { cityCode: '68134', neighborhood: 'Люлин 3', browse: true, searchV2: true, category: 'fitness',
    radiusKm: 0.1, coordinates: { latitude: point.latitude, longitude: point.longitude } }
  const search = (business, options = intent) => normalizeCatalogueBusinesses([business], options, { now })
  assert.deepEqual(search(before), [])
  assert.deepEqual(search(after, { ...intent, neighborhood: 'Люлин 2' }), [])
  assert.deepEqual(search(after, { ...intent, coordinates: { ...intent.coordinates, longitude: 23.31 } }), [])
  const [result] = search(after)
  assert.equal(result.id, id)
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359885721337' })
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.equal(after.services[0].price.amount, 25)

  const { neighborhood, category, physicalPremises, withUsableAddressPoint } = evidence.verifiedCoverageProjection
  const reports = [before, after].map(business => catalogueCoverageReport(SOFIA_CATALOGUE.map(row => row.id === id ? business : row), { now }))
  const cells = reports.map(report => report.priorityQueue.find(row => row.neighborhood === neighborhood && row.categoryId === category))
  assert.equal(reports[0].counts.approvedBusinesses, reports[1].counts.approvedBusinesses)
  assert.deepEqual(cells.map(cell => cell.count), physicalPremises)
  assert.deepEqual(cells.map(cell => cell.locatedCount), withUsableAddressPoint)
})
