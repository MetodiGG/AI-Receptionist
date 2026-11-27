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
import { applyAuraCohortLocationFollowupNov27 } from '../lib/discovery/catalogue-data/neighborhood-verified-aura-b19-20261127.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { auraGrowthAllowsFileChange, auraGrowthAllowsNewFile, auraGrowthAllowsPath,
  auraGrowthPriorCatalogue, auraGrowthPriorSource } from './catalogue-aura-b19-growth-20261127-scope.mjs'
import receipt from './fixtures/catalogue-aura-b19-growth-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const rowSha = row => sha(JSON.stringify(row))
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const id = 'sofia-aura-music-stamboliyski175'
const quarter = 'Зона Б-19'
const phone = '+359887606886'
const [latitude, longitude] = [42.7000719, 23.2988115]
const contact = 'https://aura-bg.com/kontakti'
const tariff = 'https://aura-bg.com/detska-muzikalna-shkola'
const booking = 'https://aura-bg.com/novina/zapisvane-za-novata-2026-2027-uchebna-godina'
const branch = SOFIA_CATALOGUE.find(row => row.id === id)
const beforeCatalogue = auraGrowthPriorCatalogue(SOFIA_CATALOGUE)

test('Aura B19 history gate restores only the reviewed add and any explicitly reviewed rebind', () => {
  assert.equal(receipt.baseline, '5377802e2318c1df76d792a6c5a9fbc68a28c614')
  assert.deepEqual(receipt.records.map(row => row.id), [id])
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const observed = new Set([...files(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(), [...changed, ...added].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path), after = readFileSync(new URL(path, cwd))
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(sha(after), receipt.changed[path].after, path)
    assert.ok(auraGrowthAllowsFileChange(path) && catalogueIntakeAllowsPath(path), path)
    assert.deepEqual(auraGrowthPriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(auraGrowthPriorSource(path, tampered), tampered, path)
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(files(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
    assert.ok(auraGrowthAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(auraGrowthAllowsFileChange(path), false)
  }
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/catalogue-policy.mjs', 'app/layout.js',
    'public/logo.svg', 'package.json', 'supabase/config.toml']) assert.equal(auraGrowthAllowsPath(path), false, path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const earlier = auraGrowthPriorCatalogue(rows)
    const row = rows.find(row => row.id === id)
    assert.equal(earlier.length, rows.length - 1)
    assert.equal(rowSha(earlier), receipt.baselineCatalogueSha256)
    assert.equal(rowSha(rows), receipt.currentCatalogueSha256)
    assert.equal(rowSha(row), receipt.records[0].sha256)
    assert.throws(() => auraGrowthPriorCatalogue([row, row]), /Duplicate verified Aura B19 growth record/u)
    assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'А' }]), /Unreviewed verified Aura B19 growth record/u)
    for (const proof of receipt.rebindings) {
      const before = earlier.find(item => item.id === proof.id), current = rows.find(item => item.id === proof.id)
      assert.equal(before.coordinates, null)
      assert.equal(rowSha(before), proof.before)
      assert.equal(rowSha(current), proof.after)
      assert.deepEqual(before, { ...current, coordinates: null })
      assert.equal(pricingIdentity(before), pricingIdentity(current))
      assert.throws(() => auraGrowthPriorCatalogue([before, current]), /Duplicate Aura B19 growth location record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...current, address: current.address + 'А' }]), /Unreviewed Aura B19 growth location record/u)
    }
  }
})

