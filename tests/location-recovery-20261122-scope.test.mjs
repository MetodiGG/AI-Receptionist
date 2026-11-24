import { pr81LocationPriorSource, pr81LocationAllowsFileChange, pr81LocationAllowsNewFile } from "./pr81-location-only-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE as currentCatalogue, RAW_SOFIA_CATALOGUE as currentRawCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE as currentPublicCatalogue } from '../lib/discovery/public-catalogue.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { LOCATION_RECOVERY_BASE, LOCATION_RECOVERY_HASHES, LOCATION_RECOVERY_NEW_HASHES, LOCATION_RECOVERY_ROW_HASHES,
  locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource,
  locationRecoveryPriorRecord, locationRecoveryPriorCatalogue } from './location-recovery-20261122-scope.mjs'

// Replay this dated checkpoint; the separate nearby-point feature tests
// exercise the actual current rows without either historical inverse.
const SOFIA_CATALOGUE = nearbyPointsPriorCatalogue(suhodolIntakePriorCatalogue(currentCatalogue))
const RAW_SOFIA_CATALOGUE = nearbyPointsPriorCatalogue(suhodolIntakePriorCatalogue(currentRawCatalogue))
const PUBLIC_CATALOGUE = suhodolIntakePriorCatalogue(currentPublicCatalogue)
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, pr81LocationPriorSource(path, source))))
const before = path => git('show', LOCATION_RECOVERY_BASE + ':' + path)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const rowHash = value => sha256(JSON.stringify(value))
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', LOCATION_RECOVERY_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const historicalScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit', 'regional-catalogue-20261122', 'azis-style-catalogue-20261122', 'priority30-catalogue-report'].map(name => `tests/${name}-scope.mjs`)

