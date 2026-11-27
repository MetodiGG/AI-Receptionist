import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import report from '../docs/catalogue-coverage/verified-owner-civic-points-20261127.json' with { type: 'json' }
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { applySofiaOwnerPointsLateNov27 } from '../lib/discovery/catalogue-data/sofia-owner-points-late-nov27.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256, OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { lateOwnerPointsAllowsFileChange, lateOwnerPointsAllowsNewFile, lateOwnerPointsAllowsPath,
  lateOwnerPointsPriorCatalogue, lateOwnerPointsPriorSource } from './catalogue-verified-owner-civic-points-20261127-scope.mjs'
import prior from './fixtures/catalogue-verified-sofia-appointment-growth-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-verified-owner-civic-points-20261127.json' with { type: 'json' }
import { neighborhoodAdditionsAllowsFileChange, neighborhoodAdditionsAllowsNewFile, neighborhoodAdditionsPriorCatalogue, neighborhoodAdditionsPriorSource } from './catalogue-verified-neighborhood-additions-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url)
const cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const added = ['docs/catalogue-coverage/verified-owner-civic-points-20261127.json', 'lib/discovery/catalogue-data/sofia-owner-points-late-nov27.mjs']
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = value => createHash('sha256').update(value).digest('hex')
const rowHash = row => sha(JSON.stringify(row))
const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const original = lateOwnerPointsPriorCatalogue(SOFIA_CATALOGUE)

test('owner/civic location-only receipt recognizes exactly one modified and two new non-test files', () => {
  assert.equal(receipt.baseline, '807121713ee452a2a4fdd100b32a0d9a87653ad4')
  assert.equal(report.baseCommit, receipt.baseline)
  assert.deepEqual(Object.keys(receipt.changed), [cataloguePath])
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const inventory = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...inventory].filter(path => path !== 'node_modules' && !path.startsWith('tests/') &&
    !neighborhoodAdditionsAllowsNewFile(path) && (path === cataloguePath || !neighborhoodAdditionsAllowsFileChange(path))).sort(), [...added, cataloguePath].sort())
  const baseline = git('show', receipt.baseline + ':' + cataloguePath)
  const live = readFileSync(new URL(cataloguePath, cwd))
  const current = neighborhoodAdditionsPriorSource(cataloguePath, live)
  assert.equal(sha(baseline), prior.changed[cataloguePath].after)
  assert.equal(sha(baseline), receipt.changed[cataloguePath].before)
  assert.equal(sha(current), receipt.changed[cataloguePath].after)
  assert.equal(lateOwnerPointsAllowsFileChange(cataloguePath), sha(live) === receipt.changed[cataloguePath].after)
  assert.ok(catalogueIntakeAllowsPath(cataloguePath))
  assert.deepEqual(lateOwnerPointsPriorSource(cataloguePath, current), baseline)
  const changedBeyondReceipt = Buffer.concat([live, Buffer.from('\n')])
  assert.equal(lateOwnerPointsPriorSource(cataloguePath, changedBeyondReceipt), changedBeyondReceipt)
  assert.equal(catalogueIntakePriorSource(cataloguePath, changedBeyondReceipt), changedBeyondReceipt)
  for (const path of added) {
    assert.deepEqual(paths(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path])
    assert.ok(lateOwnerPointsAllowsNewFile(path) && catalogueIntakeAllowsPath(path))
    assert.ok(!lateOwnerPointsAllowsFileChange(path))
  }
  for (const path of ['lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
    'lib/booking-engine.mjs', 'lib/locale/service-english.json', 'app/layout.js', 'package.json', 'supabase/config.toml']) {
    assert.equal(lateOwnerPointsAllowsPath(path), false, path)
  }
})

test('raw and visible inventory change only the individually approved branch location fields', () => {
  const approvals = new Map(receipt.records.map(row => [row.id, row]))
  assert.equal(approvals.size, 3)
  assert.deepEqual(report.verified.map(row => row.id).sort(), [...approvals.keys()].sort())
  for (const actual of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE].map(neighborhoodAdditionsPriorCatalogue)) {
    const before = lateOwnerPointsPriorCatalogue(actual)
    assert.equal(rowHash(before), receipt.baselineCatalogueSha256)
    assert.equal(rowHash(actual), receipt.currentCatalogueSha256)
    assert.equal(before.length, actual.length)
    for (const [index, row] of actual.entries()) {
      const proof = approvals.get(row.id), old = before[index]
      if (!proof) {
        assert.equal(old, row)
        continue
      }
      assert.equal(rowHash(old), proof.before)
      assert.equal(rowHash(row), proof.after)
      assert.deepEqual(Object.keys(row).filter(key => !isDeepStrictEqual(row[key], old[key])).sort(), Object.keys(proof.previous).sort())
      assert.equal(row.verification, old.verification)
      assert.equal(row.services, old.services)
      assert.equal(row.booking, old.booking)
      assert.equal(pricingIdentity(old), pricingIdentity(row))
      assert.equal(applySofiaOwnerPointsLateNov27([row])[0], row)
      assert.deepEqual(applySofiaOwnerPointsLateNov27([old])[0], row)
      assert.equal(lateOwnerPointsPriorCatalogue([old])[0], old)
      assert.throws(() => lateOwnerPointsPriorCatalogue([row, row]), /Duplicate owner\/civic coordinate record/u)
      for (const tampered of [{ ...row, address: row.address + ' A' }, { ...row, services: [] },
        { ...row, booking: { ...row.booking, added: 'not reviewed' } }, { ...row, coordinates: { ...row.coordinates, longitude: 0 } }]) {
        assert.throws(() => catalogueIntakePriorCatalogue([tampered]), /Unreviewed owner\/civic coordinate record/u)
      }
      for (const differentBranch of [
        { cityCode: '11884' }, { locationKind: 'service_area' }, { address: old.address + ' A' }, { neighborhood: 'Друг квартал' },
        { website: old.website + 'other/' }, { phone: null }, { category: 'other' }, { booking: { kind: 'form', url: 'https://example.test/' } },
        { coordinates: { latitude: 42.7, longitude: 23.3 } },
        { verification: { ...old.verification, status: 'pending' } }, { verification: { ...old.verification, contact: null } },
        { verification: { ...old.verification, booking: { ...old.verification.booking, url: null } } },
      ]) {
        const competing = { ...old, ...differentBranch }
        assert.equal(applySofiaOwnerPointsLateNov27([competing])[0], competing)
      }
    }
  }
})

