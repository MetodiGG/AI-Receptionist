import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
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
import { NEARBY_POINTS_BASE, NEARBY_POINTS_HASHES, NEARBY_POINTS_NEW_HASHES, NEARBY_POINTS_ROW_HASHES,
  nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource,
  nearbyPointsPriorRecord, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'

// Replay only this dated point stage; the later intake has its own current-row tests.
const SOFIA_CATALOGUE = suhodolIntakePriorCatalogue(currentCatalogue)
const RAW_SOFIA_CATALOGUE = suhodolIntakePriorCatalogue(currentRawCatalogue)
const PUBLIC_CATALOGUE = suhodolIntakePriorCatalogue(currentPublicCatalogue)
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => suhodolIntakePriorSource(path, source))
const before = path => git('show', NEARBY_POINTS_BASE + ':' + path)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const rowHash = value => sha256(JSON.stringify(value))
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', NEARBY_POINTS_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const olderScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit', 'regional-catalogue-20261122', 'azis-style-catalogue-20261122', 'priority30-catalogue-report', 'location-recovery-20261122'].map(name => `tests/${name}-scope.mjs`)

test('the new point review authorizes one exact source integration, one local overlay and three dated evidence files only', async () => {
  assert.equal(NEARBY_POINTS_BASE, '6e14249ebb27d0d24e2a436629fb7f2dd8a4a92b')
  assert.deepEqual(Object.keys(NEARBY_POINTS_HASHES), ['lib/discovery/sofia-catalogue.mjs'])
  assert.deepEqual(Object.keys(NEARBY_POINTS_NEW_HASHES).sort(), [
    'lib/discovery/catalogue-data/nearby-address-points-20261122.mjs',
    'docs/catalogue-coverage/nearby-points-review-20261122.json',
    'docs/catalogue-coverage/nearby-points-batch-20261122.md',
    'docs/catalogue-coverage/research-priority30-002-20261122.json',
  ].sort())
  for (const [path, hash] of Object.entries({ ...NEARBY_POINTS_HASHES, ...NEARBY_POINTS_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path)
    assert.equal(suhodolIntakeAllowsFileChange(path) || nearbyPointsAllowsFileChange(path) || nearbyPointsAllowsNewFile(path), true, path)
  }
  for (const path of ['AGENTS.md', 'lib/discovery/catalogue-search.mjs', 'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-coordinate-binding.mjs', 'lib/discovery/catalogue-data/address-points-recovery-20261122.mjs', 'lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json', 'lib/locale/service-english.json', 'components/discovery-business-card.js', 'scripts/catalogue-coverage-report.mjs', 'package.json', 'pnpm-lock.yaml']) {
    assert.equal(nearbyPointsAllowsFileChange(path), false); assert.equal(nearbyPointsAllowsNewFile(path), false)
  }
})

test('all other runtime/source/tariff/photo/snapshot/config bytes and all twelve earlier scope maps remain frozen', async () => {
  const frozen = tree.filter(record => !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && !suhodolIntakeAllowsNewFile(path) && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(NEARBY_POINTS_NEW_HASHES)].sort())
  for (const path of olderScopes) assert.equal(await read(path), before(path), path)
})

test('the newest literal source and whole-row inverses fail closed and reconstruct only this precise historical point stage', async () => {
  const path = 'lib/discovery/sofia-catalogue.mjs', source = await read(path), previous = before(path)
  assert.equal(nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, source)), previous)
  assert.equal(nearbyPointsPriorSource(path, previous), previous)
  assert.throws(() => nearbyPointsPriorSource(path, source + '\n'), /Unreviewed nearby points source delta/u)
  assert.deepEqual(Object.keys(NEARBY_POINTS_ROW_HASHES).sort(), ['sofia-shining-polishing-auto', 'sofia-vas-val-auto-malashevtsi-lavandula53', 'sofia-diva-zone-mladost2-bg-shkolo'].sort())
  for (const [id, hashes] of Object.entries(NEARBY_POINTS_ROW_HASHES)) {
    const row = SOFIA_CATALOGUE.find(row => row.id === id), restored = nearbyPointsPriorRecord(row)
    assert.equal(rowHash(row), hashes.after); assert.equal(rowHash(restored), hashes.before)
    assert.equal(nearbyPointsPriorRecord(restored), restored)
    assert.equal(pricingIdentity(row), pricingIdentity(restored))
    for (const patch of [{ phone: '+359888000000' }, { services: [] }, { name: row.name + ' changed' }, { coordinates: { ...row.coordinates, latitude: 42.7 } }]) assert.throws(() => nearbyPointsPriorRecord({ ...row, ...patch }), /Unreviewed nearby points record delta/u)
  }
  assert.equal(rowHash(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)), '5e6cf90b315f0e844a280158adbbb3cfd0dc22744ee832283951ea005f47e9f7')
  assert.equal(rowHash(nearbyPointsPriorCatalogue(RAW_SOFIA_CATALOGUE)), '5e6cf90b315f0e844a280158adbbb3cfd0dc22744ee832283951ea005f47e9f7')
})

