import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import evidence from '../docs/catalogue-coverage/dpool-lyulin2-verified-location-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyReviewedDpoolLyulin2Location20261123 as apply } from '../lib/discovery/catalogue-data/dpool-lyulin2-verified-location-20261123.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const { id, priorAddress, address } = evidence.business
const now = Date.parse('2026-11-23T00:00:00Z')
const original = SOFIA_CATALOGUE.find(row => row.id === id)
const before = { ...original, address: priorAddress, coordinates: null }
const [after] = validateCatalogue(apply([before]))
const hash = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')

test('DPOOL gains only the corrected numbered address and exact municipal postal point', () => {
  assert.equal(SOFIA_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.equal(hash(before), evidence.identities.normalizedPriorRowSha256)
  assert.equal(hash(after), evidence.identities.normalizedAfterRowSha256)
  assert.equal(after.address, address)
  assert.deepEqual({ ...after, address: priorAddress, coordinates: null }, before)
  const point = catalogueBoundCoordinates(after)
  const { uniqueCivicRow: civic, municipalSource: source } = evidence.coordinateReview
  assert.deepEqual([point.addressId, point.latitude, point.longitude], [civic.rn, civic.latitude, civic.longitude])
  assert.deepEqual([point.source, point.licence, point.attribution], [source.url, source.licence, source.attribution])
  assert.equal(point.sourceAddress, after.address)
  assert.equal(catalogueBoundCoordinates({ ...after, address: priorAddress }), null)
  if (original.coordinates) assert.deepEqual(original, after)

  for (const row of [after, { ...before, address }, { ...before, cityCode: '56784' },
    { ...before, neighborhood: 'Люлин 3' }, { ...before, phone: '+359899161219' },
    { ...before, website: 'https://example.com/' }, { ...before, booking: { ...before.booking, phone: '+359899161219' } },
    { ...before, verification: { ...before.verification, booking: { url: 'https://example.com/' } } }]) {
    assert.equal(apply([row])[0], row)
  }
})

test('DPOOL fills one nearby sport gap with the same phone appointments and price units', () => {
  assert.equal(pricingIdentity(before), evidence.identities.unchangedPricingIdentitySha256)
  assert.equal(pricingIdentity(after), pricingIdentity(before))
  assert.deepEqual(after.services.map(({ price }) => [price.amount, price.currency, price.unit]), [
    [25, 'EUR', 'една индивидуална тренировка'], [80, 'EUR', 'целият пакет от 4 индивидуални тренировки'],
  ])

  const { neighborhood, category, physicalPremises, withUsableAddressPoint } = evidence.verifiedCoverageProjection
  const { latitude, longitude } = catalogueBoundCoordinates(after)
  const nearby = { cityCode: '68134', neighborhood, browse: true, searchV2: true, category,
    radiusKm: 0.1, coordinates: { latitude, longitude } }
  const search = (business, options = nearby) => normalizeCatalogueBusinesses([business], options, { now })
  assert.deepEqual(search(before), [])
  assert.deepEqual(search(after, { ...nearby, neighborhood: 'Люлин 3' }), [])
  assert.deepEqual(search(after, { ...nearby, coordinates: { latitude, longitude: 23.31 } }), [])
  const [result] = search(after)
  assert.equal(result.id, id)
  assert.deepEqual(railExternalAction(result, now), { kind: 'phone', href: 'tel:+359899161218' })
  assert.deepEqual(result.availability, { status: 'external', slots: [] })

  const reports = [before, after].map(business => catalogueCoverageReport(SOFIA_CATALOGUE.map(row => row.id === id ? business : row), { now }))
  const cells = reports.map(report => report.priorityQueue.find(row => row.neighborhood === neighborhood && row.categoryId === category))
  assert.equal(reports[0].counts.approvedBusinesses, reports[1].counts.approvedBusinesses)
  assert.deepEqual(cells.map(cell => cell.count), physicalPremises)
  assert.deepEqual(cells.map(cell => cell.locatedCount), withUsableAddressPoint)
})
