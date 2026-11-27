import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyVerifiedSofiaAutoFollowups20261127 } from '../lib/discovery/catalogue-data/verified-sofia-auto-followups-20261127.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-zaharna-suhata-20261127-scope.mjs'
import receipt from './fixtures/catalogue-zaharna-suhata-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue } from './catalogue-lozenets-west-north-20261127-scope.mjs'

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const now = Date.parse('2026-11-27T12:00:00Z')
const cases = [
  { id: 'sofia-galabov-legal-zaharna-fabrika-block31a', category: 'consulting', subcategory: 'consulting-legal',
    area: 'Захарна фабрика', postalId: '53464', amount: 0, point: { latitude: 42.716264, longitude: 23.287302 },
    nameEn: 'Initial legal consultation', condition: /first|initial.+free/i, unit: 'initial consultation only',
    kind: 'form', href: 'https://galabov.legal/bg/kontakti',
    cover: '/business-cover-photos/go-galabov-zaharna-fabrika-20261127-v1.webp',
    servicePhoto: '/service-photos/go-galabov-initial-legal-consultation-20261127-v1.webp' },
  { id: 'sofia-kihon-suhata-reka-botevgradsko50', category: 'fitness', subcategory: 'fitness-martial-arts',
    area: 'Сухата река', postalId: '112386', amount: 60, point: { latitude: 42.699759, longitude: 23.371450 },
    nameEn: 'Group karate and jujitsu training', condition: /additional family member pays €40/i, unit: 'monthly fee',
    kind: 'phone', href: 'tel:+359894311026',
    cover: '/business-cover-photos/go-kihon-suhata-reka-20261127-v1.webp',
    servicePhoto: '/service-photos/go-kihon-group-karate-jujitsu-20261127-v1.webp' },
]
const businessById = id => SOFIA_CATALOGUE.find(row => row.id === id)
const noLiveCalls = () => assert.fail('Public catalogue checks must not touch live calendars, booking, or providers')
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }

test('review receipts cover only two new rows, two documented corrections, and exact non-test file changes', () => {
  const expected = [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort()
  const changed = new Set([
    git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z'),
  ].flatMap(bytes => bytes.toString().split('\0').filter(Boolean)))
  assert.deepEqual([...changed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (Object.hasOwn(receipt.changed, path) || Object.hasOwn(receipt.added, path) || !(nextChange(path) || nextNew(path)))).sort(), expected)
  for (const path of Object.keys(receipt.changed)) {
    const before = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path, readFileSync(new URL(path, root))), before, path)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(allowsNewFile(path), true, path)
  for (const catalogue of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const atIntake = nextPriorCatalogue(catalogue)
    assert.equal(sha(JSON.stringify(atIntake)), receipt.currentCatalogueSha256)
    const previous = priorCatalogue(catalogue)
    assert.equal(sha(JSON.stringify(previous)), receipt.baselineCatalogueSha256)
    assert.equal(previous.length, atIntake.length - 2)
  }
  assert.throws(() => priorCatalogue([{ ...businessById('sofia-serviz-petkov'), website: 'https://example.org/' }]), /Unreviewed Sofia auto/u)
})

test('new exact premises cover two previously empty category cells, with a separate correction for an existing auto centre', () => {
  const options = { now, target: 30 }
  const reports = [priorCatalogue(SOFIA_CATALOGUE), nextPriorCatalogue(SOFIA_CATALOGUE)].map(rows => catalogueCoverageReport(rows, options))
  for (const [area, category] of [...cases.map(c => [c.area, c.category]), ['Карпузица', 'auto_repair']]) {
    assert.deepEqual(reports.map(report => {
      const row = [...report.neighborhoods, ...report.additionalNamedAreas].find(x => x.name === area)
      const cell = row.cells.find(x => x.categoryId === category)
      return [cell.count, cell.locatedCount]
    }), [[0, 0], [1, 1]], area + '/' + category)
  }
})