test('the exact Aura premises fills one physical and GPS education gap without duplicating a postal neighbour', () => {
  assert.ok(branch)
  assert.equal(branch.cityCode, '68134')
  assert.equal(branch.neighborhood, quarter)
  assert.match(branch.address, /София.*бул\.?.*Александър Стамболийски.*175$/u)
  assert.equal(branch.phone, phone)
  assert.equal(branch.locationKind, 'premises')
  assert.equal(branch.verification.booking.url, booking)
  assert.equal(branch.verification.contact, contact)
  const audit = [beforeCatalogue, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const cell = summary => [...summary.neighborhoods, ...summary.additionalNamedAreas].find(area => area.name === quarter)
    .cells.find(item => item.categoryId === 'education')
  assert.deepEqual(audit.map(summary => [cell(summary).count, cell(summary).locatedCount]), [[0, 0], [1, 1]])
  assert.deepEqual(cell(audit[1]).locatedBusinessIds, [id])
  assert.equal(audit[1].counts.approvedBusinesses - audit[0].counts.approvedBusinesses, 1)
  const host = source => source && new URL(source).hostname.replace(/^www\./u, '')
  assert.equal(PUBLIC_CATALOGUE.filter(row => row.id === id).length, 1)
  assert.ok(!PUBLIC_CATALOGUE.some(row => row.id !== id &&
    (host(row.website) === host(branch.website) || row.phone === branch.phone || row.address === branch.address)))
  const point = catalogueBoundCoordinates(branch)
  assert.deepEqual([point.latitude, point.longitude], [latitude, longitude])
  assert.equal(point.source, contact)
  assert.equal(catalogueBoundCoordinates({ ...branch, address: branch.address + 'А' }), null)
  assert.equal(catalogueBoundCoordinates({ ...branch, coordinates: { ...point, latitude: longitude, longitude: latitude } }), null)
  assert.equal(approvedCatalogueRecord(branch, Date.parse('2026-11-26T00:00:00Z')), null)
  assert.equal(approvedCatalogueRecord(branch, Date.parse(branch.verification.validUntil) + 48 * 60 * 60 * 1000), null)
  const boyana = summary => summary.neighborhoods.find(area => area.name === 'Бояна').cells.find(item => item.categoryId === 'pets')
  assert.deepEqual(audit.map(summary => [boyana(summary).count, boyana(summary).locatedCount]), [[1, 0], [1, 1]])
  assert.deepEqual(boyana(audit[1]).locatedBusinessIds, ['sofia-bo-bella-grooming'])
})

test('Aura discovery/details keeps monthly tuition explicit and directs to the school by phone', async () => {
  const lookup = id => SOFIA_CATALOGUE.find(row => row.id === id)
  const details = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue: lookup, now: () => now, allowAttempt: () => true })
  const discovery = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true,
    now: DateTime.fromMillis(now), allowAttempt: () => true, readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE })
  const browse = async (locale, subcategory, scope) => {
    const request = new Request('https://gorez.test/api/public/discovery', {
      method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ locale, category: 'education', subcategory, browse: true, ...scope }),
    })
    const response = await discovery(request)
    assert.equal(response.status, 200)
    return (await response.json()).results.find(row => row.id === id)
  }
  const [nearby, byQuarter, unrelated] = await Promise.all([
    browse('bg', 'education-instruments', { coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }),
    browse('en', 'education-instruments', { cityCode: '68134', neighborhood: quarter }),
    browse('bg', 'education-languages', { cityCode: '68134', neighborhood: quarter }),
  ])
  assert.ok(nearby && byQuarter)
  assert.equal(unrelated, undefined)
  for (const card of [nearby, byQuarter]) {
    assert.equal(card.servicePreview[0].price, 90)
    assert.deepEqual(card.availability, { status: 'external', slots: [] })
  }
  const response = await details(new Request('https://gorez.test/api/public/discovery/business/' + id), id)
  assert.equal(response.status, 200)
  const { business } = await response.json()
  const profile = catalogueProfileView(branch, { now })
  for (const surface of [nearby, byQuarter, profile, business]) {
    const route = new URL(businessDirectionsUrl(surface))
    assert.equal(route.searchParams.get('api'), '1')
    assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
    assert.equal(route.searchParams.get('destination_place_id'), null)
    assert.equal(new URL(businessMapUrl(surface)).searchParams.get('marker'), latitude + ',' + longitude)
    assert.deepEqual(railExternalAction(surface, now), { kind: 'phone', href: 'tel:' + phone })
  }
  const verifiedPrice = BOOKING_PRICE_REVIEWS.find(item => item.id === id)
  assert.equal(verifiedPrice.inventoryIdentity, pricingIdentity(branch))
  const unlocked = business.details.services
  assert.equal(unlocked.length, 1)
  assert.equal(unlocked[0].name, 'Индивидуални уроци по музика за деца · пиано, цигулка или пеене')
  assert.equal(assessPricingReview(branch, verifiedPrice, now).reviewedPriceCount, unlocked.length)
  for (const offering of unlocked) {
    assert.deepEqual([offering.price, offering.currency, offering.priceKind, offering.durationMin], [90, 'EUR', 'fixed', null])
    assert.equal(offering.priceSourceUrl, tariff)
    assert.match(detailPriceLabel(offering), /месеч|месец/u)
    assert.match(detailPriceLabel(offering, 'en'), /monthly|month/u)
    assert.ok(offering.presentationEn?.name?.length > 0)
    const photo = publicDetailServiceThumbnail(offering, { business })
    assert.ok(photo?.src)
    assert.equal(matchesBusinessCoverPhoto(photo.src, businessCoverPhotoSources(business)), false)
    assert.equal(publicDetailServiceThumbnail(offering, { business, locale: 'en' }).src, photo.src)
  }
})

