import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl, businessMapUrl } from '../lib/business-profile.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { VERIFIED_MTS_KRASNA_POLYANA3_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-mts-krasna-polyana3-20261127.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { mtsIntakeAllowsFileChange, mtsIntakeAllowsNewFile, mtsIntakeAllowsPath,
  mtsIntakePriorCatalogue, mtsIntakePriorSource } from './catalogue-mts-krasna-polyana3-20261127-scope.mjs'
import { northDogAllowsPath, northDogPriorCatalogue,
  northDogPriorSource } from './catalogue-north-dog-branch-point-20261127-scope.mjs'
import receipt from './fixtures/catalogue-mts-krasna-polyana3-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const rowSha = row => sha(JSON.stringify(row))
const paths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const id = 'sofia-mts-massage-pchinya31b', quarter = 'Красна поляна 3'
const address = 'София, ж.к. Красна поляна 3, бл. 31, вх. Б откъм ул. Пчиня'
const website = 'https://milenatsvetkova.bg/', phone = '+359877776703'
const [latitude, longitude] = [42.694690, 23.284973]
const contact = website + 'kontakti/'
const tariffs = [
  [65, 60, 'services/klasicheski-relaksirasht-masazh-tsyalo-tyalo/', 'Classic Full Body Massage', 'sx-male-massage'],
  [70, 60, 'services/avtorski-masazh-milena-tsvetkova/', 'Signature full-body massage with Milena Tsvetkova', 'sx-massage-manual-covered-alternatives'],
  [50, 30, 'services/chastichen-masazh-milena-tsvetkova/', 'Targeted massage with Milena Tsvetkova · back or anti-cellulite', 'sx-neck-shoulder-massage'],
]
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(northDogPriorCatalogue)
const branch = SOFIA_CATALOGUE.find(row => row.id === id)
const beforeCatalogue = mtsIntakePriorCatalogue(SOFIA_CATALOGUE)

test('the MTs receipt permits only the exact reviewed intake and leaves every earlier row and source file intact', () => {
  assert.equal(receipt.baseline, '65ceafe141aef59864ac5fe6f122cfed582d9bf8')
  assert.deepEqual(receipt.records.map(row => row.id), [id])
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const stagePaths = new Set([...changed, ...added])
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') &&
    (stagePaths.has(path) || !northDogAllowsPath(path))).sort(), [...stagePaths].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path)
    const after = northDogPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(before), sha(after)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.ok(mtsIntakeAllowsFileChange(path) && catalogueIntakeAllowsPath(path), path)
    assert.deepEqual(mtsIntakePriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(mtsIntakePriorSource(path, tampered), tampered, path)
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(paths(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
    assert.ok(mtsIntakeAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.ok(!mtsIntakeAllowsFileChange(path), path)
  }
  for (const path of ['lib/booking-engine.mjs', 'app/layout.js', 'public/logo.svg',
    'lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-search.mjs', 'package.json', 'supabase/config.toml']) {
    assert.equal(mtsIntakeAllowsPath(path), false, path)
  }
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const earlier = mtsIntakePriorCatalogue(rows)
    const row = rows.find(row => row.id === id)
    assert.equal(earlier.length, rows.length - 1)
    assert.equal(rowSha(earlier), receipt.baselineCatalogueSha256)
    assert.equal(rowSha(rows), receipt.currentCatalogueSha256)
    assert.equal(rowSha(row), receipt.records[0].sha256)
    assert.throws(() => mtsIntakePriorCatalogue([row, row]), /Duplicate verified MTs Krasna Polyana 3 intake record/u)
    assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address.replace('вх. Б', 'вх. А') }]),
      /Unreviewed verified MTs Krasna Polyana 3 intake record/u)
  }
})

