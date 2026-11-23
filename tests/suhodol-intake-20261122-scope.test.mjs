import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE as currentCatalogue, RAW_SOFIA_CATALOGUE as currentRawCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE as currentPublicCatalogue } from '../lib/discovery/public-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { SUHODOL_INTAKE_BASE, SUHODOL_INTAKE_HASHES, SUHODOL_INTAKE_NEW_HASHES, SUHODOL_INTAKE_ROW_HASHES,
  suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { quarterRecoveryAllowsNewFile, quarterRecoveryPriorSource, quarterRecoveryPriorCatalogue } from './quarter-recovery-20261123-scope.mjs'

// Validate the historical receipts at this exact intake stage.
const SOFIA_CATALOGUE = quarterRecoveryPriorCatalogue(currentCatalogue)
const RAW_SOFIA_CATALOGUE = quarterRecoveryPriorCatalogue(currentRawCatalogue)
const PUBLIC_CATALOGUE = quarterRecoveryPriorCatalogue(currentPublicCatalogue)
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const readCurrent = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const read = path => readCurrent(path).then(source => quarterRecoveryPriorSource(path, source))
const before = path => git('show', SUHODOL_INTAKE_BASE + ':' + path)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const rowHash = row => sha256(JSON.stringify(row))
const id = 'sofia-maria-kamenova-suhodol-shtit9'
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', SUHODOL_INTAKE_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const olderScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit', 'regional-catalogue-20261122', 'azis-style-catalogue-20261122', 'priority30-catalogue-report', 'location-recovery-20261122', 'nearby-points-20261122'].map(name => `tests/${name}-scope.mjs`)

test('one intake authorizes exactly four source integrations and five dated runtime/evidence files, not UI or weakened gates', async () => {
  assert.equal(SUHODOL_INTAKE_BASE, '69a9f91780d47874bcdb614c957c78e3c4ce94be')
  assert.deepEqual(Object.keys(SUHODOL_INTAKE_HASHES).sort(), [
    'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
    'lib/catalogue-service-photo-keys.mjs', 'lib/locale/service-english.json',
  ].sort())
  assert.deepEqual(Object.keys(SUHODOL_INTAKE_NEW_HASHES).sort(), [
    'lib/discovery/catalogue-data/neighborhood-suhodol-20261122.mjs',
    'lib/catalogue-service-photo-associations-suhodol-20261122.mjs',
    'docs/catalogue-coverage/suhodol-intake-20261122.json', 'docs/catalogue-coverage/suhodol-intake-20261122.md',
    'docs/catalogue-coverage/research-priority30-003-20261122.json',
  ].sort())
  for (const [path, hash] of Object.entries({ ...SUHODOL_INTAKE_HASHES, ...SUHODOL_INTAKE_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path)
    assert.equal(suhodolIntakeAllowsFileChange(path) || suhodolIntakeAllowsNewFile(path), true, path)
  }
  for (const path of ['AGENTS.md', 'lib/discovery/catalogue-search.mjs', 'lib/discovery/catalogue-policy.mjs',
    'scripts/check-sofia-catalogue.mjs', 'scripts/catalogue-manual-intake-review.mjs', 'components/discovery-business-card.js',
    'lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json', 'package.json', 'pnpm-lock.yaml']) {
    assert.equal(suhodolIntakeAllowsFileChange(path), false)
    assert.equal(suhodolIntakeAllowsNewFile(path), false)
  }
})

test('all other checked-in runtime, old receipts, source photos and thirteen historical scope maps remain byte-identical', async () => {
  const frozen = tree.filter(record => !suhodolIntakeAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path) && !quarterRecoveryAllowsNewFile(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(SUHODOL_INTAKE_NEW_HASHES)].sort())
  for (const path of olderScopes) assert.equal(await read(path), before(path), path)
})

test('the Suhodol literal inverse restores all four complete prior sources and refuses any additional source change', async () => {
  for (const path of Object.keys(SUHODOL_INTAKE_HASHES)) {
    const source = await readCurrent(path), previous = before(path)
    assert.equal(suhodolIntakePriorSource(path, source), previous, path)
    assert.equal(suhodolIntakePriorSource(path, await read(path)), previous, path)
    assert.equal(suhodolIntakePriorSource(path, previous), previous, path)
    assert.throws(() => suhodolIntakePriorSource(path, source + '\n'), /Unreviewed (?:Suhodol intake|23 Nov (?:quarter recovery|intake|auto-area)) source delta/u)
  }
  assert.equal(suhodolIntakePriorSource('unrelated-file', 'untouched'), 'untouched')
})

