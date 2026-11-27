import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto, publicBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { garage46AllowsFileChange, garage46AllowsNewFile, garage46AllowsPath, garage46PriorCatalogue, garage46PriorSource } from './catalogue-garage46-serdika-20261127-scope.mjs'
import receipt from './fixtures/catalogue-garage46-serdika-20261127.json' with { type: 'json' }
import report from '../docs/catalogue-coverage/garage46-serdika-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const rowSha = row => sha(JSON.stringify(row))
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const id = 'sofia-garage46-serdika-ivanivanov67'
const coverSrc = '/business-cover-photos/go-garage46-serdika-20261127-v1.webp'
const [latitude, longitude] = [42.6901267, 23.2878061]
const servicePhotos = ['sx-auto-bulb-check-replace', 'sx-auto-headlight-align', 'sx-auto-headlamp-assembly-replacement']
  .map(name => '/service-photos/' + name + '-v1.webp')
const expectedNames = ['Монтаж на LED крушки за фарове · автоелектроника', 'Регулиране на фарове · автоелектроника', 'Смяна на фарове · автоелектроника']
const cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const changed = ['docs/specific-service-photo-generation-2026-11-12.json', 'lib/catalogue-service-photo-keys.mjs',
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs', cataloguePath, 'lib/locale/service-english.json',
  'lib/public-business-cover-photo.mjs', 'lib/specific-service-photo-ids.mjs']
const added = ['docs/catalogue-coverage/garage46-serdika-20261127.json', 'lib/discovery/catalogue-data/neighborhood-verified-garage46-serdika-20261127.mjs',
  'public' + coverSrc, 'public' + servicePhotos[2]]
const prior = garage46PriorCatalogue(SOFIA_CATALOGUE)
const branch = SOFIA_CATALOGUE.find(row => row.id === id)

test('the read-only scope restores exactly one approved Garage46 row and its sealed predecessor files', () => {
  assert.equal(receipt.baseline, '96c35c471791cf6e8a2d7dbcae93a490b5edc948')
  assert.equal(report.baseCommit, receipt.baseline)
  assert.deepEqual(Object.keys(receipt.changed).sort(), changed.sort())
  assert.deepEqual(Object.keys(receipt.added).sort(), added.sort())
  assert.deepEqual(receipt.records.map(record => record.id), [id])
  const observed = new Set([...files(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(), [...changed, ...added].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path), after = readFileSync(new URL(path, cwd))
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(sha(after), receipt.changed[path].after, path)
    assert.ok(garage46AllowsFileChange(path) && catalogueIntakeAllowsPath(path), path)
    assert.deepEqual(garage46PriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(garage46PriorSource(path, tampered), tampered, path)
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(files(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path])
    assert.ok(garage46AllowsNewFile(path) && catalogueIntakeAllowsPath(path))
    assert.equal(garage46AllowsFileChange(path), false)
  }
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/catalogue-policy.mjs', 'app/layout.js',
    'public/logo.svg', 'package.json', 'supabase/config.toml']) assert.equal(garage46AllowsPath(path), false, path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const earlier = garage46PriorCatalogue(rows), row = rows.find(row => row.id === id)
    assert.equal(earlier.length, rows.length - 1)
    assert.equal(rowSha(earlier), receipt.baselineCatalogueSha256)
    assert.equal(rowSha(rows), receipt.currentCatalogueSha256)
    assert.equal(rowSha(row), receipt.records[0].sha256)
    assert.deepEqual(garage46PriorCatalogue([row]), [])
    assert.throws(() => garage46PriorCatalogue([row, row]), /Duplicate verified Garage46 Serdika/u)
    assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'А' }]), /Unreviewed verified Garage46 Serdika/u)
  }
})

test('the one new verified premises fills Serdika auto repair once, not a guessed chain-wide branch', () => {
  assert.ok(branch)
  assert.equal(branch.cityCode, '68134')
  assert.equal(branch.neighborhood, 'Сердика')
  assert.equal(branch.address, 'София, ж.к. Сердика, бул. Инж. Иван Иванов 67')
  assert.equal(branch.phone, '+359887737477')
  assert.equal(branch.locationKind, 'premises')
  const totals = [prior, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  assert.equal(report.newDistinctBusinesses, 1)
  assert.deepEqual(totals.map(audit => audit.counts.approvedBusinesses), report.coverage.approvedSofiaBusinesses)
  assert.deepEqual(totals.map(audit => audit.counts.premisesWithBoundCoordinates), report.coverage.premisesWithBoundPoint)
  const scopeCells = audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].flatMap(area => area.cells)
  assert.deepEqual(totals.map(audit => audit.counts.zeroCells), report.coverage.emptyPhysicalCells)
  assert.deepEqual(totals.map(audit => scopeCells(audit).filter(cell => cell.locatedCount === 0).length), report.coverage.emptyLocatedCells)
  const cells = totals.map(audit => audit.neighborhoods.find(area => area.name === 'Сердика').cells.find(cell => cell.categoryId === 'auto_repair'))
  assert.deepEqual(cells.map(cell => [cell.count, cell.locatedCount]), [[0, 0], [1, 1]])
  assert.deepEqual(cells[1].locatedBusinessIds, [id])
  const host = source => new URL(source).hostname.replace(/^www\./u, '')
  assert.ok(!PUBLIC_CATALOGUE.some(row => row.id !== id &&
    (host(row.website) === host(branch.website) || row.phone === branch.phone || row.address === branch.address)))
  const point = catalogueBoundCoordinates(branch)
  assert.equal(point.method, 'first_party_coordinates')
  assert.deepEqual([point.latitude, point.longitude], [latitude, longitude])
  assert.equal(catalogueBoundCoordinates({ ...branch, address: branch.address + 'А' }), null)
  assert.equal(approvedCatalogueRecord(branch, Date.parse('2026-11-26T00:00:00Z')), null)
  assert.equal(approvedCatalogueRecord(branch, Date.parse('2026-12-28T00:00:00Z')), null)
})

