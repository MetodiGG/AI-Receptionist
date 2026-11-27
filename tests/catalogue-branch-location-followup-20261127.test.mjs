import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { applySofiaBranchLocationFollowupNov27 } from '../lib/discovery/catalogue-data/sofia-branch-location-followup-nov27.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256, OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { branchLocationFollowupAllowsFileChange, branchLocationFollowupAllowsNewFile, branchLocationFollowupAllowsPath,
  branchLocationFollowupPriorSource, branchLocationFollowupPriorCatalogue } from './catalogue-branch-location-followup-20261127-scope.mjs'
import { garage46AllowsFileChange, garage46AllowsNewFile, garage46AllowsPath,
  garage46PriorCatalogue, garage46PriorSource } from './catalogue-garage46-serdika-20261127-scope.mjs'
import receipt from './fixtures/catalogue-branch-location-followup-20261127.json' with { type: 'json' }
import report from '../docs/catalogue-coverage/branch-location-followup-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const catalogueSha = rows => sha(JSON.stringify(rows))
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const added = ['docs/catalogue-coverage/branch-location-followup-20261127.json', 'lib/discovery/catalogue-data/sofia-branch-location-followup-nov27.mjs']
const now = Date.parse('2026-11-27T12:00:00Z')
const expected = {
  'sofia-busy-school-nadezhda6-634': {
    address: 'София, ж.к. Надежда 6, бл. 634, до вход Д, партер', neighborhood: 'Надежда 6',
    latitude: 42.736405, longitude: 23.293690, addressId: '18018',
  },
  'sofia-clean-ride-autoservice': {
    address: 'София, ул. Георги Русев 2', neighborhood: 'Малинова долина',
    latitude: 42.637371, longitude: 23.335133, addressId: '113648',
  },
  'sofia-pharos-razsadnika-hashove21a': {
    address: 'София, ж.к. Разсадника, ул. Хъшове, бл.21А', neighborhood: 'Разсадника',
    latitude: 42.7000931, longitude: 23.2887158, addressId: null,
  },
}
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(garage46PriorCatalogue)
const oldSofia = branchLocationFollowupPriorCatalogue(SOFIA_CATALOGUE)

test('the successor receipt is limited to one catalogue entry point, its location patch and report', () => {
  assert.equal(receipt.baseline, '1aa472c77c820030f8a3c73748f3238e8e630dc6')
  assert.equal(report.baseCommit, receipt.baseline)
  assert.deepEqual(Object.keys(receipt.changed), [cataloguePath])
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const paths = [...new Set([...files(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])]
  assert.deepEqual(paths.filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !garage46AllowsNewFile(path) &&
    (path === cataloguePath || !garage46AllowsFileChange(path))).sort(), [...added, cataloguePath].sort())
  const before = git('show', receipt.baseline + ':' + cataloguePath)
  const current = garage46PriorSource(cataloguePath, readFileSync(new URL(cataloguePath, cwd)))
  assert.equal(sha(before), receipt.changed[cataloguePath].before)
  assert.equal(sha(current), receipt.changed[cataloguePath].after)
  assert.ok(branchLocationFollowupAllowsFileChange(cataloguePath) && catalogueIntakeAllowsPath(cataloguePath))
  assert.deepEqual(branchLocationFollowupPriorSource(cataloguePath, current), before)
  const tampered = Buffer.concat([current, Buffer.from('\n')])
  assert.equal(branchLocationFollowupPriorSource(cataloguePath, tampered), tampered)
  assert.equal(catalogueIntakePriorSource(cataloguePath, tampered), tampered)
  for (const path of added) {
    assert.deepEqual(files(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path])
    assert.ok(branchLocationFollowupAllowsNewFile(path) && catalogueIntakeAllowsPath(path))
    assert.ok(!branchLocationFollowupAllowsFileChange(path))
  }
  for (const path of ['lib/discovery/catalogue-data/pricing-booking-review-v1.mjs', 'lib/booking-engine.mjs',
    'lib/locale/service-english.json', 'public/logo.svg', 'app/layout.js', 'supabase/config.toml']) {
    assert.equal(branchLocationFollowupAllowsPath(path), garage46AllowsPath(path), path)
  }
})

