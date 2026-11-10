import test from 'node:test'
import assert from 'node:assert/strict'
import updates from '../lib/discovery/catalogue-data/pricing-20261110.json' with { type: 'json' }
import report from '../docs/catalogue-pricing/audit-20261110.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { enrichCataloguePricing } from '../lib/discovery/catalogue-pricing-enrichment.mjs'
import { catalogueBusinessDetails, detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'

test('pricing audit evaluates every catalogue record and every registered profile', () => {
  assert.equal(report.businesses.length, 599)
  assert.equal(new Set(report.businesses.map(row => row.id)).size, 599)
  for (const row of SOFIA_CATALOGUE) assert.ok(report.businesses.some(item => item.id === row.id))
  assert.equal(report.businesses.filter(row => row.ownerManaged).length, 4)
  assert.ok(report.businesses.every(row => Array.isArray(row.issues) && Array.isArray(row.checkedUrls)))
  assert.equal(report.summary.liveDatabaseWrites, 0)
})

test('reviewed pricing merges into the same IDs without duplicate named services or changed identity', () => {
  for (const update of updates) {
    const row = SOFIA_CATALOGUE.find(item => item.id === update.id)
    assert.ok(row, update.id)
    assert.equal(new Set(row.services.map(service => normalizeSearchText(service.name))).size, row.services.length, row.id)
    for (const service of update.services) {
      const stored = row.services.find(item => normalizeSearchText(item.name) === normalizeSearchText(service.name))
      assert.deepEqual(stored.price, service.price)
      assert.equal(service.price.checkedOn, '2026-11-10')
      assert.equal(new URL(service.price.sourceUrl).hostname.replace(/^www\./u, ''), new URL(row.website).hostname.replace(/^www\./u, ''))
    }
  }
})

test('the importer cannot touch owner-managed records, unknown IDs or duplicate updates', () => {
  const row = structuredClone(SOFIA_CATALOGUE[0]), service = structuredClone(updates[0].services[0])
  assert.throws(() => enrichCataloguePricing([{ ...row, ownerManaged: true }], [{ id: row.id, services: [service] }]))
  assert.throws(() => enrichCataloguePricing([{ ...row, source: 'gorez' }], [{ id: row.id, services: [service] }]))
  assert.throws(() => enrichCataloguePricing([row], [{ id: 'sofia-nonexistent', services: [service] }]))
  assert.throws(() => enrichCataloguePricing([row], [{ id: row.id, services: [service, service] }]))
  const enriched = enrichCataloguePricing([row], [{ id: row.id, services: [service] }])[0]
  for (const key of ['address', 'category', 'coordinates', 'booking', 'verification', 'website', 'name']) assert.deepEqual(enriched[key], row[key])
  assert.equal(enriched.services[0].name, row.services[0].name)
})

test('ranges, starting prices, units and long menus survive through public details', () => {
  const now = Date.parse('2026-11-10T12:00:00Z')
  const iq = catalogueBusinessDetails(SOFIA_CATALOGUE.find(row => row.id === 'sofia-iq-detailing'), now)
  const ppf = iq.services.find(service => service.name === 'PPF – предна част')
  assert.equal(ppf.price, 800)
  assert.equal(ppf.priceMaximum, 1400)
  assert.match(detailPriceLabel(ppf), /800.*1[\s\u00a0\u202f]?400/u)
  const rs = catalogueBusinessDetails(SOFIA_CATALOGUE.find(row => row.id === 'sofia-autocomplex-rs'), now)
  assert.ok(rs.services.length > 150)
  assert.equal(rs.services.find(service => service.name === 'Зареждане с фреон R134a').priceUnit, '100 г')
  const wash = catalogueBusinessDetails(SOFIA_CATALOGUE.find(row => row.id === 'sofia-zona-wash'), now)
  assert.equal(wash.services.find(service => service.name === 'пране на килими').priceUnit, 'кв.м.')
  const betyna = catalogueBusinessDetails(SOFIA_CATALOGUE.find(row => row.id === 'sofia-beauty-betyna-yovcheva'), now)
  assert.equal(betyna.services.find(service => service.name === 'Масаж на ходила').priceKind, 'from')
})

test('prices expire independently without concealing the service or fabricating a new price', () => {
  const row = SOFIA_CATALOGUE.find(item => item.id === 'sofia-beauty-betyna-yovcheva')
  const fresh = catalogueBusinessDetails(row, Date.parse('2026-11-10T10:00:00Z'))
  const expired = catalogueBusinessDetails(row, Date.parse('2027-03-01T10:00:00Z'))
  assert.ok(fresh.services.some(service => service.price != null))
  assert.equal(expired.services.length, fresh.services.length)
  assert.ok(expired.services.every(service => service.price == null))
})