test('only three of1732 Sofia rows gain points and every old price identity and five other-city records remain exact', () => {
  const old = nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)
  assert.equal(SOFIA_CATALOGUE.length, 1732); assert.equal(PUBLIC_CATALOGUE.length, 1737)
  assert.equal(rowHash(SOFIA_CATALOGUE), '5ced3388155ea435c66bbc90b8946a18eba2d55785a81de2c3d45472d28c89c3')
  assert.deepEqual(SOFIA_CATALOGUE.map(row => row.id), old.map(row => row.id))
  assert.deepEqual(SOFIA_CATALOGUE.map(pricingIdentity), old.map(pricingIdentity))
  assert.deepEqual(SOFIA_CATALOGUE.filter((row, i) => rowHash(row) !== rowHash(old[i])).map(row => row.id).sort(), Object.keys(NEARBY_POINTS_ROW_HASHES).sort())
  for (const row of PUBLIC_CATALOGUE.filter(row => row.cityCode !== '68134')) assert.equal(nearbyPointsPriorRecord(row), row)
})

test('the ledger matches actual geographic effects and all ten unsafe candidate points remain withheld', async () => {
  const now = Date.parse('2026-11-22T12:00:00Z')
  const ledger = JSON.parse(await read('docs/catalogue-coverage/nearby-points-review-20261122.json'))
  const old = catalogueCoverageReport(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE), { now, target: 30 })
  const current = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: 30 })
  assert.equal(ledger.newBusinessesAdded, 0); assert.equal(ledger.existingBusinessesWithNewPoints, 3)
  assert.equal(ledger.status, 'prepared_local_not_published'); assert.equal(ledger.accepted.length, 3); assert.equal(ledger.held.length, 10)
  for (const [key, pair] of Object.entries(ledger.incrementalCoverage)) {
    if (key === 'cells') continue
    const measured = report => key === 'physicalPremises' ? report.counts.premises : key === 'zeroPhysicalCells' ? report.counts.zeroCells : key === 'zeroLocatedCells' ? [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells).filter(cell => cell.locatedCount === 0).length : report.counts[key]
    assert.deepEqual([measured(old), measured(current)], pair, key)
  }
  for (const entry of ledger.incrementalCoverage.cells) {
    const select = report => [...report.neighborhoods, ...report.additionalNamedAreas].find(area => area.name === entry.neighborhood).cells.find(cell => cell.categoryId === entry.category)
    assert.deepEqual([select(old).count, select(current).count], entry.physical)
    assert.deepEqual([select(old).locatedCount, select(current).locatedCount], entry.located)
  }
  for (const entry of ledger.held) assert.equal(SOFIA_CATALOGUE.find(row => row.id === entry.id).coordinates, null, entry.id)
  assert.equal(ledger.municipalSource.originalFileChanged, false)
  assert.equal(ledger.municipalSource.sourceSha256, '0cd8c9d19996c0654707f711cb8d559a23e0a95148d4b8c6016aad76de2140ef')
  const research = JSON.parse(await read('docs/catalogue-coverage/research-priority30-002-20261122.json'))
  assert.equal(research.newBusinessesAdded, 0)
  assert.equal(research.leads.length, 6)
})

test('the product overlay remains local-only and new functional tests exercise actual current rows without a historical inverse', async () => {
  const source = await read('lib/discovery/catalogue-data/nearby-address-points-20261122.mjs')
  assert.doesNotMatch(source, /node:crypto|createHash|readFile|writeFile|\bfetch\s*\(|getSupabase|\.from\s*\(|sendEmail|sendNotification|createPublicBooking/u)
  assert.doesNotMatch(source, /import .*address_sofia\.csv/u)
  assert.doesNotMatch(await read('tests/catalogue-nearby-address-points-20261122.test.mjs'), /nearbyPointsPriorRecord|nearbyPointsPriorCatalogue/u)
  for (const path of ['scripts/check-catalogue-pricing.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/check-public-english.mjs', 'package.json']) assert.equal(await read(path), before(path), path)
})