test('only the sealed three exact branch locations change across raw and visible inventory', () => {
  const approvals = new Map(receipt.records.map(record => [record.id, record]))
  assert.deepEqual([...approvals.keys()].sort(), Object.keys(expected))
  for (const actual of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const before = branchLocationFollowupPriorCatalogue(actual)
    assert.equal(catalogueSha(actual), receipt.currentCatalogueSha256)
    assert.equal(catalogueSha(before), receipt.baselineCatalogueSha256)
    assert.equal(actual.length, before.length)
    for (const [index, row] of actual.entries()) {
      const proof = approvals.get(row.id), old = before[index]
      if (!proof) { assert.equal(old, row); continue }
      assert.equal(catalogueSha(old), proof.before)
      assert.equal(catalogueSha(row), proof.after)
      assert.deepEqual(Object.keys(row).filter(key => !isDeepStrictEqual(row[key], old[key])).sort(), Object.keys(proof.previous).sort())
      assert.equal(row.services, old.services)
      assert.equal(row.booking, old.booking)
      assert.equal(row.verification, old.verification)
      assert.equal(pricingIdentity(row), pricingIdentity(old))
      assert.equal(applySofiaBranchLocationFollowupNov27([row])[0], row)
      assert.deepEqual(applySofiaBranchLocationFollowupNov27([old]), [row])
      assert.equal(branchLocationFollowupPriorCatalogue([old])[0], old)
      assert.throws(() => branchLocationFollowupPriorCatalogue([old, row]), /Duplicate branch location follow-up record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, services: [] }]), /Unreviewed branch location follow-up record/u)
      const changes = [{ address: old.address + ' А' }, { neighborhood: 'Друг квартал' }, { cityCode: '11884' },
        { locationKind: 'service_area' }, { category: 'other' }, { website: old.website + 'other/' }, { phone: null },
        { booking: { kind: 'form', url: 'https://other.test/' } }, { verification: { ...old.verification, status: 'draft' } },
        { verification: { ...old.verification, contact: 'https://other.test/' } }, { coordinates: row.coordinates }]
      for (const change of changes) {
        const newer = { ...old, ...change }
        assert.equal(applySofiaBranchLocationFollowupNov27([newer])[0], newer, row.id + ': ' + Object.keys(change)[0])
      }
    }
  }
})

