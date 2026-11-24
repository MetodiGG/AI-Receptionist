import { pr81LocationPriorSource, pr81LocationAllowsFileChange, pr81LocationAllowsNewFile } from "./pr81-location-only-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource, locationRecoveryPriorCatalogue } from './location-recovery-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SOFIA_CATALOGUE as currentCatalogue } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE as currentPublicCatalogue } from '../lib/discovery/public-catalogue.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueCoverageReport, coverageMarkdown, DEFAULT_CATALOGUE_COVERAGE_TARGET } from '../scripts/catalogue-coverage-report.mjs'
import { PRIORITY30_REPORT_BASE, PRIORITY30_REPORT_HASHES, PRIORITY30_REPORT_NEW_HASHES,
  priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'

// This saved coverage snapshot keeps its original source cohort and all counts.
const SOFIA_CATALOGUE = suhodolIntakePriorCatalogue(currentCatalogue)
const PUBLIC_CATALOGUE = suhodolIntakePriorCatalogue(currentPublicCatalogue)
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, pr81LocationPriorSource(path, source)))))
const before = path => git('show', PRIORITY30_REPORT_BASE + ':' + path)
const sha256 = value => createHash('sha256').update(value).digest('hex')
const productionPath = path => path !== 'node_modules' && !/^tests\//u.test(path)
const tree = git('ls-tree', '-r', '-z', PRIORITY30_REPORT_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))
const historicalScopes = ['discovery-refinement-20261122', 'next-security-upgrade', 'stationary-discovery', 'public-action', 'public-english', 'services-price-cards', 'catalogue-revalidation-20261122', 'sports-mobile-photo-fit', 'regional-catalogue-20261122', 'azis-style-catalogue-20261122'].map(name => `tests/${name}-scope.mjs`)
const now = Date.parse('2026-11-22T00:00:00Z')

test('priority30 authorizes exactly one offline report, two existing explanatory documents and four dated planning/research outputs', async () => {
  assert.equal(PRIORITY30_REPORT_BASE, '00a86dc5bdd35cbba4652c179814bde9abbb76de')
  assert.deepEqual(Object.keys(PRIORITY30_REPORT_HASHES).sort(), ['README.md', 'docs/catalogue-coverage/README.md', 'scripts/catalogue-coverage-report.mjs'].sort())
  assert.deepEqual(Object.keys(PRIORITY30_REPORT_NEW_HASHES).sort(), [
    'docs/catalogue-coverage/coverage-20261122-priority30.json', 'docs/catalogue-coverage/coverage-20261122-priority30.md',
    'docs/catalogue-coverage/priority-30-20261122.md', 'docs/catalogue-coverage/research-priority30-20261122.json',
  ].sort())
  for (const [path, hash] of Object.entries({ ...PRIORITY30_REPORT_HASHES, ...PRIORITY30_REPORT_NEW_HASHES })) {
    assert.equal(sha256(await read(path)), hash, path + ': any later delta needs a separate exact review')
    assert.equal(priority30ReportAllowsFileChange(path) || priority30ReportAllowsNewFile(path), true, path)
    assert.ok(!(await read(path)).endsWith('\n\n'), path + ': no extra EOF blank line')
  }
  for (const path of ['AGENTS.md', 'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/public-catalogue.mjs', 'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-pricing-review.mjs', 'lib/discovery/catalogue-coordinate-binding.mjs', 'lib/discovery/catalogue-search.mjs', 'lib/discovery/catalogue-audit.mjs', 'lib/business-location.mjs', 'lib/discovery/subcategories.mjs', 'lib/locale/service-english.json', 'components/discovery-search.js', 'components/discovery-business-card.js', 'app/inline-discovery.css', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs']) {
    assert.equal(priority30ReportAllowsFileChange(path), false, path)
    assert.equal(priority30ReportAllowsNewFile(path), false, path)
  }
})

test('all runtime, catalogue rows, tariffs, source receipts, original assets, previous snapshots and configuration stay byte-frozen with zero new admissions', async () => {
  const frozen = tree.filter(record => !pr81LocationAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ': the offline report must not mutate the product or historical evidence')
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => !pr81LocationAllowsNewFile(path) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(PRIORITY30_REPORT_NEW_HASHES)].sort(), 'no new runtime, data, media or executable path is authorized')
  for (const path of historicalScopes) assert.equal(await read(path), before(path), path + ': never widen old SHA maps or baseline authorizations')
})