test('dated 30-business snapshot separates recoveries in precise-nearby and physical coverage', () => {
  const c = report.coverage
  const rows = [original, neighborhoodAdditionsPriorCatalogue(SOFIA_CATALOGUE)]
  const coverage = rows.map(items => catalogueCoverageReport(items, { now, target: c.targetPerQuarterCategory }))
  const map = fn => coverage.map(fn)
  const cells = audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].flatMap(area => area.cells)
  assert.equal(c.targetPerQuarterCategory, 30)
  assert.equal(report.newDistinctBusinesses, 0)
  assert.equal(report.municipalSource.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.deepEqual(map(audit => audit.counts.totalTargetCells), [c.checkedCells, c.checkedCells])
  assert.deepEqual(map(audit => audit.counts.sourceSofiaRecords), c.sourceRecords)
  assert.deepEqual(map(audit => audit.counts.approvedBusinesses), c.approvedSofiaBusinesses)
  assert.deepEqual(map(audit => audit.counts.premisesWithBoundCoordinates), c.premisesWithBoundPoint)
  assert.deepEqual(map(audit => audit.counts.zeroCells), c.emptyPhysicalCells)
  assert.deepEqual(map(audit => cells(audit).filter(cell => !cell.locatedCount).length), c.emptyLocatedCells)
  for (const [deltas, field] of [[c.physicalDeltas, 'count'], [c.locatedDeltas, 'locatedCount']]) {
    for (const [name, category, before, after] of deltas) {
      const get = audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].find(area => area.name === name)
        .cells.find(cell => cell.categoryId === category)
      assert.deepEqual(map(audit => get(audit)[field]), [before, after], name + '/' + category)
    }
  }
})

test('each vetted exact point feeds the same route and map in nearby cards, profile and read-only details', async () => {
  const findCatalogue = id => SOFIA_CATALOGUE.find(row => row.id === id)
  const resolveDetails = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue, now: () => now, allowAttempt: () => true })
  const resolvePreviousDetails = createPublicBusinessDetailsHandler({ config: { enabled: true },
    findCatalogue: id => original.find(row => row.id === id), now: () => now, allowAttempt: () => true })
  for (const evidence of report.verified) {
    const row = findCatalogue(evidence.id)
    const old = original.find(item => item.id === row.id)
    const point = catalogueBoundCoordinates(row)
    const { latitude, longitude } = evidence.point
    assert.equal(old.coordinates, null)
    assert.equal(row.address, evidence.address)
    assert.equal(row.neighborhood, evidence.neighborhood)
    assert.equal(point.method, evidence.method)
    assert.deepEqual([point.latitude, point.longitude], [latitude, longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'A' }), null)
    assert.equal(catalogueBoundCoordinates({ ...row, coordinates: { ...point, latitude: longitude, longitude: latitude } }), null)
    if (evidence.point.addressId) {
      assert.equal(point.source, OFFICIAL_SOFIA_SOURCE_URL)
      assert.equal(point.addressId, evidence.point.addressId)
      assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: null }), null)
    } else assert.equal(point.source, evidence.evidenceUrls[0])

    const intent = { cityCode: '68134', category: row.category, browse: true, searchV2: true, requirements: [] }
    const [before] = normalizeCatalogueBusinesses([old], intent, { now })
    const where = { ...intent, neighborhood: row.neighborhood, coordinates: { latitude, longitude }, radiusKm: 1 }
    const [card] = normalizeCatalogueBusinesses([row], where, { now })
    assert.ok(card && before, row.id)
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...where, coordinates: { latitude: latitude + 0.1, longitude } }, { now }), [])
    assert.equal(railDirections(before), null)
    const profile = catalogueProfileView(row, { now })
    const read = async handler => {
      const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
      assert.equal(response.status, 200, row.id)
      return (await response.json()).business
    }
    const detail = await read(resolveDetails)
    for (const [surface, previousSurface] of [[card, before], [profile, catalogueProfileView(old, { now })],
      [detail, await read(resolvePreviousDetails)]]) {
      assert.equal(surface.locationStatus, 'verified_sofia', row.id)
      const directions = new URL(businessDirectionsUrl(surface))
      assert.equal(directions.hostname, 'www.google.com')
      assert.equal(directions.searchParams.get('api'), '1')
      assert.equal(directions.searchParams.get('destination'), [latitude, longitude].join(','))
      assert.equal(directions.searchParams.get('destination_place_id'), null)
      assert.equal(directions.href, railDirections(surface))
      const map = new URL(businessMapUrl(surface))
      assert.equal(map.searchParams.get('marker'), [latitude, longitude].join(','))
      assert.deepEqual(railExternalAction(surface, now), railExternalAction(before, now), row.id)
      assert.deepEqual(surface.details.services, previousSurface.details.services)
    }
    assert.deepEqual(card.availability, { status: 'external', slots: [] })
  }
})
