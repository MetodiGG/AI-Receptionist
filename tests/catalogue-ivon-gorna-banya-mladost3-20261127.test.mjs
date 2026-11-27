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
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyNeliSlavovaBranchPointNov27 } from '../lib/discovery/catalogue-data/sofia-neli-slavova-branch-point-nov27.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import { ivonAllowsPath, ivonPriorCatalogue, ivonPriorSource } from './catalogue-ivon-gorna-banya-mladost3-20261127-scope.mjs'
import { nadezhdaAllowsPath, nadezhdaPriorCatalogue, nadezhdaPriorSource } from './catalogue-nadezhda-fitness-20261127-scope.mjs'
import proof from '../docs/catalogue-coverage/ivon-gorna-banya-mladost3-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-ivon-gorna-banya-mladost3-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = value => sha(JSON.stringify(value))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString().split('\0').filter(Boolean)
const now = Date.parse('2026-11-27T12:00:00Z')
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(nadezhdaPriorCatalogue)
const id = 'sofia-ivon-service-gorna-banya-eho1', neliId = 'sofia-neli-slavova-mladost-3'
const ivon = SOFIA_CATALOGUE.find(row => row.id === id), neli = SOFIA_CATALOGUE.find(row => row.id === neliId)
const earlier = ivonPriorCatalogue(SOFIA_CATALOGUE), neliBefore = earlier.find(row => row.id === neliId)
const forbidden = () => assert.fail('A public catalogue read must not contact providers or touch internal bookings')

test('the exact branch intake and coordinate-only patch restore every earlier catalogue row and file byte', () => {
  assert.equal(proof.baseCommit, receipt.baseline)
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const reviewedPaths = new Set([...changed, ...added])
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (reviewedPaths.has(path) || !nadezhdaAllowsPath(path))).sort(), [...changed, ...added].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path), after = nadezhdaPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(before), sha(after)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.deepEqual(ivonPriorSource(path, after), before, path)
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(ivonPriorSource(path, tampered), tampered, path)
    assert.ok(ivonAllowsPath(path))
  }
  for (const path of added) assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(digest(rows), receipt.currentCatalogueSha256)
    assert.equal(digest(ivonPriorCatalogue(rows)), receipt.baselineCatalogueSha256)
  }
  for (const path of ['lib/booking-engine.mjs', 'app/page.js', 'app/layout.js', 'public/logo.svg', 'next.config.mjs', 'supabase/config.toml']) {
    assert.equal(ivonAllowsPath(path), false, path)
  }
  assert.throws(() => ivonPriorCatalogue([{ ...neli, phone: '+359883399201' }]), /Unreviewed Neli Slavova branch/u)
  assert.throws(() => ivonPriorCatalogue([{ ...ivon, address: 'София, кв. Горна баня, ул. Ехо 2' }]), /Unreviewed verified IVON/u)
})

test('only one new operator and one existing point are counted in the two quarter categories', () => {
  const summaries = [earlier, SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows, { now, target: 30 }))
  const grid = summaries.map(x => [...x.neighborhoods, ...x.additionalNamedAreas])
  const cell = (items, name, categoryId) => items.find(area => area.name === name).cells.find(item => item.categoryId === categoryId)
  assert.deepEqual(grid.map(items => [cell(items, 'Горна баня', 'auto_repair').count, cell(items, 'Горна баня', 'auto_repair').locatedCount]), [[1, 1], [2, 2]])
  assert.deepEqual(grid.map(items => [cell(items, 'Младост 3', 'other').count, cell(items, 'Младост 3', 'other').locatedCount]), [[2, 0], [2, 1]])
  assert.deepEqual(summaries.map(x => [x.counts.approvedBusinesses, x.counts.premisesWithBoundCoordinates]), [[1788, 1046], [1789, 1048]])
  assert.ok(grid[1].some(area => area.name === 'Младост 3' && area.cells.some(c => c.locatedBusinessIds.includes(neliId))))
  assert.equal(SOFIA_CATALOGUE.filter(x => (x.website && new URL(x.website).hostname) === 'ivonservice.com').length, 1)
})

