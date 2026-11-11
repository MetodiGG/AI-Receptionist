import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { CATALOGUE_TARGET, catalogueCoverage, auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
const now = Date.parse('2026-11-11T12:00:00Z')
const candidate = patch => ({ ...structuredClone(SOFIA_CATALOGUE.find(row => row.id === 'sofia-underground-barbershop')), id: 'sofia-qa-intake-fixture', address: 'София, ул. Примерна 999', ...patch })

test('coverage reports actual distinct approved inventory and the explicitly unmet ten-thousand goal', () => {
  assert.deepEqual(CATALOGUE_TARGET, { minimum: 10000, preferred: 10000 })
  const report = catalogueCoverage(SOFIA_CATALOGUE, now)
  const eligible = SOFIA_CATALOGUE.filter(row => approvedCatalogueRecord(row, now)).length
  assert.equal(report.approvedRecords, eligible)
  assert.equal(report.targetReached, false); assert.equal(report.remainingToMinimum, CATALOGUE_TARGET.minimum - eligible)
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

test('quarter and floor suffixes cannot disguise an existing Music Box venue as a new business', () => {
  for (const [id, address] of [
    ['sofia-music-box-sinanishko', 'София, кв. Манастирски ливади, ул. Синанишко езеро 9А'],
    ['sofia-music-box-mladost', 'София, кв. Младост 3, бул. Александър Малинов 51, Метро Сити Център, ет. -1'],
  ]) {
    const existing = SOFIA_CATALOGUE.find(row => row.id === id)
    const duplicate = { ...structuredClone(existing), id: `${id}-duplicate-test`, address }
    assert.deepEqual(auditCatalogueBatch([existing], [duplicate], now).rejected,
      [{ id: duplicate.id, reason: 'duplicate_identity' }])
  }
  assert.equal(SOFIA_CATALOGUE.filter(row => new URL(row.website).hostname.replace(/^www\./, '') === 'music-box.bg').length, 2)
  assert.ok(!SOFIA_CATALOGUE.some(row => ['sofia-music-box-manastirski-livadi', 'sofia-music-box-mladost3'].includes(row.id)))
})

test('shared owner phones do not merge genuine branches or unrelated co-located businesses', () => {
  const branches = SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-eleazar-'))
  assert.equal(branches.length, 6)
  assert.equal(auditCatalogueBatch([], branches, now).readyForReview.length, 6)
  const first = candidate(), other = candidate({ id: 'sofia-other-owner-fixture', website: 'https://another-owner.example.org/',
    phone: '+359888111222', booking: { kind: 'phone', phone: '+359888111222' },
    verification: { ...candidate().verification, booking: { url: 'https://another-owner.example.org/', excerpt: 'Test-only explicit phone appointment invitation' } } })
  assert.equal(auditCatalogueBatch([], [first, other], now).readyForReview.length, 2)
  const block = candidate({ address: 'София, ж.к. Младост 1, бл. 38' })
  const otherQuarter = { ...block, id: 'sofia-other-quarter-fixture', address: 'София, ж.к. Люлин 1, бл. 38' }
  assert.equal(auditCatalogueBatch([], [block, otherQuarter], now).readyForReview.length, 2)
})

test('intake script is an offline read-only audit, never a crawler or production writer', async () => {
  const source = await readFile(new URL('../scripts/audit-catalogue-batch.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\(|writeFile|exec\(|SUPABASE|GOOGLE_API_KEY/)
  assert.match(source, /readFile\(values.input/); assert.match(source, /catalogueCoverage/)
})