test('only one exact new row is removed for historical cohorts; all 1732 prior rows and old price identities stay intact', () => {
  assert.deepEqual(Object.keys(SUHODOL_INTAKE_ROW_HASHES), [id])
  assert.equal(SOFIA_CATALOGUE.length, 1733); assert.equal(RAW_SOFIA_CATALOGUE.length, 1733)
  assert.equal(PUBLIC_CATALOGUE.length, 1738)
  const current = SOFIA_CATALOGUE.find(row => row.id === id), previous = suhodolIntakePriorCatalogue(SOFIA_CATALOGUE)
  assert.equal(rowHash(current), SUHODOL_INTAKE_ROW_HASHES[id])
  assert.equal(previous.length, 1732)
  assert.equal(rowHash(previous), '5ced3388155ea435c66bbc90b8946a18eba2d55785a81de2c3d45472d28c89c3')
  assert.equal(rowHash(suhodolIntakePriorCatalogue(RAW_SOFIA_CATALOGUE)), rowHash(previous))
  assert.deepEqual(previous.map(pricingIdentity), SOFIA_CATALOGUE.filter(row => row.id !== id).map(pricingIdentity))
  assert.ok(previous.every(row => SOFIA_CATALOGUE.includes(row)))
  assert.deepEqual(suhodolIntakePriorCatalogue(previous), previous)
  assert.equal(suhodolIntakePriorCatalogue(PUBLIC_CATALOGUE).length, 1737)
  for (const patch of [{ phone: '+359888000000' }, { services: [] }, { name: current.name + ' changed' },
    { coordinates: { ...current.coordinates, latitude: 42.7 } }]) {
    assert.throws(() => suhodolIntakePriorCatalogue([{ ...current, ...patch }]), /Unreviewed Suhodol intake record delta/u)
  }
  assert.throws(() => suhodolIntakePriorCatalogue([current, current]), /Duplicate Suhodol intake record/u)
  assert.equal(BOOKING_PRICE_REVIEWS.filter(review => review.id === id).length, 1)
})

test('English adds exactly two in-person descriptions and one manual supplement without rewriting old audit provenance', async () => {
  const path = 'lib/locale/service-english.json'
  const current = JSON.parse(await read(path)), previous = JSON.parse(before(path))
  const descriptions = SOFIA_CATALOGUE.find(row => row.id === id).services.map(service => service.description)
  assert.deepEqual(Object.keys(current.descriptions).filter(key => !Object.hasOwn(previous.descriptions, key)).sort(), descriptions.sort())
  assert.deepEqual(Object.fromEntries(Object.entries(current.descriptions).filter(([key]) => Object.hasOwn(previous.descriptions, key))), previous.descriptions)
  assert.deepEqual(current.names, previous.names); assert.deepEqual(current.contextual, previous.contextual); assert.deepEqual(current.units, previous.units)
  const supplements = current.metadata.manualRevalidations
  assert.equal(supplements.length, previous.metadata.manualRevalidations.length + 1)
  assert.deepEqual(supplements.slice(0, -1), previous.metadata.manualRevalidations)
  assert.equal(supplements.at(-1).businessId, id)
  assert.deepEqual(supplements.at(-1).entriesAdded, { names: 0, descriptions: 2, units: 0 })
  assert.equal(supplements.at(-1).certifiedHumanTranslation, false)
  assert.deepEqual({ ...current.metadata, manualRevalidations: previous.metadata.manualRevalidations }, previous.metadata)
})

test('the priority30 ledger matches measured eligibility, postal-point and one-cell effects without claiming the quota is met', async () => {
  const now = Date.parse('2026-11-22T12:00:00Z')
  const ledger = JSON.parse(await read('docs/catalogue-coverage/suhodol-intake-20261122.json'))
  const old = catalogueCoverageReport(suhodolIntakePriorCatalogue(SOFIA_CATALOGUE), { now, target: 30 })
  const current = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: 30 })
  for (const [name, report] of [['before', old], ['after', current]]) for (const [key, value] of Object.entries(ledger[name])) assert.equal(report.counts[key], value, name + ' ' + key)
  assert.equal(ledger.newBusinessesAdded, 1); assert.equal(ledger.newServices, 2); assert.equal(ledger.existingBusinessesChanged, 0)
  assert.equal(ledger.status, 'prepared_local_not_published'); assert.equal(ledger.cellsAtTarget, 0)
  for (const entry of ledger.cells) {
    const select = report => [...report.neighborhoods, ...report.additionalNamedAreas].find(area => area.name === entry.neighborhood).cells.find(cell => cell.categoryId === entry.category)
    assert.deepEqual([select(old).count, select(current).count], entry.physical)
    assert.deepEqual([select(old).locatedCount, select(current).locatedCount], entry.located)
    assert.equal(entry.target, 30); assert.equal(select(current).gap, 28)
  }
  assert.equal(ledger.municipalSource.sourceUnchanged, true)
  assert.equal(ledger.municipalSource.candidateCount, 1)
  assert.equal(ledger.municipalSource.sourceSha256, '0cd8c9d19996c0654707f711cb8d559a23e0a95148d4b8c6016aad76de2140ef')
  assert.equal(ledger.safeguards.productionWrites, 0)
  const research = JSON.parse(await read('docs/catalogue-coverage/research-priority30-003-20261122.json'))
  assert.deepEqual(research.admittedByThisBatch, [id])
  assert.equal(research.holds.length, 3)
})

test('the data-only integration keeps release gates and new real-row tests intact and adds no runtime provider requests', async () => {
  const source = await read('lib/discovery/catalogue-data/neighborhood-suhodol-20261122.mjs')
  assert.doesNotMatch(source, /node:crypto|createHash|readFile|writeFile|\bfetch\s*\(|getSupabase|\.from\s*\(|sendEmail|sendNotification|createPublicBooking/u)
  assert.doesNotMatch(source, /import .*address_sofia\.csv/u)
  assert.doesNotMatch(await read('tests/catalogue-suhodol-20261122.test.mjs'), /suhodolIntakePriorSource|suhodolIntakePriorCatalogue/u)
  for (const path of ['scripts/check-sofia-catalogue.mjs', 'scripts/catalogue-manual-intake-review.mjs',
    'scripts/check-catalogue-pricing.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/check-public-english.mjs',
    'package.json', 'pnpm-lock.yaml']) assert.equal(await read(path), before(path), path)
})
