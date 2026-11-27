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
import { applyVerifiedWestSchoolSalonPoints20261127 } from '../lib/discovery/catalogue-data/verified-west-school-salon-points-20261127.mjs'
import { applyVerifiedNadezhdaPuzzleVisitPoint20261127 } from '../lib/discovery/catalogue-data/verified-nadezhda-puzzle-visit-point-20261127.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-lozenets-west-north-20261127-scope.mjs'
import receipt from './fixtures/catalogue-lozenets-west-north-20261127.json' with { type: 'json' }

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const now = Date.parse('2026-11-27T12:00:00Z')
const fromCatalogue = id => SOFIA_CATALOGUE.find(row => row.id === id)
const salon = fromCatalogue('sofia-sisters-of-dogs-lozenets-tachev18')
const malta = fromCatalogue('sofia-malta-ovcha-kupel426')
const sourceTariff = 'https://sistersofdogs.com/uslugi-i-ceni'
const noLive = () => assert.fail('Static browse and detail requests must not call live providers')
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }

test('the intake is restricted to the exact new inventory, source and media; only documented existing rows change', () => {
  const changed = new Set([
    git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z'),
  ].flatMap(bytes => bytes.toString().split('\0').filter(Boolean)))
  const expected = [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort()
  assert.deepEqual([...changed].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(), expected)
  for (const path of Object.keys(receipt.changed)) {
    const before = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(before), receipt.changed[path].before)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path, readFileSync(new URL(path, root))), before)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(allowsNewFile(path), true, path)
  for (const catalogue of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(catalogue)), receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(catalogue))), receipt.baselineCatalogueSha256)
    assert.equal(priorCatalogue(catalogue).length, catalogue.length - receipt.records.length)
  }
})

test('the new salon and the existing Malta point improve distinct category cells without counting an unchanged business as new', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  for (const [name, category, counts] of [
    ['Лозенец', 'pets', [[2, 2], [3, 3]]],
    ['Овча купел 1', 'hair', [[1, 0], [1, 1]]],
    ['Надежда 1', 'hair', [[0, 0], [1, 1]]],
  ]) {
    assert.deepEqual(reports.map(report => {
      const area = [...report.neighborhoods, ...report.additionalNamedAreas].find(row => row.name === name)
      const cell = area.cells.find(item => item.categoryId === category)
      return [cell.count, cell.locatedCount]
    }), counts, name)
  }
  assert.equal(reports[1].counts.approvedBusinesses - reports[0].counts.approvedBusinesses, receipt.records.length)
})

test('confirmed dog grooming prices are returned for the exact salon; route and booking are consistent and external', async () => {
  assert.equal(salon.coordinates.addressId, '2678')
  assert.strictEqual(catalogueBoundCoordinates(salon), salon.coordinates)
  const profile = catalogueProfileView(salon, { now })
  const review = BOOKING_PRICE_REVIEWS.find(receipt => receipt.id === salon.id)
  assert.equal(assessPricingReview(salon, review, now).reviewedPriceCount, 2)
  assert.equal(assessPricingReview(salon, review, Date.parse('2026-12-28T00:00:00Z')).state, 'pending')
  const browse = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readCatalogue: async () => [salon],
    readInternal: async () => [], getSlots: noLive, getBusiness: noLive, fetcher: noLive,
    claimBudget: noLive, readLinks: noLive, readPartnerPlaces: noLive, readBookablePlaces: noLive,
  })
  const detail = createPublicBusinessDetailsHandler({ config: { enabled: true }, allowAttempt: () => true,
    now: () => now, findCatalogue: id => id === salon.id ? salon : null, readPartner: noLive })
  const response = await detail(new Request('https://example.test/api/public/discovery/business/' + salon.id, { headers }), salon.id)
  assert.equal(response.status, 200)
  const { business: details } = await response.json()
  for (const locale of ['bg', 'en']) {
    const reply = await browse(new Request('https://example.test/api/public/discovery', {
      method: 'POST', headers, body: JSON.stringify({ browse: true, category: 'pets', subcategory: 'pets-dogs', locale,
        coordinates: { latitude: 42.672174, longitude: 23.334015, consent: true }, radiusKm: 1 }),
    }))
    assert.equal(reply.status, 200)
    const { results } = await reply.json()
    assert.deepEqual(results.map(result => result.id), [salon.id])
    assert.deepEqual(results[0].availability, { status: 'external', slots: [] })
    for (const view of [results[0], details, profile]) {
      assert.equal(view.address, salon.address)
      assert.deepEqual(railExternalAction(view, now), { kind: 'phone', href: 'tel:+359889901096' })
      assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'), '42.672174,23.334015')
    }
  }
  for (const view of [details, profile]) {
    const services = view.details.services
    assert.deepEqual(services.map(row => row.price), [30, 7])
    assert.ok(services.every(row => row.priceSourceUrl === sourceTariff && row.presentationEn.unit === 'including VAT'))
    assert.match(services[0].presentationEn.name, /short-haired dog up to 4 kg/u)
    assert.match(services[0].presentationEn.description, /extra.+€25 per hour/u)
    assert.equal(services[1].presentationEn.description, 'For dogs of all sizes.')
  }
})

