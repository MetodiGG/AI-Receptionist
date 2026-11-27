import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-levski-karpuzitsa-20261127-scope.mjs'
import receipt from './fixtures/catalogue-levski-karpuzitsa-20261127.json' with { type: 'json' }

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const now = Date.parse('2026-11-27T12:00:00Z')
const cases = [
  {
    id: 'sofia-car-paint-service-levski-g-kyumyurdzhiev22', neighborhood: 'Левски Г', category: 'auto_repair', subcategory: 'auto_repair-diagnostics',
    address: 'София, кв. Левски Г, ул. Поручик Георги Кюмюрджиев 22', point: { latitude: 42.713613, longitude: 23.381120 },
    addressId: '94646', counts: [[0, 0], [1, 1]], kind: 'form', href: 'https://carpaintservice.bg/portfolio/',
    en: 'Computer diagnostics for an internal combustion engine',
    cover: '/business-cover-photos/go-carpaint-levski-g-20261127-v1.webp', picture: '/service-photos/go-carpaint-levski-g-engine-diagnostics-20261127-v1.webp',
  },
  {
    id: 'sofia-sense-center-karpuzitsa-nikola-petkov95a', neighborhood: 'Карпузица', category: 'other', subcategory: 'other-psychology',
    address: 'София, кв. Карпузица, бул. Никола Петков 95А', point: { latitude: 42.669520, longitude: 23.253776 },
    addressId: '110226', counts: [[2, 0], [3, 1]], kind: 'phone', href: 'tel:+359879800013',
    en: 'Individual psychology consultation for parents',
    cover: '/business-cover-photos/go-sense-center-karpuzitsa-20261127-v1.webp', picture: '/service-photos/go-sense-center-karpuzitsa-parents-consult-20261127-v1.webp',
  },
]
const rows = cases.map(item => SOFIA_CATALOGUE.find(row => row.id === item.id))
const noLive = () => assert.fail('These catalogue results must not call booking, calendar, geocoding or external providers')
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }

test('only the two exact new records, their receipts, English copy and illustrative assets enter this intake', () => {
  const expected = [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort()
  const changed = new Set([
    git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z'),
  ].flatMap(bytes => bytes.toString().split('\0').filter(Boolean)))
  assert.deepEqual([...changed].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(), expected)
  for (const path of Object.keys(receipt.changed)) {
    const before = git('show', receipt.baseline + ':' + path)
    const after = readFileSync(new URL(path, root))
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path, after), before, path)
    const changedBytes = Buffer.concat([after, Buffer.from('\n')])
    assert.deepEqual(priorSource(path, changedBytes), changedBytes, path)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(allowsNewFile(path), true, path)
  for (const catalogue of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(catalogue)), receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(catalogue))), receipt.baselineCatalogueSha256)
    assert.equal(priorCatalogue(catalogue).length, catalogue.length - 2)
  }
  assert.throws(() => priorCatalogue([{ ...rows[0], coordinates: null }]), /Unreviewed verified Levski/u)
  assert.throws(() => priorCatalogue([rows[1], rows[1]]), /Duplicate verified Levski/u)
})

test('both new public destinations add exactly one to their category without merging distinct neighborhoods', () => {
  const reports = [priorCatalogue(SOFIA_CATALOGUE), SOFIA_CATALOGUE]
    .map(catalogue => catalogueCoverageReport(catalogue, { now, target: 30 }))
  for (const [index, item] of cases.entries()) {
    const business = rows[index]
    assert.equal(business.address, item.address)
    assert.equal(business.coordinates.addressId, item.addressId)
    assert.equal(catalogueBoundCoordinates(business), business.coordinates)
    assert.equal(catalogueBoundCoordinates({ ...business, address: item.address.replace(/22$|95А$/u, '222') }), null)
    assert.deepEqual(reports.map(report => {
      const area = [...report.neighborhoods, ...report.additionalNamedAreas].find(x => x.name === item.neighborhood)
      const cell = area.cells.find(x => x.categoryId === item.category)
      return [cell.count, cell.locatedCount]
    }), item.counts, item.id)
  }
})

