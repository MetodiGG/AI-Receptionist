import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { auditServicePhotoCoverage } from '../scripts/audit-service-photo-coverage.mjs'

const now = Date.parse('2026-11-11T00:00:00Z')
const price = (amount, patch = {}) => ({ amount, currency: 'EUR', kind: 'fixed', sourceUrl: 'https://example.com/prices', checkedOn: '2026-11-10', ...patch })
const service = (name, category, publishedPrice) => ({ name, category, appointmentModel: 'appointment', ...(publishedPrice && { price: publishedPrice }) })
function listing(id, services, verification = {}) {
  const row = structuredClone(SOFIA_CATALOGUE.find(item => item.category === 'nails'))
  return { ...row, id: `sofia-coverage-${id}`, services,
    verification: { ...row.verification, status: 'approved', checkedOn: '2026-11-10', validUntil: '2027-02-01', ...verification } }
}

test('audits only approved catalogue services and counts source-bearing photo results, not fallback art', () => {
  const services = [service('Маникюр с гел лак', 'nails', price(22)), service('Педикюр с гел лак', 'nails', price(28)),
    service('Безплатен оглед', 'other', price(0)), service('Оформяне на брада', 'barber', price(15, { checkedOn: '2026-07-01' })),
    service('Модел за прическа', 'hair', price(0, { kind: 'range', maximum: 18 })), service('Дамско подстригване', 'hair')]
  const business = listing('active', services)
  const draft = listing('draft', services, { status: 'draft' })
  const expired = listing('expired', services, { checkedOn: '2026-09-01', validUntil: '2026-11-10' })
  const seen = []
  const result = auditServicePhotoCoverage([business, draft, expired, { ...business, services: [] }], { now, resolveThumbnail(item, options) {
    seen.push([item.name, options.business.id])
    return ({ 'Маникюр с гел лак': { kind: 'photo', src: '/service-photos/manicure.webp' },
      'Безплатен оглед': { kind: 'business', src: '/businesses/fixture/inspection.webp' },
      'Модел за прическа': { kind: 'haircut', type: 'photo', src: '/businesses/fixture/hair.webp' },
      'Оформяне на брада': { kind: 'photo', src: null },
      'Дамско подстригване': { type: 'illustration', src: '/category-art/hair-v1.webp' },
    })[item.name] || { type: 'icon' }
  } })
  assert.deepEqual(seen, services.map(item => [item.name, business.id]))
  assert.equal(result.approvedBusinesses, 1)
  assert.deepEqual(result.totals, { services: { total: 6, photo: 3, missing: 3 }, priceBearing: { total: 4, photo: 3, missing: 1 }, paid: { total: 3, photo: 2, missing: 1 } })
  assert.equal(result.complete, false)
  assert.equal(result.categories[0].category, 'nails')
  assert.deepEqual(result.categories[0].missing.map(item => item.name), ['Педикюр с гел лак'])
  assert.equal(result.categories.find(group => group.category === 'barber').priceBearing.total, 0)
})

test('priorities group the exact service wording by service category and rank paid gaps first', () => {
  const paid = service('Педикюр с гел лак', 'nails', price(25))
  const unpriced = service('Педикюр с гел лак', 'nails')
  const free = service('Друг вид педикюр', 'nails', price(0))
  const paidListing = listing('z-paid', [paid])
  const unpricedListing = listing('a-unpriced', [free, unpriced])
  const options = { now, resolveThumbnail: () => ({ kind: 'icon' }) }
  const first = auditServicePhotoCoverage([unpricedListing, paidListing], options)
  assert.deepEqual(first, auditServicePhotoCoverage([paidListing, unpricedListing], options))
  assert.deepEqual(first.categories.map(group => group.category), ['nails'])
  assert.deepEqual(first.categories[0].missing.map(item => item.name), [paid.name, free.name])
  assert.deepEqual(first.categories[0].missing[0].listings.map(row => row.businessId), [paidListing.id, unpricedListing.id])
  const covered = auditServicePhotoCoverage([paidListing], { now, resolveThumbnail: () => ({ kind: 'photo', src: '/service-photos/pedicure.webp' }) })
  assert.equal(covered.complete, true)
  assert.deepEqual(covered.categories[0].missing, [])
})

test('CLI writes JSON and fails coverage only when explicitly required', () => {
  const script = fileURLToPath(new URL('../scripts/audit-service-photo-coverage.mjs', import.meta.url))
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
  const inventory = run('--as-of=2026-11-11')
  assert.equal(inventory.status, 0, inventory.stderr)
  const report = JSON.parse(inventory.stdout)
  assert.ok(report.totals.services.total > 0)
  assert.ok(report.totals.priceBearing.total >= report.totals.paid.total)
  const gate = run('--as-of=2026-11-11', '--require-complete')
  assert.equal(gate.status, report.complete ? 0 : 1, gate.stderr)
  assert.deepEqual(JSON.parse(gate.stdout), report)

  const empty = run('--as-of=2000-01-01')
  assert.equal(empty.status, 0, empty.stderr)
  assert.equal(JSON.parse(empty.stdout).complete, false)
  const emptyGate = run('--as-of=2000-01-01', '--require-complete')
  assert.equal(emptyGate.status, 1, emptyGate.stderr)
  assert.equal(JSON.parse(emptyGate.stdout).approvedBusinesses, 0)
})