test('an existing approved listing obtains only its reviewed address pin, and contradictory school pin remains unresolved', () => {
  const [old] = priorCatalogue([malta])
  const expectedPoint = { latitude: 42.688460, longitude: 23.251085 }
  assert.equal(malta.coordinates.addressId, '102076')
  assert.equal(malta.coordinates.latitude, expectedPoint.latitude)
  assert.equal(malta.coordinates.longitude, expectedPoint.longitude)
  assert.deepEqual({ ...malta, coordinates: null }, old)
  assert.deepEqual(applyVerifiedWestSchoolSalonPoints20261127([old]), [malta])
  assert.deepEqual(applyVerifiedWestSchoolSalonPoints20261127([malta]), [malta])
  const stale = { ...old, address: old.address.replace('426', '429') }
  assert.strictEqual(applyVerifiedWestSchoolSalonPoints20261127([stale])[0], stale)
  assert.equal(fromCatalogue('sofia-britanica-beli-brezi').coordinates, null)

  const puzzle = fromCatalogue('sofia-puzzle-kids-nadezhda')
  const [priorPuzzle] = priorCatalogue([puzzle])
  assert.equal(puzzle.neighborhood, 'Надежда 1')
  assert.equal(puzzle.coordinates.addressId, '56926')
  assert.strictEqual(catalogueBoundCoordinates(puzzle), puzzle.coordinates)
  assert.deepEqual({ ...puzzle, neighborhood: priorPuzzle.neighborhood,
    coordinates: { ...puzzle.coordinates, sourceNeighborhood: priorPuzzle.neighborhood } }, priorPuzzle)
  assert.deepEqual(applyVerifiedNadezhdaPuzzleVisitPoint20261127([priorPuzzle]), [puzzle])
  assert.deepEqual(applyVerifiedNadezhdaPuzzleVisitPoint20261127([puzzle]), [puzzle])
  const alteredPin = { ...priorPuzzle, coordinates: { ...priorPuzzle.coordinates, checkedOn: '2026-11-27' } }
  assert.strictEqual(applyVerifiedNadezhdaPuzzleVisitPoint20261127([alteredPin])[0], alteredPin)
})

test('cover, grooming and nail trimming render with three distinct compressed original illustrations', async () => {
  const profile = catalogueProfileView(salon, { now })
  const images = [
    ['/business-cover-photos/go-sisters-dogs-lozenets-20261127-v1.webp', 960, 720],
    ['/service-photos/go-sisters-dogs-short-coat-groom-20261127-v1.webp', 480, 480],
    ['/service-photos/go-sisters-dogs-nail-trim-20261127-v1.webp', 480, 480],
  ]
  assert.deepEqual(businessCoverPhotoSources(profile), [images[0][0]])
  for (const [index, service] of profile.details.services.entries()) {
    const thumbnail = publicDetailServiceThumbnail(service, { business: profile })
    assert.equal(thumbnail.src, images[index + 1][0])
    assert.equal(thumbnail.source, 'illustrative')
  }
  const fingerprints = await Promise.all(images.map(async ([path, width, height]) => {
    const bytes = readFileSync(new URL('public' + path, root)), meta = await sharp(bytes).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', width, height], path)
    assert.ok(bytes.length < 115_000, path)
    return fingerprintDiscoveryPhoto(bytes)
  }))
  for (const [index, first] of fingerprints.entries()) for (const other of fingerprints.slice(index + 1)) {
    assert.equal(compareDiscoveryPhotos(first, other), null)
  }
})