test('the independently bound MTs entrance adds one physical and one nearby result in a previously empty health cell', () => {
  assert.ok(branch)
  assert.deepEqual([branch.cityCode, branch.locationKind, branch.neighborhood, branch.category, branch.address],
    ['68134', 'premises', quarter, 'health', address])
  assert.equal(branch.phone, phone)
  assert.equal(branch.website, website)
  assert.equal(branch.verification.contact, contact)
  assert.equal(branch.gorezBusinessId, undefined)
  assert.deepEqual(branch.booking, { kind: 'phone', phone })
  const host = url => url && new URL(url).hostname.replace(/^www\./u, '')
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.ok(!beforeCatalogue.some(row => host(row.website) === host(website) || row.phone === phone || row.address === address))
  const point = catalogueBoundCoordinates(branch)
  assert.deepEqual([point.latitude, point.longitude, point.addressId, point.sourceAddress, point.method],
    [latitude, longitude, '43181', address, 'verified_official_address'])
  assert.equal(catalogueBoundCoordinates({ ...branch, address: address.replace('вх. Б', 'вх. А') }), null)
  assert.equal(catalogueBoundCoordinates({ ...branch, coordinates: { ...point, latitude: longitude, longitude: latitude } }), null)
  const audit = [beforeCatalogue, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cell = report => [...report.neighborhoods, ...report.additionalNamedAreas].find(area => area.name === quarter)
    .cells.find(item => item.categoryId === 'health')
  assert.deepEqual(audit.map(report => [cell(report).count, cell(report).locatedCount]), [[0, 0], [1, 1]])
  assert.deepEqual(cell(audit[1]).locatedBusinessIds, [id])
  assert.equal(audit[1].counts.approvedBusinesses - audit[0].counts.approvedBusinesses, 1)
  assert.equal(approvedCatalogueRecord(branch, Date.parse('2026-11-26T12:00:00Z')), null)
  assert.equal(approvedCatalogueRecord(branch, Date.parse('2026-12-28T12:00:00Z')), null)
})

test('the catalogue binds all three appointment tariffs to the exact current owner menu and preserves the published terms', () => {
  assert.ok(branch)
  const [review] = VERIFIED_MTS_KRASNA_POLYANA3_20261127_REVIEWS
  assert.deepEqual(BOOKING_PRICE_REVIEWS.filter(row => row.id === id), [review])
  assert.deepEqual(assessPricingReview(branch, review, now), {
    id, state: 'reviewed', checkedOn: '2026-11-27', reviewedPriceCount: 3,
  })
  assert.equal(branch.services.length, 3)
  for (const [index, service] of branch.services.entries()) {
    const [amount, minutes, tariffPath] = tariffs[index]
    assert.equal(service.category, 'health')
    assert.equal(service.appointmentModel, 'appointment')
    assert.equal(service.durationMin, minutes)
    assert.equal(service.durationSourceUrl, website + 'tseni/')
    assert.deepEqual(service.price, {
      amount, currency: 'EUR', kind: 'fixed', unit: 'едно посещение', sourceUrl: website + tariffPath,
      checkedOn: '2026-11-27', validUntil: '2026-12-27',
    })
    assert.match(service.description, /3 дни предварително.*Плащане преди процедурата.*24 часа/u)
    assert.ok(review.reviewedUrls.includes(service.price.sourceUrl))
  }
  assert.deepEqual(branch.openingHours.days.map(row => [row.weekday, row.periods]), [
    ...[1, 2, 3, 4, 5].map(day => [day, [{ open: '09:00', close: '20:00' }]]),
    [6, [{ open: '09:00', close: '15:00' }]], [7, []],
  ])
})

test('real nearby and exact-quarter discovery and detail responses direct to the same civic pin and external phone without creating slots', async () => {
  const blocked = () => assert.fail('Discovery must not contact a provider, call live booking, or claim budget')
  const discovery = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
    fetcher: blocked, claimBudget: blocked, getBusiness: blocked, getSlots: blocked })
  const browse = async (locale, category, scope) => {
    const response = await discovery(new Request('https://gorez.test/api/public/discovery', {
      method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ locale, category, browse: true, ...scope }),
    }))
    assert.equal(response.status, 200)
    return (await response.json()).results.find(row => row.id === id)
  }
  const [nearby, byQuarter, unrelated] = await Promise.all([
    browse('bg', 'health', { coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }),
    browse('en', 'health', { cityCode: '68134', neighborhood: quarter }),
    browse('bg', 'auto_repair', { cityCode: '68134', neighborhood: quarter }),
  ])
  assert.ok(nearby && byQuarter)
  assert.equal(unrelated, undefined)
  for (const card of [nearby, byQuarter]) {
    assert.ok(card.servicePreview.length > 0 && card.servicePreview.length <= 2)
    assert.deepEqual(card.availability, { status: 'external', slots: [] })
  }
  const details = createPublicBusinessDetailsHandler({
    config: { enabled: true }, findCatalogue: requested => requested === id ? branch : undefined, now: () => now, allowAttempt: () => true,
  })
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  for (const surface of [nearby, byQuarter, catalogueProfileView(branch, { now }), business]) {
    const route = new URL(businessDirectionsUrl(surface))
    assert.equal(route.searchParams.get('api'), '1')
    assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
    assert.equal(route.searchParams.get('destination_place_id'), null)
    assert.equal(new URL(businessMapUrl(surface)).searchParams.get('marker'), latitude + ',' + longitude)
    assert.deepEqual(railExternalAction(surface, now), { kind: 'phone', href: 'tel:' + phone })
  }
  const galleries = business.details.services
  assert.equal(galleries.length, 3)
  const cover = businessCoverPhotoSources(business)
  assert.ok(cover.includes('/business-cover-photos/activity-massage-v1.webp'))
  const paths = []
  for (const [index, service] of galleries.entries()) {
    const [amount, duration, tariffPath, translation, thumbnail] = tariffs[index]
    assert.deepEqual([service.price, service.currency, service.priceKind, service.durationMin], [amount, 'EUR', 'fixed', duration])
    assert.equal(service.priceSourceUrl, website + tariffPath)
    assert.equal(service.presentationEn.name, translation)
    assert.match(service.presentationEn.description, /3 days.*24 hours/u)
    const photo = publicDetailServiceThumbnail(service, { business })
    assert.equal(photo?.src, '/service-photos/' + thumbnail + '-v1.webp')
    assert.equal(matchesBusinessCoverPhoto(photo.src, cover), false)
    assert.equal(publicDetailServiceThumbnail(service, { business, locale: 'en' }).src, photo.src)
    paths.push(photo.src)
  }
  assert.equal(new Set(paths).size, 3)
  assert.equal(new Set(paths.map(path => {
    const bytes = readFileSync(new URL('public' + path, cwd))
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
    return sha(bytes)
  })).size, 3)
  for (const locale of ['bg', 'en']) {
    const { services } = catalogueOnboardingDetail([branch], id, { now, cityCode: '68134', locale })
    assert.deepEqual(services.map(service => [service.price, service.currency, service.duration_min]),
      tariffs.map(([amount, duration]) => [String(amount), 'EUR', String(duration)]))
  }
})