test('the newest exact forward reversal reconstructs all prior bytes before older Azis and regional stages and rejects unrelated changes', async () => {
  for (const path of Object.keys(PRIORITY30_REPORT_HASHES)) {
    const source = await read(path), previous = before(path)
    assert.equal(priority30ReportPriorSource(path, source), previous, path)
    assert.equal(priority30ReportPriorSource(path, previous), previous)
    assert.throws(() => priority30ReportPriorSource(path, source + '\n'), /Unreviewed priority30 source delta/u, path)
    assert.throws(() => priority30ReportPriorSource(path, source + source), /Unreviewed priority30 source delta/u, path)
  }
  const path = 'lib/discovery/catalogue-search.mjs'
  assert.equal(priority30ReportPriorSource(path, await read(path)), before(path), 'unlisted search source is not normalized or omitted')
})

test('the dated target30 snapshot is exactly reproducible and states source/public/location counts without a GPS, radius or achieved-quota claim', async () => {
  // Replay the dated snapshot through the exact later point/quarter inverses;
  // current new-feature tests use the real recovered records.
  const report = catalogueCoverageReport(locationRecoveryPriorCatalogue(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)), { now })
  assert.equal(DEFAULT_CATALOGUE_COVERAGE_TARGET, 30)
  assert.equal(report.targetPerCategoryPerNeighborhood, 30)
  assert.deepEqual(JSON.parse(await read('docs/catalogue-coverage/coverage-20261122-priority30.json')), report)
  assert.equal(await read('docs/catalogue-coverage/coverage-20261122-priority30.md'), coverageMarkdown(report))
  for (const [key, value] of Object.entries({ sourceRecords: 1732, sourceSofiaRecords: 1732, sourceOtherCityRecords: 0,
    approvedBusinesses: 1709, excludedOrNotCurrentlyEligible: 23, premises: 1517, serviceAreaProviders: 192,
    premisesWithBoundCoordinates: 903, premisesWithoutBoundCoordinates: 614, missingNeighborhoodPremises: 584,
    missingNeighborhoodPremisesWithBoundCoordinates: 377, broadAreaUnresolvedPremises: 34,
    broadAreaUnresolvedPremisesWithBoundCoordinates: 21, totalTargetCells: 1750, zeroCells: 1294,
    cellsAtTarget: 0, cellsAtLocatedTarget: 0, businessCategoryIncidences: 979, outstandingBusinessCategoryIncidences: 51521 })) assert.equal(report.counts[key], value, key)
  const rows = new Map(locationRecoveryPriorCatalogue(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)).map(row => [row.id, row]))
  const cells = [...report.neighborhoods, ...report.additionalNamedAreas].flatMap(area => area.cells)
  assert.equal(cells.filter(cell => cell.locatedCount === 0).length, 1437)
  for (const cell of cells) {
    assert.equal(new Set(cell.businessIds).size, cell.count)
    assert.deepEqual(cell.locatedBusinessIds, cell.businessIds.filter(id => catalogueBoundCoordinates(rows.get(id))))
    assert.equal(cell.locatedCount, cell.locatedBusinessIds.length)
    assert.equal(cell.unlocatedCount, cell.count - cell.locatedCount)
    assert.equal(cell.locatedGap, Math.max(0, 30 - cell.locatedCount))
  }
  const mixed = catalogueCoverageReport(locationRecoveryPriorCatalogue(nearbyPointsPriorCatalogue(PUBLIC_CATALOGUE)), { now })
  assert.equal(mixed.counts.sourceRecords, 1737); assert.equal(mixed.counts.sourceOtherCityRecords, 5)
  assert.equal(mixed.counts.approvedOtherCityBusinesses, 5); assert.equal(mixed.counts.excludedOrNotCurrentlyEligible, 23)
  assert.deepEqual(mixed.neighborhoods, report.neighborhoods); assert.deepEqual(mixed.additionalNamedAreas, report.additionalNamedAreas)
  assert.match(coverageMarkdown(report), /нулата не означава липса на Лом\/Брусарци/u)
  assert.match(coverageMarkdown(report), /не е нова независима проверка на GPS точност или вход/u)
  assert.match(coverageMarkdown(report), /не гарантира резултати във всеки радиус/u)
})