test('real fee conditions and the same branch directions survive public browse, details and profile views in BG and EN', async () => {
  const rows = cases.map(item => businessById(item.id))
  const browse = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readCatalogue: async () => rows,
    readInternal: async () => [], getSlots: noLiveCalls, getBusiness: noLiveCalls, fetcher: noLiveCalls,
    claimBudget: noLiveCalls, readLinks: noLiveCalls, readPartnerPlaces: noLiveCalls, readBookablePlaces: noLiveCalls,
  })
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true,
    now: () => now, findCatalogue: id => rows.find(row => row.id === id), readPartner: noLiveCalls })
  for (const [index, item] of cases.entries()) {
    const row = rows[index], profile = catalogueProfileView(row, { now })
    assert.equal(row.coordinates.addressId, item.postalId)
    assert.equal(catalogueBoundCoordinates(row), row.coordinates)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + ', друг вход' }), null)
    const review = BOOKING_PRICE_REVIEWS.find(record => record.id === row.id)
    assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, 1)
    assert.equal(assessPricingReview(row, review, Date.parse('2026-12-28T00:00:00Z')).state, 'pending')
    const detail = await details(new Request('https://example.test/api/public/discovery/business/' + row.id, { headers }), row.id)
    assert.equal(detail.status, 200)
    const { business: detailBusiness } = await detail.json()
    for (const locale of ['bg', 'en']) {
      const response = await browse(new Request('https://example.test/api/public/discovery', {
        method: 'POST', headers, body: JSON.stringify({ browse: true, category: item.category, subcategory: item.subcategory,
          locale, coordinates: { ...item.point, consent: true }, radiusKm: 1 }),
      }))
      assert.equal(response.status, 200)
      const { results } = await response.json()
      assert.deepEqual(results.map(result => result.id), [row.id], item.id)
      assert.deepEqual(results[0].availability, { status: 'external', slots: [] })
      for (const view of [results[0], detailBusiness, profile]) {
        assert.equal(view.address, row.address)
        assert.deepEqual(railExternalAction(view, now), { kind: item.kind, href: item.href })
        assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'),
          item.point.latitude + ',' + item.point.longitude)
      }
    }
    for (const view of [detailBusiness, profile]) {
      assert.equal(view.details.services.length, 1)
      const [service] = view.details.services
      assert.equal(service.price, item.amount)
      assert.equal(service.currency, 'EUR')
      assert.equal(service.presentationEn.name, item.nameEn)
      assert.equal(service.presentationEn.unit, item.unit)
      assert.match(service.presentationEn.description, item.condition)
    }
  }
})

test('existing auto follow-ups preserve booking and refuse to overwrite a changed or unrelated address or pin', () => {
  const fixed = ['sofia-sarafovi-auto', 'sofia-serviz-petkov'].map(businessById)
  const original = priorCatalogue(fixed)
  assert.deepEqual(applyVerifiedSofiaAutoFollowups20261127(original), fixed)
  assert.deepEqual(applyVerifiedSofiaAutoFollowups20261127(fixed), fixed)
  for (const [index, row] of original.entries()) {
    assert.deepEqual(fixed[index].booking, row.booking)
    assert.deepEqual(fixed[index].verification, row.verification)
    const changedAddress = { ...row, address: row.address + 'Б' }
    assert.equal(applyVerifiedSofiaAutoFollowups20261127([changedAddress])[0], changedAddress)
  }
  const [sarafovi, petkov] = fixed
  assert.equal(sarafovi.coordinates.addressId, original[0].coordinates.addressId)
  assert.deepEqual(sarafovi.services, original[0].services)
  assert.equal(petkov.neighborhood, null)
  assert.equal(catalogueBoundCoordinates(petkov), petkov.coordinates)
  assert.equal(petkov.services.filter(service => service.price).length, 1)
  assert.equal(petkov.services.find(service => service.price).price.amount, 32)
  assert.equal(assessPricingReview(petkov, BOOKING_PRICE_REVIEWS.find(review => review.id === petkov.id), now).state, 'reviewed')
})

test('two branch covers and two detail photos are optimised, correctly attributed, and visually distinct', async () => {
  const files = []
  for (const item of cases) {
    const profile = catalogueProfileView(businessById(item.id), { now })
    assert.deepEqual(businessCoverPhotoSources(profile), [item.cover])
    const photo = publicDetailServiceThumbnail(profile.details.services[0], { business: profile })
    assert.equal(photo.src, item.servicePhoto)
    assert.equal(photo.source, 'illustrative')
    files.push([item.cover, 960, 720], [item.servicePhoto, 480, 480])
  }
  const fingerprints = await Promise.all(files.map(async ([path, width, height]) => {
    const bytes = readFileSync(new URL('public' + path, root)), meta = await sharp(bytes).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', width, height], path)
    assert.ok(bytes.length < 115_000, path)
    return fingerprintDiscoveryPhoto(bytes)
  }))
  for (const [index, first] of fingerprints.entries()) for (const other of fingerprints.slice(index + 1)) {
    assert.equal(compareDiscoveryPhotos(first, other), null)
  }
})
