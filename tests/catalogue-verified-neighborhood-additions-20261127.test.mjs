import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { DateTime } from 'luxon'
import report from '../docs/catalogue-coverage/verified-neighborhood-additions-20261127.json' with { type: 'json' }
import seal from './fixtures/catalogue-verified-neighborhood-additions-20261127.json' with { type: 'json' }
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { SOFIA_CATALOGUE, RAW_SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { neighborhoodAdditionsAllowsFileChange, neighborhoodAdditionsAllowsNewFile,
  neighborhoodAdditionsPriorCatalogue, neighborhoodAdditionsPriorSource } from './catalogue-verified-neighborhood-additions-20261127-scope.mjs'

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const hash = row => sha(JSON.stringify(row))
const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const ids = new Set(report.verified.map(row => row.id))
const preceding = neighborhoodAdditionsPriorCatalogue(SOFIA_CATALOGUE)
const findCatalogue = id => SOFIA_CATALOGUE.find(row => row.id === id)

test('the wave adds only sealed profiles, receipt entries, translations and matching artwork assignments', () => {
  assert.equal(seal.baseline, report.baseCommit)
  const { changed, added } = seal
  const observed = [...new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', seal.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort()
  assert.deepEqual(observed, [...Object.keys(changed), ...Object.keys(added)].sort())
  assert.ok(!observed.some(path => /^(?:app|components|public|supabase)\//u.test(path)))
  for (const [path, approval] of Object.entries(changed)) {
    const current = readFileSync(new URL(path, root)), original = git('show', seal.baseline + ':' + path)
    assert.equal(sha(original), approval.before, path)
    assert.equal(sha(current), approval.after, path)
    assert.ok(neighborhoodAdditionsAllowsFileChange(path), path)
    assert.deepEqual(neighborhoodAdditionsPriorSource(path, current), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(neighborhoodAdditionsPriorSource(path, tampered), tampered, path)
  }
  for (const [path, expected] of Object.entries(added)) {
    assert.equal(sha(readFileSync(new URL(path, root))), expected, path)
    assert.ok(neighborhoodAdditionsAllowsNewFile(path), path)
  }
  assert.equal(ids.size, report.newDistinctBusinesses)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(hash(neighborhoodAdditionsPriorCatalogue(rows)), seal.baselineCatalogueSha256)
    assert.equal(rows.length - preceding.length, report.newDistinctBusinesses)
    const newRows = rows.filter(row => ids.has(row.id))
    assert.deepEqual(newRows.map(row => row.id).sort(), [...ids].sort())
    for (const row of newRows) {
      assert.equal(hash(row), seal.records.find(item => item.id === row.id)?.sha256, row.id)
      assert.throws(() => neighborhoodAdditionsPriorCatalogue([row, row]), /Duplicate verified neighborhood additions/u)
      assert.throws(() => neighborhoodAdditionsPriorCatalogue([{ ...row, phone: null }]), /Unreviewed verified neighborhood additions/u)
    }
  }
})

test('each verified listing opens a previously empty Sofia location/category cell', () => {
  const scopes = [preceding, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const counts = report.coverage
  const values = get => scopes.map(get)
  assert.deepEqual(values(audit => audit.counts.approvedBusinesses), counts.approvedSofiaBusinesses)
  assert.deepEqual(values(audit => audit.counts.premisesWithBoundCoordinates), counts.premisesWithBoundPoint)
  assert.deepEqual(values(audit => audit.counts.zeroCells), counts.emptyPhysicalCells)
  assert.deepEqual(values(audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].flatMap(x => x.cells).filter(c => c.locatedCount === 0).length), counts.emptyLocatedCells)
  const ownerHost = url => new URL(url).hostname.replace(/^www\./u, '')
  for (const e of report.verified) {
    const branch = findCatalogue(e.id)
    assert.ok(branch, e.id)
    assert.ok(!PUBLIC_CATALOGUE.some(row => row.id !== e.id && (
      ownerHost(row.website) === ownerHost(branch.website) || row.address === branch.address || row.phone && row.phone === branch.phone)), e.id)
    const cell = audit => audit.neighborhoods.find(x => x.name === e.neighborhood).cells.find(x => x.categoryId === e.category)
    assert.deepEqual(values(audit => [cell(audit).count, cell(audit).locatedCount]), [[0, 0], [1, 1]])
    assert.deepEqual(cell(scopes[1]).locatedBusinessIds, [e.id])
  }
})

test('public browse, directions, price review and distinct detail pictures keep exact branch facts', async () => {
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue, now: () => now, allowAttempt: () => true })
  const browse = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
  })
  for (const e of report.verified) {
    const row = findCatalogue(e.id)
    assert.equal(row.address, e.address)
    const point = catalogueBoundCoordinates(row)
    assert.equal(point.method, e.point.method)
    assert.deepEqual([point.latitude, point.longitude], [e.point.latitude, e.point.longitude])
    assert.equal(point.addressId ?? null, e.point.addressId ?? null)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + ' А' }), null)
    const review = BOOKING_PRICE_REVIEWS.find(rev => rev.id === e.id)
    assert.ok(review)
    assert.equal(pricingIdentity(row), review.inventoryIdentity)
    assert.equal(assessPricingReview(row, review, now).state, e.pricingState)
    assert.equal(assessPricingReview({ ...row, services: [] }, review, now).state, 'pending')
    assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-19T00:00:00Z')), null)
    const profile = catalogueProfileView(row, { now })
    const destination = new URL(businessDirectionsUrl(profile))
    assert.equal(destination.searchParams.get('destination'), [point.latitude, point.longitude].join(','))
    const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + e.id), e.id)
    assert.equal(response.status, 200)
    const { business } = await response.json()
    assert.equal(businessDirectionsUrl(business), destination.href)
    assert.equal(railExternalAction(business, now).href, e.booking)
    assert.equal(business.details.services.length, e.services.length)
    const covers = businessCoverPhotoSources(profile), selected = new Set()
    assert.ok(covers.length > 0)
    for (const [index, expected] of e.services.entries()) {
      const service = business.details.services[index]
      const candidate = publicDetailServiceThumbnail(service, { business, coverSources: covers })
      assert.equal(service.name, expected.name)
      assert.equal(service.presentationEn.name, expected.en)
      assert.ok(service.presentationEn.description)
      assert.equal(service.price, expected.amount)
      assert.equal(service.durationMin, expected.durationMin ?? null)
      assert.equal(service.priceSourceUrl, expected.priceSource ?? null)
      assert.equal(candidate.src, expected.photo)
      assert.equal(candidate.source, 'illustrative')
      assert.ok(existsSync(new URL('public' + candidate.src, root)))
      assert.ok(!matchesBusinessCoverPhoto(candidate.src, covers))
      assert.ok(!selected.has(candidate.src))
      selected.add(candidate.src)
    }
    for (const scope of [{ cityCode: '68134', neighborhood: e.neighborhood },
      { coordinates: { latitude: point.latitude, longitude: point.longitude, consent: true }, radiusKm: 1 }]) {
      const body = { category: e.category, subcategory: e.subcategory, browse: true, locale: 'bg', ...scope }
      const request = new Request('https://gorez.test/api/public/discovery', {
        method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body),
      })
      const home = await browse(request)
      assert.equal(home.status, 200, e.id)
      const found = (await home.json()).results.find(result => result.id === row.id)
      assert.ok(found, e.id)
      assert.equal(businessDirectionsUrl(found), destination.href)
    }
  }
})
