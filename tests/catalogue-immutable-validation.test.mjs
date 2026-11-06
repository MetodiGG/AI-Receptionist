import test from 'node:test'
import assert from 'node:assert/strict'
import { validateCatalogue, approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const now = Date.parse('2026-11-06T12:00:00Z')
test('validated static records can be reused without reparsing, but nested data cannot change', () => {
  const row = SOFIA_CATALOGUE.find(item => item.id === 'sofia-narra-beauty')
  assert.equal(approvedCatalogueRecord(row, now), row)
  for (const value of [row, row.services, row.services[0], row.services[0].price, row.booking, row.verification, row.verification.booking]) assert.ok(Object.isFrozen(value))
  assert.throws(() => { row.services[0].price.amount = 0 }, TypeError)
  assert.throws(() => { row.booking.phone = '+359888000000' }, TypeError)
  assert.throws(() => { row.services.push({ name: 'Invented' }) }, TypeError)
})

test('cached structural validation never caches approval dates or revives draft/rejected records', () => {
  const raw = structuredClone(SOFIA_CATALOGUE[0])
  for (const status of ['draft', 'rejected']) {
    const [row] = validateCatalogue([{ ...raw, verification: { ...raw.verification, status } }])
    assert.equal(approvedCatalogueRecord(row, now), null)
  }
  const [row] = validateCatalogue([raw])
  assert.equal(approvedCatalogueRecord(row, now), row)
  assert.equal(approvedCatalogueRecord(row, Date.parse('2027-03-01T12:00:00Z')), null)
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-11-01T12:00:00Z')), null)
})

test('external mutable/frozen copies must still pass the full strict schema', () => {
  const raw = structuredClone(SOFIA_CATALOGUE[0])
  const mutable = approvedCatalogueRecord(raw, now)
  assert.notEqual(mutable, raw)
  raw.booking = { kind: 'form', url: 'javascript:alert(1)' }
  assert.equal(approvedCatalogueRecord(raw, now), null)
  const frozenRoot = Object.freeze({ ...structuredClone(SOFIA_CATALOGUE[0]), rating: 5 })
  assert.equal(approvedCatalogueRecord(frozenRoot, now), null)
  const shallow = Object.freeze(structuredClone(SOFIA_CATALOGUE[0]))
  shallow.services[0].appointmentModel = 'walk_in_lab'
  assert.equal(approvedCatalogueRecord(shallow, now), null)
})