test('IVON preserves the oil purchase condition, no invented price or duration, and the three relevant categories', () => {
  const review = BOOKING_PRICE_REVIEWS.find(x => x.id === id)
  assert.deepEqual(assessPricingReview(ivon, review, now), {
    id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-27', reviewedPriceCount: 0,
  })
  assert.deepEqual(ivon.services.map(service => service.name), proof.newBusiness.services.map(service => service.name))
  assert.ok(ivon.services.every(service => service.price == null && service.durationMin == null))
  const profile = catalogueProfileView(ivon, { now })
  const oil = profile.details.services.find(x => x.name === 'Смяна на масло')
  assert.equal(detailPriceLabel(oil), null)
  assert.match(oil.description, /при покупка на масло.*трудът за смяната е безплатен/iu)
  assert.match(oil.presentationEn.description, /labour is free when the oil is purchased/u)
  assert.deepEqual(ivon.services.map(service => ['auto_repair-diagnostics','auto_repair-oil-filters','auto_repair-brakes-suspension']
    .map(subcategory => matchesSubcategory(service, subcategory))), [[true,false,false],[false,true,false],[false,false,true]])
  assert.deepEqual(ivon.openingHours.days.slice(5).map(day => day.periods), [[], []])
})

test('nearby search, details and standalone profile agree on precise routes and current external booking modes', async () => {
  const handler = createDiscoveryHandler({ config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), sofiaOnly: true, allowAttempt: () => true,
    now: DateTime.fromMillis(now), readInternal: async () => [], readCatalogue: async () => [ivon,neli],
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden })
  const detailHandler = createPublicBusinessDetailsHandler({ config: { enabled: true },
    findCatalogue: key => [ivon, neli].find(row => row.id === key), now: () => now, allowAttempt: () => true })
  assert.equal(neliBefore.coordinates, null)
  assert.deepEqual(neli, { ...neliBefore, coordinates: neli.coordinates })
  assert.equal(pricingIdentity(neli), pricingIdentity(neliBefore))
  assert.equal(pricingIdentity(neli), proof.updatedBranch.pricingIdentity)
  assert.equal(applyNeliSlavovaBranchPointNov27([neli])[0], neli)
  const moved = { ...neliBefore, address: neliBefore.address.replace('51', '53') }
  assert.equal(applyNeliSlavovaBranchPointNov27([moved])[0], moved)
  assert.equal(catalogueBoundCoordinates({ ...neli, address: moved.address }), null)

  for (const [row, booking] of [[ivon, { kind: 'form', href: 'https://ivonservice.com/booking/' }],
    [neli, { kind: 'phone', href: 'tel:+359883399200' }]]) {
    const { latitude, longitude } = catalogueBoundCoordinates(row)
    const search = await handler(new Request('https://gorez.test/api/public/discovery', { method: 'POST',
      headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
      body: JSON.stringify({ locale: 'bg', category: row.category, browse: true, coordinates: { latitude, longitude, consent: true }, radiusKm: 1 }),
    }))
    assert.equal(search.status, 200)
    const result = (await search.json()).results.find(business => business.id === row.id)
    assert.deepEqual(result.availability, { status: 'external', slots: [] })
    const response = await detailHandler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200)
    for (const view of [result, (await response.json()).business, catalogueProfileView(row, { now })]) {
      assert.deepEqual(railExternalAction(view, now), booking)
      const route = new URL(businessDirectionsUrl(view))
      assert.equal(route.searchParams.get('destination'), latitude + ',' + longitude)
      assert.equal(route.searchParams.get('destination_place_id'), null)
    }
  }
})

test('actual service photos are visually distinct from the IVON cover and each other', async () => {
  const business = catalogueProfileView(ivon, { now })
  const [cover] = businessCoverPhotoSources(business)
  const detail = business.details.services.map(service => publicDetailServiceThumbnail(service, { business, coverSources: [cover] })?.src)
  assert.deepEqual([cover, ...detail], [proof.newBusiness.cover, ...proof.newBusiness.services.map(service => service.image)])
  const publicDirectory = fileURLToPath(new URL('../public', import.meta.url))
  const imgs = await Promise.all([cover, ...detail].map(async src => fingerprintDiscoveryPhoto(await readDiscoveryImage(publicDirectory, src))))
  for (const [index, a] of imgs.entries()) for (const b of imgs.slice(index + 1)) {
    assert.equal(compareDiscoveryPhotos(a, b), null)
  }
})
