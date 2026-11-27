import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { applySofiaNorthDogBranchPointNov27 } from '../lib/discovery/catalogue-data/sofia-north-dog-branch-point-nov27.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import proof from '../docs/catalogue-coverage/north-dog-branch-point-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-north-dog-branch-point-20261127.json' with { type: 'json' }
import { northDogAllowsFileChange, northDogAllowsNewFile, northDogAllowsPath,
  northDogPriorCatalogue, northDogPriorSource } from './catalogue-north-dog-branch-point-20261127-scope.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { yavorovAllowsPath, yavorovPriorCatalogue, yavorovPriorSource } from './catalogue-yavorov-geo-milev-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = data => createHash('sha256').update(data).digest('hex')
const rowSha = row => sha(JSON.stringify(row))
const ownsNorthDogPath = path => Object.hasOwn(receipt.changed, path) || Object.hasOwn(receipt.added, path)
const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const id = 'sofia-north-dog-grooming-vrabnitsa637', neighborhood = 'Връбница 2'
const phone = '+359898776598'
const [latitude, longitude] = [42.738087, 23.297335]
const address = 'София, ж.к. Връбница 2, бл. 637, до паркинга на Северен парк'
const website = 'https://sites.google.com/view/northdoggrooming'
const contact = website + '/контакти'
const now = Date.parse('2026-11-27T12:00:00Z')
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(yavorovPriorCatalogue)
const prior = northDogPriorCatalogue(SOFIA_CATALOGUE)
const [before, after] = [prior, SOFIA_CATALOGUE].map(rows => rows.find(row => row.id === id))

test('the North Dog receipt pins only exact coordinate-related production paths and row bytes', () => {
  assert.equal(proof.baseCommit, receipt.baseline)
  assert.equal(receipt.location.id, id)
  assert.deepEqual(receipt.records, [])
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  const reviewedPaths = new Set([...changed, ...added])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (reviewedPaths.has(path) || !yavorovAllowsPath(path))).sort(),
    [...changed, ...added].sort())
  for (const path of changed) {
    const earlier = git('show', receipt.baseline + ':' + path)
    const latest = yavorovPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(earlier), sha(latest)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.ok(northDogAllowsFileChange(path) && catalogueIntakeAllowsPath(path), path)
    assert.deepEqual(northDogPriorSource(path, latest), earlier, path)
    const tampered = Buffer.concat([latest, Buffer.from('\n')])
    assert.equal(northDogPriorSource(path, tampered), tampered, path)
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(paths(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
    assert.ok(northDogAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(northDogAllowsFileChange(path), false, path)
  }
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
    'lib/discovery/catalogue-search.mjs', 'app/layout.js', 'public/logo.svg', 'package.json', 'supabase/config.toml']) {
    assert.equal(ownsNorthDogPath(path), false, path)
    assert.equal(northDogAllowsPath(path), yavorovAllowsPath(path), path)
  }
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(rows.length, northDogPriorCatalogue(rows).length)
    assert.equal(rows.filter(row => row.id === id).length, 1)
    assert.equal(rowSha(rows), receipt.currentCatalogueSha256)
    assert.equal(rowSha(northDogPriorCatalogue(rows)), receipt.baselineCatalogueSha256)
  }
  assert.equal(northDogPriorCatalogue([before])[0], before)
  assert.throws(() => northDogPriorCatalogue([before, after]), /Duplicate North Dog branch point/u)
  assert.throws(() => northDogPriorCatalogue([{ ...after, address: after.address + ', вх. Б' }]),
    /Unreviewed North Dog branch point/u)
})

