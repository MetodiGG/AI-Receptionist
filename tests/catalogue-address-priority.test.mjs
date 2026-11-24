import assert from 'node:assert/strict'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { addressPriorityQueue } from '../scripts/catalogue-address-priority.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const seed = SOFIA_CATALOGUE.find(row => row.id === 'sofia-mokro-nosle')
const now = Date.parse('2026-11-16T00:00:00Z')
const row = (id, patch) => ({ ...seed, id: 'sofia-verified-queue-' + id, coordinates: null, neighborhood: 'Борово', ...patch })

test('an unbound cell stays below the verified target even when the raw quota is met', () => {
  const assigned = row('exists')
  const another = row('has-point', { coordinates: {
    latitude: 42.67, longitude: 23.29, method: 'first_party_coordinates',
    source: seed.website, sourceAddress: seed.address,
  } })
  const report = catalogueCoverageReport([assigned, another], { now, target: 2, neighborhoods: ['Борово'] })
  assert.equal(report.counts.cellsAtTarget, 1)
  assert.equal(report.counts.cellsAtLocatedTarget, 0)
  const [cell] = addressPriorityQueue(report, { category: 'pets' })
  assert.deepEqual([cell.premises, cell.verifiedAddresses, cell.verifiedGap, cell.minimumNewPremises], [2, 1, 1, 0])
  assert.deepEqual(cell.addressReviewIds, [assigned.id])
  assert.equal(addressPriorityQueue(catalogueCoverageReport([another], { now, target: 1, neighborhoods: ['Борово'] }),
    { category: 'pets' }).length, 0)
})

test('empty verified cells with a real existing candidate come first; mobile and broad records never populate child cells', () => {
  const review = row('review')
  const mobile = row('mobile', { locationKind: 'service_area', address: null, neighborhood: 'Младост 2' })
  const broad = row('broad', { neighborhood: 'Младост' })
  const fixture = [review, mobile, broad]
  const report = catalogueCoverageReport(fixture, { now, target: 30, neighborhoods: ['Борово', 'Младост 1', 'Младост 2'] })
  const queue = addressPriorityQueue(report)
  assert.equal(queue[0].neighborhood, 'Борово')
  assert.equal(queue[0].categoryId, 'pets')
  assert.deepEqual(queue[0].addressReviewIds, [review.id])
  assert.equal(queue[0].minimumNewPremises, 29)
  assert.ok(queue.every(cell => cell.verifiedAddresses === 0))
  assert.ok(queue.every(cell => !cell.addressReviewIds.includes(mobile.id) && !cell.addressReviewIds.includes(broad.id)))
  assert.equal(addressPriorityQueue(report, { neighborhood: 'ж.к. Младост 1', category: 'pets' })[0].minimumNewPremises, 30)
  assert.throws(() => addressPriorityQueue(report, { neighborhood: 'Младост', category: 'pets' }), /Unknown coverage neighborhood/u)
  assert.throws(() => addressPriorityQueue(report, { category: 'inexistent' }), /Unknown discovery category/u)
})

test('the actual queue matches all current exact-location deficits, including observed additional areas', () => {
  const report = catalogueCoverageReport(undefined, { now: Date.parse('2026-11-23T00:00:00Z') })
  const queue = addressPriorityQueue(report)
  assert.equal(queue.length, report.counts.totalTargetCells - report.counts.cellsAtLocatedTarget)
  assert.ok(queue.some(cell => cell.scope === 'observed_additional_named_area'))
  assert.ok(queue.every((cell, i) => cell.rank === i + 1 && cell.verifiedGap > 0))
  assert.ok(queue.slice(1).every((cell, i) => cell.verifiedAddresses >= queue[i].verifiedAddresses))
})
