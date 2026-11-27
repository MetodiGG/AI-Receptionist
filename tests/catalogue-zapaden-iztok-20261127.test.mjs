import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { VERIFIED_TINO_HLADILNIKA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-tino-hladilnika-20261127.mjs'
import { applyVerifiedHadzhiBakstonVisitPoints20261127 } from '../lib/discovery/catalogue-data/verified-hadzhi-bakston-visit-points-20261127.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-zapaden-iztok-20261127-scope.mjs'
import receipt from './fixtures/catalogue-zapaden-iztok-20261127.json' with { type: 'json' }
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue } from './catalogue-mitoart-nails-nadezhda-20261127-scope.mjs'

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const now = Date.parse('2026-11-27T12:00:00Z')
const byID = id => nextPriorCatalogue([SOFIA_CATALOGUE.find(row => row.id === id)])[0]
const offers = [
  { id: 'sofia-soma-masazhi-zapaden-park-block5b', category: 'health', subcategory: 'health-massage', postalId: '47965',
    point: { latitude: 42.701427, longitude: 23.281222 }, prices: [60], phone: '+359878444025', minutes: [60],
    enNames: ['Relaxation massage · 60 minutes'], enUnits: [''],
    caveat: /the rate is based on the length of the session/u, cover: '/business-cover-photos/go-soma-zapaden-park-20261127-v1.webp',
    photos: ['/service-photos/go-soma-relaxation-massage-20261127-v1.webp'] },
  { id: 'sofia-darita-iztok-lachezar-stanchev5', category: 'education', subcategory: 'education-art', postalId: '34655',
    point: { latitude: 42.665821, longitude: 23.356624 }, prices: [30, 40], phone: '+359887078927', minutes: [null, null],
    enNames: ['Group drawing lesson for children', 'One-to-one drawing lesson for children'],
    enUnits: ['one visit · 2 school periods', 'one lesson · 2 school periods'],
    caveat: /Arrange the day and a place in the group by phone/u, cover: '/business-cover-photos/go-darita-iztok-20261127-v1.webp',
    photos: ['/service-photos/go-darita-children-group-drawing-20261127-v1.webp',
      '/service-photos/go-darita-children-private-drawing-20261127-v1.webp'] },
  { id: 'sofia-tino-hair-hladilnika-paradisecenter100', category: 'hair', subcategory: 'hair-cut', postalId: '106136',
    point: { latitude: 42.657861, longitude: 23.315751 }, prices: [40], href: 'https://app.tinohair.com/', minutes: [30],
    enNames: ["Men's haircut"], enUnits: ['€30 on Wednesdays'],
    caveat: /Wednesday price is €30/u, cover: '/business-cover-photos/go-tino-hair-hladilnika-20261127-v1.webp',
    photos: ['/service-photos/go-tino-mens-haircut-20261127-v1.webp'] },
]
const noLive = () => assert.fail('Public catalogue requests must not call calendars, providers or booking systems')
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }

test('exact dated intake does not modify unrelated items or their booking or design code', () => {
  const changed = new Set([
    git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z'),
  ].flatMap(bytes => bytes.toString().split('\0').filter(Boolean)))
  const expected = [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort()
  assert.deepEqual([...changed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') &&
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
    assert.equal(sha(JSON.stringify(priorCatalogue(catalogue))), receipt.baselineCatalogueSha256)
    assert.equal(priorCatalogue(catalogue).length, atIntake.length - receipt.records.length)
  }
})

test('priority coverage reports separate newly added businesses from existing addresses', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), nextPriorCatalogue(SOFIA_CATALOGUE)].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  for (const [area, category, expected] of [
    ['Западен парк', 'health', [[0, 0], [1, 1]]], ['Изток', 'education', [[3, 1], [4, 2]]],
    ['Хаджи Димитър', 'consulting', [[0, 0], [1, 1]]], ['Бъкстон', 'pets', [[1, 0], [2, 1]]],
    ['Хладилника', 'hair', [[1, 0], [2, 1]]],
  ]) {
    assert.deepEqual(reports.map(report => {
      const row = [...report.neighborhoods, ...report.additionalNamedAreas].find(candidate => candidate.name === area)
      const cell = row.cells.find(x => x.categoryId === category)
      return [cell.count, cell.locatedCount]
    }), expected, area + '/' + category)
  }
  assert.equal(reports[1].counts.approvedBusinesses - reports[0].counts.approvedBusinesses, offers.length)
})