test('the owner marker upgrades exactly one existing address and never overwrites newer branch facts', () => {
  assert.ok(before && after)
  assert.deepEqual([before.address, before.neighborhood, before.website, before.verification.contact, before.phone],
    [address, neighborhood, website, contact, phone])
  assert.deepEqual(before.booking, { kind: 'phone', phone })
  assert.equal(before.coordinates, null)
  assert.deepEqual([rowSha(before), rowSha(after)], [receipt.location.before, receipt.location.after])
  const point = { latitude, longitude, method: 'first_party_coordinates', source: contact, sourceAddress: address }
  assert.deepEqual(after, { ...before, coordinates: point })
  assert.deepEqual(catalogueBoundCoordinates(after), point)
  assert.equal(catalogueBoundCoordinates({ ...after, address: address.replace('637', '638') }), null)
  assert.equal(catalogueBoundCoordinates({ ...after, coordinates: { ...point, latitude: longitude, longitude: latitude } }), null)
  assert.deepEqual(applySofiaNorthDogBranchPointNov27([before]), [after])
  assert.equal(applySofiaNorthDogBranchPointNov27([after])[0], after)
  for (const change of [{ id: id + '-other' }, { cityCode: '11884' }, { neighborhood: 'Връбница 1' },
    { category: 'health' }, { locationKind: 'service_area' }, { address: address.replace('637', '638') },
    { website: 'https://other.test/' }, { phone: '+359898876598' }, { booking: { kind: 'form', url: 'https://other.test/book' } },
    { booking: { kind: 'phone', phone: '+359898876598' } },
    { verification: { ...before.verification, status: 'draft' } },
    { verification: { ...before.verification, contact: 'https://other.test/' } },
    { verification: { ...before.verification, booking: { ...before.verification.booking, url: contact } } },
    { coordinates: { ...point, latitude: latitude + .01 } }]) {
    const changed = { ...before, ...change }
    assert.equal(applySofiaNorthDogBranchPointNov27([changed])[0], changed)
  }
  const [review] = proof.verified
  assert.deepEqual(review.point, { latitude, longitude, method: 'first_party_coordinates' })
  assert.deepEqual([rowSha(before), rowSha(after), pricingIdentity(before), pricingIdentity(after)], [
    review.identity.beforeRowSha256, review.identity.afterRowSha256,
    review.identity.unchangedPricingSha256, review.identity.unchangedPricingSha256,
  ])
  assert.notEqual(review.mapIdentityEvidence.viewportNotUsed.longitude, longitude)
})

test('the report measures a nearby coverage improvement rather than claiming a new business', () => {
  const audit = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const grids = audit.map(report => [...report.neighborhoods, ...report.additionalNamedAreas])
  const cells = grids.map(areas => areas.flatMap(area => area.cells))
  const cell = areas => areas.find(area => area.name === neighborhood).cells.find(item => item.categoryId === 'pets')
  assert.deepEqual(proof.coverage, {
    targetPerQuarterCategory: 30,
    checkedCells: cells[1].length,
    sourceRecords: audit.map(report => report.counts.sourceRecords),
    approvedSofiaBusinesses: audit.map(report => report.counts.approvedBusinesses),
    premisesWithBoundPoint: audit.map(report => report.counts.premisesWithBoundCoordinates),
    emptyPhysicalCells: cells.map(items => items.filter(item => item.count === 0).length),
    emptyLocatedCells: cells.map(items => items.filter(item => item.locatedCount === 0).length),
    locatedCellsAtTarget: cells.map(items => items.filter(item => item.locatedTargetMet).length),
    selectedCell: {
      neighborhood, category: 'pets', physical: grids.map(areas => cell(areas).count),
      located: grids.map(areas => cell(areas).locatedCount),
    },
  })
  assert.deepEqual(cell(grids[1]).locatedBusinessIds, [id])
  assert.deepEqual([proof.newDistinctBusinesses, proof.submittedBookings, proof.productionWrites], [0, 0, 0])
})

test('nearby listings, profile and details use one verified point without changing prices or phone booking', async () => {
  const intent = { cityCode: '68134', category: 'pets', browse: true, searchV2: true, requirements: [] }
  const nearby = { ...intent, coordinates: { latitude, longitude }, radiusKm: 1 }
  assert.deepEqual(normalizeCatalogueBusinesses([before], nearby, { now }), [])
  const [beforeCard] = normalizeCatalogueBusinesses([before], { ...intent, neighborhood }, { now })
  const [afterCard] = normalizeCatalogueBusinesses([after], nearby, { now })
  const details = row => createPublicBusinessDetailsHandler({
    config: { enabled: true }, findCatalogue: candidate => candidate === id ? row : null, now: () => now, allowAttempt: () => true,
  })
  const [beforeDetails, afterDetails] = await Promise.all([before, after].map(async row => {
    const response = await details(row)(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
    assert.equal(response.status, 200)
    return (await response.json()).business
  }))
  for (const [previous, updated] of [[beforeCard, afterCard], [beforeDetails, afterDetails],
    [catalogueProfileView(before, { now }), catalogueProfileView(after, { now })]]) {
    assert.equal(previous.id, id)
    assert.equal(updated.id, id)
    assert.equal(railDirections(previous), null)
    assert.equal(updated.locationStatus, 'verified_sofia')
    const route = new URL(railDirections(updated))
    assert.equal(route.href, businessDirectionsUrl(updated))
    assert.equal(route.hostname, 'www.google.com')
    assert.equal(route.searchParams.get('api'), '1')
    assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
    assert.equal(route.searchParams.has('destination_place_id'), false)
    assert.equal(new URL(businessMapUrl(updated)).searchParams.get('marker'), latitude + ',' + longitude)
    assert.deepEqual(updated.details.services, previous.details.services)
    assert.deepEqual(railExternalAction(updated, now), { kind: 'phone', href: 'tel:' + phone })
    assert.deepEqual(railExternalAction(updated, now), railExternalAction(previous, now))
  }
  assert.deepEqual(afterCard.availability, { status: 'external', slots: [] })
})
