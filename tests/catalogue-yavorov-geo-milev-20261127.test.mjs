import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as raw, SOFIA_CATALOGUE as current } from '../lib/discovery/sofia-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import { yavorovAllowsPath, yavorovPriorCatalogue, yavorovPriorSource } from './catalogue-yavorov-geo-milev-20261127-scope.mjs'
import { ivonAllowsPath, ivonPriorCatalogue, ivonPriorSource } from './catalogue-ivon-gorna-banya-mladost3-20261127-scope.mjs'
import review from '../docs/catalogue-coverage/yavorov-geo-milev-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-yavorov-geo-milev-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url), now = Date.parse('2026-11-27T12:00:00Z')
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = rows => sha(JSON.stringify(rows))
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [raw, current].map(ivonPriorCatalogue)
const id = review.business.id, phone = review.business.phone
const row = SOFIA_CATALOGUE.find(record => record.id === id)
const { latitude, longitude } = review.business.firstPartyEntrance

test('the only scope is the exact Yavorov row, exact asset bytes and reviewed catalogue sources', () => {
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const stagePaths = new Set([...changed, ...added])
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (stagePaths.has(path) || !ivonAllowsPath(path))).sort(),
    [...changed, ...added].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path), after = ivonPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(before), sha(after)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.deepEqual(yavorovPriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(yavorovPriorSource(path, tampered), tampered, path)
    assert.ok(yavorovAllowsPath(path), path)
  }
  for (const path of added) assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(digest(rows), receipt.currentCatalogueSha256)
    assert.equal(digest(yavorovPriorCatalogue(rows)), receipt.baselineCatalogueSha256)
  }
  assert.throws(() => yavorovPriorCatalogue([{ ...row, address: 'София, ул. Гео Милев 26' }]), /Unreviewed verified Yavorov/u)
})

test('published enrolment is exactly one provider, two relevant services and no unverified rates or slots', async () => {
  assert.deepEqual(assessPricingReview(row, BOOKING_PRICE_REVIEWS.find(record => record.id === id), now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-27', reviewedPriceCount: 0,
  })
  assert.equal(row.address, review.business.street)
  assert.deepEqual(row.services.map(service => [service.price ?? null, service.durationMin ?? null]), [[null, null], [null, null]])
  assert.deepEqual(row.services.map(service => ['education-singing', 'education-instruments', 'education-dance']
    .map(category => matchesSubcategory(service, category))), [[true, false, false], [false, true, false]])
  const audits = [yavorovPriorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cells = audits.map(report => [...report.neighborhoods, ...report.additionalNamedAreas]
    .find(area => area.name === review.business.neighborhood).cells.find(cell => cell.categoryId === 'education'))
  assert.deepEqual(cells.map(cell => [cell.count, cell.locatedCount]), [[5, 1], [6, 2]])
  assert.ok(cells[1].locatedBusinessIds.includes(id))

  const forbidden = () => assert.fail('A public directory read must not contact providers or check internal booking')
  const handler = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true, allowAttempt: () => true,
    now: DateTime.fromMillis(now), readInternal: async () => [], readCatalogue: async () => [row],
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden })
  const search = await handler(new Request('https://gorez.test/api/public/discovery', { method: 'POST',
    headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ locale: 'bg', category: 'education', browse: true, cityCode: '68134',
      coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }),
  }))
  assert.equal(search.status, 200)
  const card = (await search.json()).results.find(result => result.id === id)
  assert.ok(card)
  assert.deepEqual(card.availability, { status: 'external', slots: [] })
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue: key => key === id ? row : null,
    now: () => now, allowAttempt: () => true })
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const profile = catalogueProfileView(row, { now })
  for (const presentation of [card, (await response.json()).business, profile]) {
    assert.deepEqual(railExternalAction(presentation, now), { kind: 'phone', href: 'tel:' + phone })
    const route = new URL(businessDirectionsUrl(presentation))
    assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
    assert.ok(!route.searchParams.has('destination_place_id'))
  }
})

test('new WebPs are exact per service, visually distinct, small and never use the cover in details', async () => {
  const business = catalogueProfileView(row, { now })
  const [cover] = businessCoverPhotoSources(business)
  const detail = business.details.services.map(service => publicDetailServiceThumbnail(service, { business, coverSources: [cover] }))
  assert.deepEqual(detail.map(photo => photo?.src), [
    '/service-photos/go-yavorov-geo-milev-child-singing-20261127-v1.webp',
    '/service-photos/go-yavorov-geo-milev-synthesizer-20261127-v1.webp',
  ])
  const publicDirectory = fileURLToPath(new URL('../public', import.meta.url))
  const images = await Promise.all([cover, ...detail.map(({ src }) => src)].map(async src =>
    fingerprintDiscoveryPhoto(await readDiscoveryImage(publicDirectory, src))))
  for (const [i, a] of images.entries()) for (const b of images.slice(i + 1)) {
    assert.equal(compareDiscoveryPhotos(a, b), null)
  }
  for (const asset of review.provenance.assets) {
    const bytes = readFileSync(new URL(asset.file, cwd))
    assert.equal(sha(bytes), asset.optimizedSha256)
    assert.equal(bytes.length, asset.size)
    assert.ok(bytes.length < 45 * 1024)
  }
})
