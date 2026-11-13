import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueRecordSchema, approvedCatalogueRecord, validateCatalogue, CATALOGUE_MAX_RECORDS, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueExpansionReport } from '../scripts/catalogue-expansion-report.mjs'
import { cataloguePublicationState } from '../scripts/check-sofia-catalogue.mjs'

const now = Date.parse('2026-11-11T00:00:00Z')
const find = id => SOFIA_CATALOGUE.find(row => row.id === id)

test('audited human medical centres and hospital listings retain history but cannot be published', () => {
  assert.equal(EXCLUDED_GENERAL_CLINIC_IDS.length, 23)
  for (const id of EXCLUDED_GENERAL_CLINIC_IDS) {
    const row = find(id)
    assert.ok(row, id)
    assert.ok(catalogueRecordSchema.safeParse(row).success)
    assert.ok(row.services.length)
    assert.equal(approvedCatalogueRecord(row, now), null, id)
    assert.equal(approvedCatalogueRecord(JSON.parse(JSON.stringify(row)), now), null, id)
  }
})

test('dental, psychology, previously approved lab and veterinary entries are not blanket-excluded', () => {
  for (const id of ['sofia-medica-62', 'sofia-kirilova-dent', 'sofia-margarita-dimitrova-psychologist',
    'sofia-genica-ami-bue', 'sofia-vet-patrol', 'sofia-one-space']) {
    assert.ok(approvedCatalogueRecord(find(id), now), id)
  }
})

test('medical-aesthetic and hospital variants are excluded without a brand-wide massage or dental ban', () => {
  for (const id of ['sofia-vita-base-one', 'sofia-vita-base-two', 'sofia-kerimov-derma-aesthetic-sofia',
    'sofia-omni-iztok', 'sofia-omni-druzhba']) assert.equal(approvedCatalogueRecord(find(id), now), null, id)
  for (const id of ['sofia-omni-amaya-massage', 'sofia-medical-arts', 'sofia-sf-dent']) {
    assert.ok(approvedCatalogueRecord(find(id), now), id)
  }
})

test('offline publication checks distinguish deliberately excluded sources from expired or invalid records', () => {
  const allowed = find('sofia-medica-62'), excluded = find('sofia-park-clinic')
  const state = cataloguePublicationState([allowed, excluded], now)
  assert.equal(state.rows.length, 2)
  assert.deepEqual(state.current.map(row => row.id), [allowed.id])
  assert.deepEqual(state.excluded.map(row => row.id), [excluded.id])
  assert.deepEqual(state.recheck, [])
  const expired = { ...allowed, verification: { ...allowed.verification, checkedOn: '2026-07-01', validUntil: '2026-09-29' } }
  assert.deepEqual(cataloguePublicationState([expired], now).recheck.map(row => row.id), [allowed.id])
  assert.throws(() => cataloguePublicationState([{ ...excluded, website: 'javascript:bad' }], now))
  assert.throws(() => cataloguePublicationState([allowed, allowed], now), /Duplicate catalogue/)
})

test('the total inventory has a bounded capacity above the target without relaxing each record schema', () => {
  assert.equal(CATALOGUE_MAX_RECORDS, 20000)
  // A sparse array verifies early size rejection without constructing or
  // parsing a 20,000-business fixture.
  assert.throws(() => validateCatalogue(new Array(CATALOGUE_MAX_RECORDS + 1)), /Catalogue exceeds 20000 records/)
  assert.throws(() => validateCatalogue([{ ...find('sofia-medica-62'), services: [] }]))
  assert.equal(validateCatalogue([find('sofia-medica-62')]).length, 1)
})

test('operational reporting distinguishes added businesses from removed publication eligibility', () => {
  const fixture = find('sofia-medica-62'), clinic = find('sofia-park-clinic')
  const baseline = { version: 1, capturedOn: '2026-11-11', sourceCount: 2, records: [fixture, clinic].map(({ id, category, neighborhood }) => ({ id, category, neighborhood })) }
  // A fictional new address/quarter cannot inherit another venue's municipal
  // point binding merely because the rest of this test fixture is cloned.
  const newlyReviewed = { ...fixture, id: 'sofia-test-new-dental', name: 'Test new dental', coordinates: null, neighborhood: 'Борово' }
  const report = catalogueExpansionReport([fixture, clinic, newlyReviewed], { now, baseline })
  assert.equal(report.sourceRecords, 3)
  assert.equal(report.currentlyEligible, 2)
  assert.equal(report.comparison.addedBusinesses, 1)
  assert.deepEqual(report.comparison.addedByCategory, { other: 1 })
  assert.deepEqual(report.comparison.addedByNeighborhood, [{ neighborhood: 'Борово', businesses: 1, categories: { other: 1 }, businessTypes: { 'Стоматология': 1 } }])
  assert.deepEqual(report.comparison.removedOrNowIneligible, [{ id: clinic.id, reason: 'owner_excluded_general_human_clinic' }])
  assert.equal(report.missingNeighborhood, 1)
  assert.equal(report.comparison.additions[0].id, newlyReviewed.id)
})

test('reporting rejects wrong baselines and does not count enrichments or name changes as new businesses', () => {
  const row = find('sofia-medica-62')
  const baseline = { version: 1, sourceCount: 1, records: [{ id: row.id }] }
  assert.equal(catalogueExpansionReport([{ ...row, name: 'New public wording' }], { now, baseline }).comparison.addedBusinesses, 0)
  assert.throws(() => catalogueExpansionReport([row], { now, baseline: [] }), /Invalid operational/)
  assert.throws(() => catalogueExpansionReport([row], { now, baseline: { version: 1, sourceCount: 2, records: [{ id: row.id }, { id: row.id }] } }), /Invalid operational/)
})