test('only the exact existing Bo & Bella premises gains nearby routing; its reviewed services and phone action are intact', async () => {
  const id = 'sofia-bo-bella-grooming', latitude = 42.6580355, longitude = 23.2688201
  const [before, after] = [beforeCatalogue, SOFIA_CATALOGUE].map(rows => rows.find(row => row.id === id))
  assert.equal(before.coordinates, null)
  assert.equal(after.address, 'София, кв. Бояна, ул. Маринковица 29')
  assert.equal(after.neighborhood, 'Бояна')
  assert.deepEqual(catalogueBoundCoordinates(after), {
    latitude, longitude, method: 'first_party_coordinates', source: 'https://groomingsofia.com/контакт/', sourceAddress: after.address,
  })
  assert.deepEqual(applyAuraCohortLocationFollowupNov27([before]), [after])
  assert.equal(applyAuraCohortLocationFollowupNov27([after])[0], after)
  for (const change of [{ id: id + '-other' }, { address: before.address + 'A' }, { neighborhood: 'Драгалевци' },
    { cityCode: '11884' }, { phone: '+359889999999' }, { website: 'https://other.test/' }, { booking: { kind: 'form', url: 'https://other.test/book' } },
    { verification: { ...before.verification, contact: 'https://other.test/' } }, { coordinates: { ...after.coordinates, latitude: latitude + .01 } }]) {
    const edited = { ...before, ...change }
    assert.equal(applyAuraCohortLocationFollowupNov27([edited])[0], edited)
  }
  const intent = { cityCode: '68134', category: 'pets', browse: true, searchV2: true, requirements: [] }
  const nearby = { ...intent, coordinates: { latitude, longitude }, radiusKm: 1 }
  assert.deepEqual(normalizeCatalogueBusinesses([before], nearby, { now }), [])
  const [beforeCard] = normalizeCatalogueBusinesses([before], { ...intent, neighborhood: 'Бояна' }, { now })
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
    assert.equal(railDirections(previous), null)
    assert.equal(updated.locationStatus, 'verified_sofia')
    assert.equal(new URL(railDirections(updated)).searchParams.get('destination'), latitude + ',' + longitude)
    assert.equal(new URL(businessMapUrl(updated)).searchParams.get('marker'), latitude + ',' + longitude)
    assert.deepEqual(updated.details.services, previous.details.services)
    assert.deepEqual(railExternalAction(updated, now), { kind: 'phone', href: 'tel:+359888344474' })
    assert.deepEqual(railExternalAction(updated, now), railExternalAction(previous, now))
  }
  assert.deepEqual(afterCard.availability, { status: 'external', slots: [] })
})
