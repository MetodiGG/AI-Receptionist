import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import north from '../docs/catalogue-coverage/north-exact-coverage-20261123.json' with { type: 'json' }
import saltart from '../docs/catalogue-coverage/saltart-druzhba-binding-20261123.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { applyNorthExactCoverage20261123 } from '../lib/discovery/catalogue-data/north-exact-coverage-20261123.mjs'
import { applySaltartDruzhbaBinding20261123 } from '../lib/discovery/catalogue-data/saltart-druzhba-binding-20261123.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { peripheryPriorCatalogue } from './catalogue-periphery-20261123-scope.mjs'
import { pricedGrowthPriorCatalogue } from './catalogue-priced-growth-20261123-scope.mjs'

const now = Date.parse('2026-11-23T04:00:00Z')
const records = new Map(pricedGrowthPriorCatalogue(SOFIA_CATALOGUE).map(row => [row.id, row]))
const hash = row => createHash('sha256').update(JSON.stringify(row)).digest('hex')
const reviewed = [...north.recoveries.map(receipt => [receipt, applyNorthExactCoverage20261123]),
  [saltart, applySaltartDruzhbaBinding20261123]]
const historicRows = () => peripheryPriorCatalogue(SOFIA_CATALOGUE)
const bind = rows => applySaltartDruzhbaBinding20261123(applyNorthExactCoverage20261123(rows))

test('the six existing premises bind their official point without changing any commercial inventory', () => {
  const previous = new Map(historicRows().map(row => [row.id, row]))
  for (const [receipt, apply] of reviewed) {
    const row = records.get(receipt.id), original = previous.get(receipt.id), point = receipt.municipalMatch
    assert.equal(hash(row), receipt.reviewedRowSha256)
    assert.equal(hash(original), receipt.previousRowSha256)
    assert.equal(row.neighborhood, receipt.neighborhood)
    assert.equal(row.address, receipt.address)
    assert.deepEqual(row, { ...original, neighborhood: receipt.neighborhood, coordinates: row.coordinates })
    assert.equal(pricingIdentity(row), receipt.pricingIdentity)
    assert.equal(pricingIdentity(original), receipt.pricingIdentity)
    assert.deepEqual(apply([original]), [row])
    assert.equal(apply([row])[0], row)

    const bound = catalogueBoundCoordinates(row)
    assert.deepEqual([bound?.addressId, bound?.latitude, bound?.longitude], [point.addressId, point.latitude, point.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Люлин' }), null)

    const { latitude, longitude } = point
    const intent = { cityCode: '68134', neighborhood: receipt.neighborhood, category: receipt.category,
      coordinates: { latitude, longitude }, radiusKm: .15, browse: true, searchV2: true }
    const [result] = normalizeCatalogueBusinesses([row], intent, { now })
    assert.equal(result?.id, row.id)
    assert.deepEqual(normalizeCatalogueBusinesses([original], intent, { now }), [])
    assert.deepEqual(result.booking, { ...original.booking, verified: true,
      checkedOn: original.verification.checkedOn, validUntil: original.verification.validUntil })
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
  }
})

test('address recoveries do not attach to mismatched contacts or replace an existing coordinate', () => {
  const previous = new Map(historicRows().map(row => [row.id, row]))
  for (const [receipt, apply] of reviewed) {
    const original = previous.get(receipt.id)
    const mutations = [
      { address: original.address + 'А' },
      { cityCode: '56784' },
      { neighborhood: 'Надежда 1' },
      { phone: '+359888000000' },
      { website: 'https://example.org/' },
      { booking: { ...original.booking, ...(original.booking.kind === 'phone'
        ? { phone: '+359888000000' } : { url: 'https://example.org/' }) } },
      { coordinates: { latitude: 42.7092, longitude: 23.3076 } },
      { verification: { ...original.verification, contact: 'https://example.org/' } },
      { locationKind: 'service_area' },
    ]
    for (const value of mutations) {
      const changed = { ...original, ...value }
      assert.equal(apply([changed])[0], changed, receipt.id + ' ' + Object.keys(value).join(','))
    }
  }
  const smily = records.get('sofia-dr-smily')
  assert.equal(peripheryPriorCatalogue([smily])[0].neighborhood, null)
  assert.throws(() => peripheryPriorCatalogue([{ ...smily, address: smily.address + 'А' }]), /Unreviewed periphery row/u)
  assert.throws(() => peripheryPriorCatalogue([smily, smily]), /Duplicate periphery row/u)
})

test('six location-only bindings add six usable points, including first points in four priority cells', () => {
  const previous = historicRows()
  const reports = [previous, bind(previous)].map(rows => catalogueCoverageReport(rows, { now }))
  assert.deepEqual(reports.map(r => r.counts.approvedBusinesses), north.approvedCatalogueRecords)
  assert.deepEqual(reports.map(r => r.counts.premisesWithBoundCoordinates), [north.locatedPremises[0], north.locatedPremises[1] + 1])
  assert.equal(reviewed.filter(([receipt]) => receipt.coverage.located[0] === 0 && receipt.coverage.located[1] === 1).length, 4)
  for (const [receipt] of reviewed) {
    const cells = reports.map(report => report.neighborhoods.find(row => row.name === receipt.neighborhood)
      .cells.find(cell => cell.categoryId === receipt.category))
    assert.deepEqual(cells.map(cell => cell.count), receipt.coverage.physical)
    assert.deepEqual(cells.map(cell => cell.locatedCount), receipt.coverage.located)
    assert.ok(cells[1].locatedBusinessIds.includes(receipt.id))
  }
})
