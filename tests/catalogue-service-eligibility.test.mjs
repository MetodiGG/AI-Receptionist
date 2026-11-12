import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { NONBOOKABLE_CATALOGUE_ITEMS, eligibleCatalogueServiceRow } from '../lib/discovery/catalogue-service-eligibility.mjs'
import { catalogueBusinessDetails } from '../lib/discovery/business-details.mjs'
const now = Date.parse('2026-11-12T00:00:00Z')

test('only the eight source-confirmed nonbookable rows are hidden, with raw facts/history retained', () => {
  assert.equal(NONBOOKABLE_CATALOGUE_ITEMS.length, 8)
  const raw = SOFIA_CATALOGUE.find(row => row.id === 'sofia-sf-dent'), before = JSON.stringify(raw)
  const published = approvedCatalogueRecord(raw, now)
  assert.equal(raw.services.length - published.services.length, 8)
  for (const item of NONBOOKABLE_CATALOGUE_ITEMS) {
    assert.equal(item.sourceUrl, 'https://sfdent.eu/pricing'); assert.equal(item.checkedOn, '2026-11-12')
    assert.ok(raw.services.some(service => service.category === item.category && service.name === item.name), 'review must identify an actual retained source row')
    assert.ok(!published.services.some(service => service.category === item.category && service.name === item.name))
  }
  for (const service of published.services) assert.equal(service, raw.services.find(original => original.name === service.name && original.category === service.category), 'kept prices/source metadata are unchanged')
  assert.equal(JSON.stringify(raw), before)
  assert.equal(approvedCatalogueRecord(published, now), published, 'projected immutable rows remain validated and idempotent')
  assert.ok(Object.isFrozen(published)); assert.ok(Object.isFrozen(published.services))
  assert.equal(catalogueBusinessDetails(published, now).services.length, published.services.length)
})

test('fee/product eligibility cannot remove a real procedure, or a similarly named service at another business', () => {
  const raw = SOFIA_CATALOGUE.find(row => row.id === 'sofia-sf-dent'), published = approvedCatalogueRecord(raw, now)
  for (const name of ['Преглед', 'Костна аугментация', 'Циментиране с капсула GC', 'Поставяне на мембрана']) assert.ok(published.services.some(service => service.name === name), name)
  const other = { ...raw, id: 'sofia-different-business' }
  assert.equal(eligibleCatalogueServiceRow(other), other)
  const labelledDifferently = { ...raw, services: [{ ...raw.services[0], name: 'Преглед и допълнителна консултация', category: 'other' }] }
  assert.equal(eligibleCatalogueServiceRow(labelledDifferently), labelledDifferently)
  assert.equal(eligibleCatalogueServiceRow({ ...raw, services: [raw.services.find(service => service.name === NONBOOKABLE_CATALOGUE_ITEMS[0].name)] }), null, 'a business without bookable services cannot expose product-only rows')
})