test('moving an existing branch neither invents a new business nor hides the reopened physical gap', () => {
  const published = report.coverage
  assert.equal(report.newDistinctBusinesses, 0)
  assert.equal(published.targetPerQuarterCategory, 30)
  assert.equal(report.municipalSource.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.deepEqual(report.verified.map(row => row.id).sort(), Object.keys(expected))
  const coverage = [oldSofia, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const map = reader => coverage.map(reader)
  const areas = audit => [...audit.neighborhoods, ...audit.additionalNamedAreas]
  const cells = audit => areas(audit).flatMap(area => area.cells)
  assert.deepEqual(map(audit => audit.counts.totalTargetCells), [published.checkedCells, published.checkedCells])
  assert.deepEqual(map(audit => audit.counts.approvedBusinesses), published.approvedSofiaBusinesses)
  assert.deepEqual(map(audit => audit.counts.premisesWithBoundCoordinates), published.premisesWithBoundPoint)
  assert.deepEqual(map(audit => audit.counts.zeroCells), published.emptyPhysicalCells)
  assert.deepEqual(map(audit => cells(audit).filter(cell => !cell.locatedCount).length), published.emptyLocatedCells)
  assert.deepEqual(map(audit => cells(audit).filter(cell => cell.locatedCount >= 30).length), published.locatedCellsAtTarget)
  for (const delta of published.deltas) {
    const affected = audit => areas(audit).find(area => area.name === delta.neighborhood).cells.find(cell => cell.categoryId === delta.category)
    assert.deepEqual(map(audit => affected(audit).count), delta.physical)
    assert.deepEqual(map(audit => affected(audit).locatedCount), delta.located)
  }
})

test('nearby cards, profiles and read-only details bind the same destinations without changing services or booking', async () => {
  const handlers = [oldSofia, SOFIA_CATALOGUE].map(data => createPublicBusinessDetailsHandler({
    config: { enabled: true }, findCatalogue: id => data.find(row => row.id === id),
    now: () => now, allowAttempt: () => true,
  }))
  for (const [id, location] of Object.entries(expected)) {
    const { address, neighborhood, latitude, longitude, addressId } = location
    const [old, row] = [oldSofia, SOFIA_CATALOGUE].map(items => items.find(item => item.id === id))
    assert.equal(row.address, address, id)
    assert.equal(row.neighborhood, neighborhood, id)
    assert.equal(old.coordinates, null, id)
    const point = catalogueBoundCoordinates(row)
    assert.deepEqual([point.latitude, point.longitude], [latitude, longitude], id)
    assert.equal(point.method, addressId ? 'verified_official_address' : 'first_party_coordinates', id)
    assert.equal(point.addressId ?? null, addressId, id)
    assert.equal(point.source, addressId ? OFFICIAL_SOFIA_SOURCE_URL : row.verification.contact, id)
    assert.equal(catalogueBoundCoordinates({ ...row, address: address + ' A' }), null, id)
    assert.equal(catalogueBoundCoordinates({ ...row, coordinates: { ...point, latitude: longitude, longitude: latitude } }), null, id)
    const intent = { cityCode: '68134', category: row.category, browse: true, searchV2: true, requirements: [] }
    const [previousCard] = normalizeCatalogueBusinesses([old], intent, { now })
    const nearby = { ...intent, coordinates: { latitude, longitude }, radiusKm: 1 }
    const [card] = normalizeCatalogueBusinesses([row], nearby, { now })
    assert.ok(card, id)
    assert.deepEqual(normalizeCatalogueBusinesses([old], nearby, { now }), [], id)
    assert.deepEqual(normalizeCatalogueBusinesses([row], { ...nearby, coordinates: { latitude: latitude + .1, longitude } }, { now }), [], id)
    if (old.neighborhood !== neighborhood) {
      assert.deepEqual(normalizeCatalogueBusinesses([row], { ...intent, neighborhood: old.neighborhood }, { now }), [], id)
      assert.equal(normalizeCatalogueBusinesses([row], { ...intent, neighborhood }, { now })[0]?.id, id)
    }
    const [previousDetail, detail] = await Promise.all(handlers.map(async handler => {
      const result = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
      assert.equal(result.status, 200, id)
      return (await result.json()).business
    }))
    const priorProfile = catalogueProfileView(old, { now })
    const profile = catalogueProfileView(row, { now })
    for (const [surface, previous] of [[card, previousCard], [profile, priorProfile], [detail, previousDetail]]) {
      assert.equal(railDirections(previous), null, id)
      assert.equal(surface.locationStatus, 'verified_sofia', id)
      const directions = new URL(railDirections(surface))
      assert.equal(directions.href, businessDirectionsUrl(surface), id)
      assert.equal(directions.hostname, 'www.google.com', id)
      assert.equal(directions.searchParams.get('api'), '1', id)
      assert.equal(directions.searchParams.get('destination'), latitude + ',' + longitude, id)
      assert.equal(directions.searchParams.get('destination_place_id'), null, id)
      const map = new URL(businessMapUrl(surface))
      assert.equal(map.searchParams.get('marker'), latitude + ',' + longitude, id)
      assert.deepEqual(railExternalAction(surface, now), railExternalAction(previous, now), id)
      assert.deepEqual(surface.details.services, previous.details.services, id)
    }
    assert.deepEqual(card.availability, { status: 'external', slots: [] }, id)
  }
})