test('the location recovery stage allows one exact catalogue integration and six new reviewed modules/evidence outputs, never old maps or source receipts', async () => {
  assert.equal(LOCATION_RECOVERY_BASE, 'a44faaa77bdda3f129ca48f36385393761b58e31')
  assert.deepEqual(Object.keys(LOCATION_RECOVERY_HASHES), ['lib/discovery/sofia-catalogue.mjs'])
  assert.deepEqual(Object.keys(LOCATION_RECOVERY_NEW_HASHES).sort(), [
    'lib/discovery/catalogue-data/neighborhood-recovery-20261122.mjs', 'lib/discovery/catalogue-data/address-points-recovery-20261122.mjs',
    'docs/catalogue-coverage/quarter-recovery-20261122.json', 'docs/catalogue-coverage/address-points-review-20261122.json',
    'docs/catalogue-coverage/location-recovery-batch-20261122.json', 'docs/catalogue-coverage/location-recovery-batch-20261122.md',
  ].sort())
  for (const [path, hash] of Object.entries({ ...LOCATION_RECOVERY_HASHES, ...LOCATION_RECOVERY_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path + ': a later change needs its own explicit review')
    assert.equal(suhodolIntakeAllowsFileChange(path) || nearbyPointsAllowsFileChange(path) || locationRecoveryAllowsFileChange(path) || locationRecoveryAllowsNewFile(path), true, path)
    assert.ok(!(await read(path)).endsWith('\n\n'))
  }
  for (const path of ['lib/discovery/catalogue-data/pricing-review-baseline-20261110.json', 'lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json', 'lib/discovery/catalogue-data/neighborhood-reviewed-identities-20261113.json', 'lib/discovery/catalogue-data/neighborhood-coverage-reviewed-identities-20261116.json', 'lib/discovery/catalogue-coordinate-binding.mjs', 'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-search.mjs', 'lib/discovery/public-catalogue.mjs', 'lib/locale/service-english.json', 'scripts/catalogue-coverage-report.mjs', 'components/discovery-business-card.js', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs']) {
    assert.equal(locationRecoveryAllowsFileChange(path), false, path); assert.equal(locationRecoveryAllowsNewFile(path), false, path)
  }
})

test('every other original asset, catalogue source/price/identity, historical snapshot, UI, search, booking and configuration byte stays frozen', async () => {
  const frozen = tree.filter(record => !pr81LocationAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => !pr81LocationAllowsNewFile(path) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(LOCATION_RECOVERY_NEW_HASHES)].sort())
  for (const path of historicalScopes) assert.equal(await read(path), before(path), path + ': all eleven earlier helper maps remain byte-identical')
})

test('the literal source inverse and three complete normalized-row hash pairs fail closed and recover every previous byte without hiding another change', async () => {
  const path = 'lib/discovery/sofia-catalogue.mjs', source = await read(path), previous = before(path)
  assert.equal(locationRecoveryPriorSource(path, source), previous)
  assert.equal(locationRecoveryPriorSource(path, previous), previous)
  assert.throws(() => locationRecoveryPriorSource(path, source + '\n'), /Unreviewed location recovery source delta/u)
  assert.deepEqual(Object.keys(LOCATION_RECOVERY_ROW_HASHES).sort(), ['sofia-stephan-borovo', 'sofia-maria-nemska-photo-suhodol', 'sofia-dar-auto-service-europa'].sort())
  for (const [id, hashes] of Object.entries(LOCATION_RECOVERY_ROW_HASHES)) {
    const row = SOFIA_CATALOGUE.find(row => row.id === id), restored = locationRecoveryPriorRecord(row)
    assert.equal(rowHash(row), hashes.after); assert.equal(rowHash(restored), hashes.before)
    assert.equal(locationRecoveryPriorRecord(restored), restored)
    assert.equal(pricingIdentity(row), pricingIdentity(restored))
    assert.throws(() => locationRecoveryPriorRecord({ ...row, phone: '+359888000000' }), /Unreviewed location recovery record delta/u)
    assert.throws(() => locationRecoveryPriorRecord({ ...row, services: [] }), /Unreviewed location recovery record delta/u)
    assert.throws(() => locationRecoveryPriorRecord({ ...row, coordinates: null, name: row.name + ' changed' }), /Unreviewed location recovery record delta/u)
  }
  const unmodified = SOFIA_CATALOGUE.find(row => !Object.hasOwn(LOCATION_RECOVERY_ROW_HASHES, row.id))
  assert.equal(locationRecoveryPriorRecord(unmodified), unmodified)
  assert.equal(rowHash(locationRecoveryPriorCatalogue(SOFIA_CATALOGUE)), 'e0af5db43c503050ffcbdfc7061a6e8c8c609aa6eb353babfa2f4c79f544098c')
  assert.equal(rowHash(locationRecoveryPriorCatalogue(RAW_SOFIA_CATALOGUE)), 'e0af5db43c503050ffcbdfc7061a6e8c8c609aa6eb353babfa2f4c79f544098c')
})

test('exactly three of all 1732 Sofia rows change, all prices and five other-city rows stay exact, and no business is added or deleted', () => {
  const old = locationRecoveryPriorCatalogue(SOFIA_CATALOGUE)
  assert.equal(SOFIA_CATALOGUE.length, 1732); assert.equal(PUBLIC_CATALOGUE.length, 1737)
  assert.equal(rowHash(SOFIA_CATALOGUE), '5e6cf90b315f0e844a280158adbbb3cfd0dc22744ee832283951ea005f47e9f7')
  assert.deepEqual(SOFIA_CATALOGUE.map(row => row.id), old.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.map(pricingIdentity), old.map(pricingIdentity))
  assert.deepEqual(SOFIA_CATALOGUE.filter((row, index) => rowHash(row) !== rowHash(old[index])).map(row => row.id).sort(), Object.keys(LOCATION_RECOVERY_ROW_HASHES).sort())
  for (const row of PUBLIC_CATALOGUE.filter(row => row.cityCode !== '68134')) assert.equal(locationRecoveryPriorRecord(row), row)
})

test('the old priority30 snapshot is independently reproducible through the exact dated inverse and the new batch evidence matches only the measured incremental effects', async () => {
  const now = Date.parse('2026-11-22T00:00:00Z')
  const old = catalogueCoverageReport(locationRecoveryPriorCatalogue(SOFIA_CATALOGUE), { now, target: 30 })
  assert.deepEqual(old, JSON.parse(await read('docs/catalogue-coverage/coverage-20261122-priority30.json')), 'the old saved snapshot is not overwritten or rebaselined')
  const current = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: 30 })
  const ledger = JSON.parse(await read('docs/catalogue-coverage/location-recovery-batch-20261122.json'))
  assert.equal(ledger.newBusinessesAdded, 0); assert.equal(ledger.existingBusinessesImproved, 3); assert.equal(ledger.published, false)
  for (const [label, report] of [['before', old], ['after', current]]) for (const [key, value] of Object.entries(ledger[label])) {
    const measured = key === 'zeroPhysicalCells' ? report.counts.zeroCells : key === 'zeroLocatedCells'
      ? [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells).filter(cell => cell.locatedCount === 0).length
      : report.counts[key]
    assert.equal(measured, value, label + ':' + key)
  }
  for (const expected of ledger.cells) {
    const select = report => report.neighborhoods.find(area => area.name === expected.neighborhood).cells.find(cell => cell.categoryId === expected.category)
    assert.deepEqual([select(old).count, select(current).count], expected.physical)
    assert.deepEqual([select(old).locatedCount, select(current).locatedCount], expected.located)
  }
})

test('new recovery modules are bounded local overlays without network/geocoder/data writes and actual new-feature tests never apply the historical inverse', async () => {
  for (const path of Object.keys(LOCATION_RECOVERY_NEW_HASHES).filter(path => path.startsWith('lib/'))) {
    const source = await read(path)
    assert.doesNotMatch(source, /node:crypto|createHash|pricingIdentity\s*\(|readFile|writeFile|\bfetch\s*\(|getSupabase|\.from\s*\(|createPublicBooking|sendEmail|sendNotification|trackProductEvent|trackSearchEvent/u)
    assert.doesNotMatch(source, /import .*address_sofia\.csv/u)
  }
  for (const path of ['tests/catalogue-quarter-recovery-20261122.test.mjs', 'tests/catalogue-address-points-recovery-20261122.test.mjs']) assert.doesNotMatch(await read(path), /locationRecoveryPriorRecord|locationRecoveryPriorCatalogue/u, 'current-source feature tests must validate the actual new rows')
  assert.equal(await read('package.json'), before('package.json'))
  for (const path of ['scripts/check-catalogue-pricing.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/check-public-english.mjs']) assert.equal(await read(path), before(path), 'normal mandatory release gates stay in force')
})