test('only the reviewed offer prices, qualifications, hours and destination reach nearby discovery and details', async () => {
  const lookup = id => SOFIA_CATALOGUE.find(row => row.id === id)
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue: lookup, now: () => now, allowAttempt: () => true })
  const discovery = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE })
  const browse = async (locale, subcategory, scope) => {
    const request = new Request('https://gorez.test/api/public/discovery', {
      method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ locale, category: 'auto_repair', subcategory, browse: true, ...scope }),
    })
    const response = await discovery(request)
    assert.equal(response.status, 200)
    return (await response.json()).results.find(row => row.id === id)
  }
  const sameAddress = { cityCode: '68134', neighborhood: 'Сердика' }
  const near = { coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }
  const [nearby, byQuarter, unrelated] = await Promise.all([
    browse('bg', 'auto_repair-electrics', near), browse('en', 'auto_repair-electrics', sameAddress),
    browse('bg', 'auto_repair-tyres', sameAddress),
  ])
  assert.ok(nearby && byQuarter)
  assert.equal(unrelated, undefined)
  for (const card of [nearby, byQuarter]) {
    assert.deepEqual(card.services.map(service => service.name), expectedNames.slice(0, 2))
    assert.deepEqual(card.servicePreview.map(service => service.price), [15, 15])
    assert.deepEqual(card.availability, { status: 'external', slots: [] })
  }
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json(), unlocked = business.details.services
  const profile = catalogueProfileView(branch, { now })
  for (const surface of [nearby, byQuarter, profile, business]) {
    const target = new URL(businessDirectionsUrl(surface))
    assert.equal(target.searchParams.get('api'), '1')
    assert.equal(target.searchParams.get('destination'), latitude + ',' + longitude)
    assert.equal(target.searchParams.get('destination_place_id'), null)
    assert.equal(new URL(businessMapUrl(surface)).searchParams.get('marker'), latitude + ',' + longitude)
    assert.deepEqual(railExternalAction(surface, now), { kind: 'form', href: branch.booking.url })
  }
  const review = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
  assert.equal(pricingIdentity(branch), 'ec648a2faa49ac39ef71df3b3f0a33f1944ab07b3de1ea3c2da308a8ba34da56')
  assert.equal(review.inventoryIdentity, pricingIdentity(branch))
  assert.equal(assessPricingReview(branch, review, now).reviewedPriceCount, 3)
  assert.deepEqual(unlocked.map(service => service.name), expectedNames)
  assert.deepEqual(unlocked.map(service => [service.price, service.currency, service.priceKind, service.durationMin]),
    [[15, 'EUR', 'from', null], [15, 'EUR', 'from', null], [35, 'EUR', 'from', null]])
  assert.match(detailPriceLabel(unlocked[0]), /^от 15[\s,.\d]*€.*без крушки$/u)
  assert.match(unlocked[0].description, /крушките се заплащат отделно/u)
  assert.ok(unlocked.every(service => service.presentationEn?.name && service.priceSourceUrl === branch.website))
  assert.deepEqual(business.details.hours.map(({ periods }) => periods), [...Array.from({ length: 5 }, () => ['10:00–17:00']), [], []])
})

test('the detail uses three actually distinct scenes and keeps the locally generated cover branch-bound', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue: () => branch, now: () => now, allowAttempt: () => true })
  const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  const { business } = await response.json()
  assert.deepEqual(businessCoverPhotoSources(business), [coverSrc])
  assert.notEqual(publicBusinessCoverPhoto({ ...business, id: 'sofia-another-workshop' }).src, coverSrc)
  const selected = business.details.services.map(service => publicDetailServiceThumbnail(service, { business }))
  assert.deepEqual(selected.map(photo => photo.src), servicePhotos)
  for (const [index, photo] of selected.entries()) {
    assert.equal(photo.source, 'illustrative')
    assert.equal(matchesBusinessCoverPhoto(photo.src, [coverSrc]), false)
    assert.ok(!DISCOVERY_SUBCATEGORIES.some(category => category.photo === photo.src))
    assert.equal(publicDetailServiceThumbnail(business.details.services[index], { business, locale: 'en' }).src, photo.src)
  }
  const fingerprints = await Promise.all([coverSrc, ...servicePhotos].map(async src =>
    fingerprintDiscoveryPhoto(readFileSync(new URL('public' + src, cwd)))))
  for (const [index, image] of fingerprints.entries()) {
    assert.equal(image.format, 'webp')
    for (let other = index + 1; other < fingerprints.length; other++) assert.equal(compareDiscoveryPhotos(image, fingerprints[other]), null)
  }
})