test('BG and EN public browsing, details and profile show one reviewed service, with no inferred prices or live bookings', async () => {
  const endpoint = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true,
    readCatalogue: async () => rows, readInternal: async () => [], getSlots: noLive, getBusiness: noLive,
    fetcher: noLive, claimBudget: noLive, readLinks: noLive, readPartnerPlaces: noLive, readBookablePlaces: noLive,
  })
  const detailsEndpoint = createPublicBusinessDetailsHandler({
    config: { enabled: true }, allowAttempt: () => true, now: () => now,
    findCatalogue: key => rows.find(row => row.id === key), readPartner: noLive,
  })
  for (const [index, item] of cases.entries()) {
    const business = rows[index], profile = catalogueProfileView(business, { now })
    const review = BOOKING_PRICE_REVIEWS.find(row => row.id === item.id)
    assert.equal(assessPricingReview(business, review, now).state, 'service_reviewed')
    assert.equal(assessPricingReview(business, review, now).reviewedPriceCount ?? 0, 0)
    assert.equal(approvedCatalogueRecord(business, Date.parse('2026-12-28T00:00:00Z')), null)
    const detailResponse = await detailsEndpoint(new Request('https://example.test/api/public/discovery/business/' + item.id, { headers }), item.id)
    assert.equal(detailResponse.status, 200)
    const { business: details } = await detailResponse.json()
    for (const locale of ['bg', 'en']) {
      const response = await endpoint(new Request('https://example.test/api/public/discovery', {
        method: 'POST', headers, body: JSON.stringify({ browse: true, category: item.category,
          subcategory: item.subcategory, locale, coordinates: { ...item.point, consent: true }, radiusKm: 1 }),
      }))
      assert.equal(response.status, 200)
      const result = (await response.json()).results
      assert.deepEqual(result.map(b => b.id), [item.id])
      const [card] = result
      assert.deepEqual(card.availability, { status: 'external', slots: [] })
      for (const view of [card, details, profile]) {
        assert.equal(view.address, item.address)
        assert.deepEqual(railExternalAction(view, now), { kind: item.kind, href: item.href })
        assert.equal(new URL(businessDirectionsUrl(view)).searchParams.get('destination'), item.point.latitude + ',' + item.point.longitude)
      }
    }
    assert.equal(profile.details.services.length, 1)
    assert.equal(profile.details.services[0].presentationEn.name, item.en)
    assert.doesNotMatch(profile.details.services[0].presentationEn.description, /\p{Script=Cyrillic}/u)
    assert.ok(profile.details.services[0].price == null)
    assert.ok(profile.details.services[0].durationMin == null)
  }
})

test('all four branch and service illustrations are distinct WebPs and have correct mobile-friendly sizes', async () => {
  const assets = []
  for (const [index, item] of cases.entries()) {
    const profile = catalogueProfileView(rows[index], { now })
    assert.deepEqual(businessCoverPhotoSources(profile), [item.cover])
    const detail = publicDetailServiceThumbnail(profile.details.services[0], { business: profile })
    assert.equal(detail.src, item.picture)
    assert.equal(detail.source, 'illustrative')
    assets.push([item.cover, 960, 720], [item.picture, 480, 480])
  }
  const photos = await Promise.all(assets.map(async ([path, width, height]) => {
    const bytes = await readDiscoveryImage(fileURLToPath(new URL('../public', import.meta.url)), path)
    const meta = await sharp(bytes).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', width, height], path)
    assert.ok(bytes.length < 120_000, path)
    return { path, print: await fingerprintDiscoveryPhoto(bytes) }
  }))
  for (const [index, first] of photos.entries()) {
    for (const second of photos.slice(index + 1)) {
      assert.equal(compareDiscoveryPhotos(first.print, second.print), null, first.path + ' / ' + second.path)
    }
  }
})
