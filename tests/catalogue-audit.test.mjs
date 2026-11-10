import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { CATALOGUE_TARGET, catalogueCoverage, auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
const now = Date.parse('2026-11-10T12:00:00Z')
const candidate = patch => ({ ...structuredClone(SOFIA_CATALOGUE.find(row => row.id === 'sofia-underground-barbershop')), id: 'sofia-qa-intake-fixture', address: 'София, ул. Примерна 999', ...patch })

test('coverage reports actual distinct approved inventory and an explicitly unmet 1500–2000 goal', () => {
  assert.deepEqual(CATALOGUE_TARGET, { minimum: 1500, preferred: 2000 })
  const report = catalogueCoverage(SOFIA_CATALOGUE, now)
  assert.equal(report.approvedRecords, SOFIA_CATALOGUE.length)
  assert.equal(report.targetReached, false); assert.equal(report.remainingToMinimum, 1500 - SOFIA_CATALOGUE.length)
  assert.equal(report.categories.length, 14); assert.ok(report.categories.every(row => row.offeringService > 0))
  assert.equal(report.located + report.unlocated + report.serviceAreas, report.approvedRecords)
  const expired = candidate(); expired.verification.validUntil = '2026-11-05'
  assert.equal(catalogueCoverage([expired], now).approvedRecords, 0)
})

test('batch intake catches both owner-address and phone-address duplicates, including repeated candidates', () => {
  const row = candidate(), first = auditCatalogueBatch(SOFIA_CATALOGUE, [row, { ...row, id: 'sofia-another-fixture' }], now)
  assert.deepEqual(first.readyForReview, [row.id]); assert.equal(first.rejected[0].reason, 'duplicate_identity')
  const existing = SOFIA_CATALOGUE[0]
  const duplicate = { ...structuredClone(existing), id: 'sofia-duplicate-fixture', phone: '+359888111222', booking: { kind: 'phone', phone: '+359888111222' } }
  assert.equal(auditCatalogueBatch(SOFIA_CATALOGUE, [duplicate], now).rejected[0].reason, 'duplicate_identity')
})

test('drafts, unsupported claims, wrong cities and third-party-only evidence never become an automatic import', () => {
  const draft = candidate(); draft.verification.status = 'draft'
  const thirdParty = candidate({ id: 'sofia-third-party-fixture' }); thirdParty.verification.booking.url = 'https://directory.example.org/business'
  const report = auditCatalogueBatch([], [draft, thirdParty, candidate({ cityCode: '56784' }), { id: 'sofia-unsupported', name: 'No appointment proof' }], now)
  assert.equal(report.readyForReview.length, 0); assert.equal(report.pending.length, 2); assert.equal(report.rejected.length, 2)
  assert.match(report.notice, /Nothing is published automatically/)
  assert.throws(() => auditCatalogueBatch([], { businesses: [] }, now))
})

test('intake script is an offline read-only audit, never a crawler or production writer', async () => {
  const source = await readFile(new URL('../scripts/audit-catalogue-batch.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|writeFile|exec\(|SUPABASE|GOOGLE_API_KEY/)
  assert.match(source, /readFile\(values.input/); assert.match(source, /catalogueCoverage/)
})
