import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import receipt from '../docs/catalogue-coverage/viks-lyulin8-verified-location-20261123.json' with { type: 'json' }
import { applyViksLyulin8VerifiedLocation20261123 as apply } from '../lib/discovery/catalogue-data/viks-lyulin8-verified-location-20261123.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const evidence = receipt.existingBusiness
const { id, neighborhood, municipal } = evidence
const now = Date.parse('2026-11-23T12:00:00Z')
const runtime = RAW_SOFIA_CATALOGUE.find(row => row.id === id)
const before = { ...runtime, coordinates: null }
const [after] = validateCatalogue(apply([before]))
const hash = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const location = { latitude: municipal.latitude, longitude: municipal.longitude }

test('VIKS binds exactly the verified postal point without touching the business or review', () => {
  assert.equal(RAW_SOFIA_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.deepEqual([before, after].map(hash), evidence.normalizedRecordSha256)
  assert.deepEqual({ ...after, coordinates: null }, before)
  if (runtime.coordinates) assert.deepEqual(runtime, after)
  const point = catalogueBoundCoordinates(after)
  assert.deepEqual([point.addressId, point.latitude, point.longitude, point.source, point.licence],
    [municipal.addressId, location.latitude, location.longitude, municipal.source, municipal.licence])
  assert.deepEqual([point.sourceAddress, point.sourceCityCode, point.sourceNeighborhood, point.sourceWebsite],
    [evidence.addressUnchanged, '68134', neighborhood, evidence.website])
  assert.equal(pricingIdentity(before), evidence.pricingIdentityUnchanged)
  assert.equal(pricingIdentity(after), pricingIdentity(before))
  assert.deepEqual(after.booking, evidence.bookingUnchanged)
  assert.deepEqual([after.verification.checkedOn, after.verification.validUntil],
    [evidence.verificationDatesUnchanged.checkedOn, evidence.verificationDatesUnchanged.validUntil])
  assert.equal(after.services.length, evidence.serviceCountUnchanged)
  assert.ok(after.services.every(row => !row.price))
  assert.ok(approvedCatalogueRecord(before, now) && approvedCatalogueRecord(after, now))
  for (const change of [
    { id: 'sofia-unreviewed-studio' }, { address: before.address + 'А' }, { neighborhood: 'Люлин 7' },
    { website: 'https://example.com/' }, { phone: '+359899000111' },
    { booking: { ...before.booking, url: 'https://example.com/booking' } },
    { verification: { ...before.verification, contact: 'https://example.com/' } },
  ]) {
    const changed = { ...before, ...change }
    assert.equal(apply([changed])[0], changed)
  }
  assert.equal(apply([after])[0], after)
  for (const change of [{ address: before.address + 'А' }, { neighborhood: 'Люлин 7' }, { website: 'https://example.com/' }]) {
    assert.equal(catalogueBoundCoordinates({ ...after, ...change }), null)
  }
})

test('VIKS fills the three nearby gaps without creating another business or booking destination', () => {
  const reports = [before, after].map(candidate => catalogueCoverageReport(
    SOFIA_CATALOGUE.map(row => row.id === id ? candidate : row), { now }))
  assert.equal(reports[0].counts.approvedBusinesses, reports[1].counts.approvedBusinesses)
  for (const [category, expected] of Object.entries(evidence.scopedCellCounts)) {
    const nearby = { cityCode: '68134', neighborhood, category, coordinates: location, radiusKm: 0.15, browse: true, searchV2: true }
    const search = (row, options = nearby) => normalizeCatalogueBusinesses([row], options, { now })
    assert.deepEqual(search(before), [])
    assert.deepEqual(search(after, { ...nearby, neighborhood: 'Люлин 7' }), [])
    assert.deepEqual(search(after, { ...nearby, coordinates: { ...location, longitude: 23.30 } }), [])
    const [result] = search(after)
    assert.equal(result.id, id)
    assert.deepEqual(result.coordinates, location)
    assert.deepEqual(railExternalAction(result, now), { kind: 'form', href: evidence.bookingUnchanged.url })
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    const cells = reports.map(report => report.neighborhoods.find(area => area.name === neighborhood)
      .cells.find(cell => cell.categoryId === category))
    assert.deepEqual(cells.map(cell => cell.count), expected.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), expected.located)
    assert.ok(cells[1].locatedBusinessIds.includes(id))
  }
})