test('local API and profile preserve exact geography, localized prices, qualifications, and external handoff', async () => {
  const rows = offers.map(offer => byID(offer.id))
  const browse = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readCatalogue: async () => rows, readInternal: async () => [],
    getSlots: noLive, getBusiness: noLive, fetcher: noLive, claimBudget: noLive, readLinks: noLive,
    readPartnerPlaces: noLive, readBookablePlaces: noLive })
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true,
    now: () => now, findCatalogue: id => rows.find(row => row.id === id), readPartner: noLive })
  for (const [i, offer] of offers.entries()) {
    const row = rows[i], profile = catalogueProfileView(row, { now })
    assert.equal(row.coordinates.addressId, offer.postalId)
    assert.strictEqual(catalogueBoundCoordinates(row), row.coordinates)
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    const review = [...VERIFIED_TINO_HLADILNIKA_20261127_REVIEWS, ...BOOKING_PRICE_REVIEWS].find(item => item.id === row.id)
    assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, offer.prices.length)
    assert.equal(assessPricingReview(row, review, Date.parse('2026-12-28T00:00:00Z')).state, 'pending')
    const detail = await details(new Request('https://example.test/api/public/discovery/business/' + row.id, { headers }), row.id)
    assert.equal(detail.status, 200, row.id)
    const { business } = await detail.json()
    for (const locale of ['bg', 'en']) {
      const response = await browse(new Request('https://example.test/api/public/discovery', {
        method: 'POST', headers, body: JSON.stringify({ browse: true, category: offer.category, subcategory: offer.subcategory,
          locale, coordinates: { ...offer.point, consent: true }, radiusKm: 1 }),
      }))
      assert.equal(response.status, 200)
      const { results } = await response.json()
      assert.deepEqual(results.map(result => result.id), [row.id])
      assert.deepEqual(results[0].availability, { status: 'external', slots: [] })
      const handoff = offer.href ? { kind: 'form', href: offer.href } : { kind: 'phone', href: 'tel:' + offer.phone }
      for (const view of [results[0], business, profile]) {
        assert.equal(view.address, row.address)
        assert.deepEqual(railExternalAction(view, now), handoff)
        assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'),
          offer.point.latitude + ',' + offer.point.longitude)
      }
    }
    for (const view of [business, profile]) {
      assert.deepEqual(view.details.services.map(s => s.price), offer.prices)
      assert.deepEqual(view.details.services.map(s => s.durationMin), offer.minutes)
      assert.deepEqual(view.details.services.map(s => s.presentationEn.name), offer.enNames)
      assert.deepEqual(view.details.services.map(s => s.presentationEn.unit), offer.enUnits)
      assert.match(view.details.services[0].presentationEn.description, offer.caveat)
    }
  }
})

test('existing exact address corrections do not alter price, phone, website, appointments or approval', () => {
  const fixed = ['sofia-university-champions-hadzhi-dimitar135a', 'sofia-tobbys-grooming'].map(byID)
  const old = priorCatalogue(fixed)
  assert.deepEqual(applyVerifiedHadzhiBakstonVisitPoints20261127(old), fixed)
  assert.deepEqual(applyVerifiedHadzhiBakstonVisitPoints20261127(fixed), fixed)
  for (const [i, row] of fixed.entries()) {
    assert.match(new URL(businessDirectionsUrl(catalogueProfileView(row, { now }))).searchParams.get('destination'), /^42\.\d+,23\.\d+$/u)
    assert.strictEqual(catalogueBoundCoordinates(row), row.coordinates)
    assert.deepEqual({ ...row, address: old[i].address, neighborhood: old[i].neighborhood, coordinates: old[i].coordinates }, old[i])
    const otherBooking = { ...old[i], booking: { kind: 'phone', phone: '+359123456789' } }
    assert.strictEqual(applyVerifiedHadzhiBakstonVisitPoints20261127([otherBooking])[0], otherBooking)
  }
  assert.equal(fixed[0].coordinates.addressId, '50533')
  assert.equal(fixed[1].coordinates.latitude, old[1].coordinates.latitude)
  assert.equal(fixed[1].coordinates.longitude, old[1].coordinates.longitude)
})

test('all business and service illustrations render in the correct roles and are distinct compact WebP assets', async () => {
  const images = []
  for (const offer of offers) {
    const view = catalogueProfileView(byID(offer.id), { now })
    assert.deepEqual(businessCoverPhotoSources(view), [offer.cover])
    images.push([offer.cover, 960, 720])
    for (const [i, service] of view.details.services.entries()) {
      const image = publicDetailServiceThumbnail(service, { business: view })
      assert.equal(image.src, offer.photos[i])
      assert.equal(image.source, 'illustrative')
      images.push([image.src, 480, 480])
    }
  }
  const fingerprints = await Promise.all(images.map(async ([path, width, height]) => {
    const bytes = readFileSync(new URL('public' + path, root)), meta = await sharp(bytes).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', width, height], path)
    assert.ok(bytes.length < 115_000, path)
    return fingerprintDiscoveryPhoto(bytes)
  }))
  for (const [i, left] of fingerprints.entries()) for (const right of fingerprints.slice(i + 1)) {
    assert.equal(compareDiscoveryPhotos(left, right), null)
  }
})