test('mobile-evidence tracks and the existing missing-quarter/address queues do not manufacture offices, numbered areas or new businesses', () => {
  const report = catalogueCoverageReport(locationRecoveryPriorCatalogue(nearbyPointsPriorCatalogue(SOFIA_CATALOGUE)), { now })
  const home = report.categories.find(category => category.id === 'home_services')
  assert.equal(home.premises, 0); assert.equal(home.serviceAreaProviders, 133)
  assert.ok(report.priorityQueue.filter(cell => cell.categoryId === 'home_services').every(cell => cell.count === 0 && cell.researchTrack === 'service_area_evidence'))
  assert.ok(report.priorityQueue.filter(cell => cell.categoryId !== 'home_services').every(cell => cell.researchTrack === 'premises_and_address_review'))
  const missingPlaceholder = report.missingNeighborhood.find(row => row.id === 'sofia-gas-comers-rezbarska')
  assert.equal(missingPlaceholder.neighborhood, 'Неуточнен'); assert.equal(missingPlaceholder.hasBoundCoordinates, true)
  assert.equal(report.missingNeighborhood.filter(row => row.hasBoundCoordinates).length, 377)
  assert.equal(report.unresolvedBroadAreas.flatMap(area => area.businesses).filter(row => row.hasBoundCoordinates).length, 21)
  const mobileIds = new Set(report.serviceAreaProviders.map(row => row.id))
  assert.equal(mobileIds.size, 192)
  for (const area of [...report.neighborhoods, ...report.additionalNamedAreas]) for (const cell of area.cells) assert.ok(cell.businessIds.every(id => !mobileIds.has(id)))
  const broadIds = new Set(report.unresolvedBroadAreas.flatMap(area => area.businesses.map(row => row.id)))
  assert.equal(broadIds.size, 34)
  for (const area of report.neighborhoods) for (const cell of area.cells) assert.ok(cell.businessIds.every(id => !broadIds.has(id)), 'a broad parent cannot fill numbered child cells')
  assert.match(coverageMarkdown(report), /Доказана обслужвана зона, не нов офис/u)
})

test('six held research leads remain explicitly unadmitted and ordinary release/provider/booking paths are unchanged', async () => {
  const research = JSON.parse(await read('docs/catalogue-coverage/research-priority30-20261122.json'))
  assert.equal(research.status, 'research_only_no_new_admissions'); assert.equal(research.newlyAdmittedBusinesses, 0)
  assert.equal(research.checkedOn, '2026-11-22'); assert.equal(research.leads.length, 6)
  assert.ok(research.leads.every(lead => lead.status.startsWith('held_')))
  assert.equal(SOFIA_CATALOGUE.length, 1732); assert.equal(PUBLIC_CATALOGUE.length, 1737)
  const source = await read('scripts/catalogue-coverage-report.mjs')
  assert.doesNotMatch(source, /\bfetch\s*\(|https\.request|supabase|createPublicBooking|sendEmail|sendNotification|trackProductEvent|trackSearchEvent|\.from\s*\(/u)
  assert.equal((source.match(/flag: 'wx'/gu) || []).length, 2, 'explicit local outputs remain create-only, never rewrite historical snapshots')
  assert.equal(await read('package.json'), before('package.json'))
  for (const path of ['scripts/check-catalogue-pricing.mjs', 'scripts/check-specific-service-photos.mjs', 'scripts/check-public-english.mjs', 'scripts/inventory-public-english.mjs']) assert.equal(await read(path), before(path), path + ': no mandatory gate is bypassed')
})
