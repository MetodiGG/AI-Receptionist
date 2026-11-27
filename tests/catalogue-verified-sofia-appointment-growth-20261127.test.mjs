import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import report from '../docs/catalogue-coverage/verified-sofia-appointment-growth-20261127.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import pricingBaseline from '../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json' with { type: 'json' }
import { businessDetailServices } from '../lib/discovery/business-details.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { railDirections, railExternalAction } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { lateOwnerPointsPriorCatalogue } from './catalogue-verified-owner-civic-points-20261127-scope.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const reviewedSnapshot = lateOwnerPointsPriorCatalogue(SOFIA_CATALOGUE)
const ids = new Set(report.verified.map(row => row.id))
const entry = id => SOFIA_CATALOGUE.find(row => row.id === id)
const host = url => new URL(url).hostname.replace(/^www\./u, '')
const previous = reviewedSnapshot.filter(row => !ids.has(row.id))
const otherBusinesses = PUBLIC_CATALOGUE.filter(row => !ids.has(row.id))
const catalogueCells = audit => [...audit.neighborhoods, ...audit.additionalNamedAreas].flatMap(area => area.cells)

test('four distinct premises fill five formerly empty Sofia quarter/category cells, without counting the two-service salon twice', () => {
  assert.equal(ids.size, 4)
  assert.equal(report.addressSource.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  const expected = report.coverage
  const [before, after] = [previous, reviewedSnapshot].map(rows => catalogueCoverageReport(rows, { now, target: expected.targetPerQuarterCategory }))
  const both = get => [get(before), get(after)]
  assert.equal(reviewedSnapshot.length - previous.length, 4)
  assert.deepEqual(both(audit => audit.counts.approvedBusinesses), expected.approvedSofiaBusinesses)
  assert.deepEqual(both(audit => audit.counts.premisesWithBoundCoordinates), expected.premisesWithBoundPoint)
  assert.deepEqual(both(audit => audit.counts.zeroCells), expected.emptyPhysicalCells)
  assert.deepEqual(both(audit => catalogueCells(audit).filter(cell => cell.locatedCount === 0).length), expected.emptyLocatedCells)
  for (const [neighborhood, category, oldCount, newCount] of expected.physicalAndLocatedCellDeltas) {
    const get = audit => audit.neighborhoods.find(area => area.name === neighborhood).cells.find(cell => cell.categoryId === category)
    assert.deepEqual(both(audit => get(audit).locatedCount), [oldCount, newCount])
    assert.deepEqual(both(audit => get(audit).count), [oldCount, newCount])
    assert.ok(ids.has(get(after).locatedBusinessIds[0]))
  }
  assert.equal(new Set([...ids].map(id => host(entry(id).website))).size, ids.size)
  for (const id of ids) {
    const row = entry(id)
    assert.ok(!otherBusinesses.some(other => host(other.website) === host(row.website) || other.address === row.address ||
      (row.phone && row.phone === other.phone)), id)
  }
})

test('exact tariffs, separate appointment requests, exclusion of unrelated offers and stated expiry survive the public detail read', async () => {
  const handler = createPublicBusinessDetailsHandler({ config: { enabled: true }, findCatalogue: entry, now: () => now, allowAttempt: () => true })
  for (const evidence of report.verified) {
    const row = entry(evidence.id), review = BOOKING_PRICE_REVIEWS.find(item => item.id === row.id)
    const profile = catalogueProfileView(row, { now })
    assert.equal(row.address, evidence.address)
    assert.equal(row.neighborhood, evidence.neighborhood)
    const point = catalogueBoundCoordinates(row)
    assert.deepEqual([point.addressId, point.latitude, point.longitude], [evidence.point.addressId, evidence.point.latitude, evidence.point.longitude])
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + ' А' }), null)
    assert.ok(!pricingBaseline.some(item => item.id === row.id))
    assert.equal(pricingIdentity(row), review.inventoryIdentity)
    assert.equal(assessPricingReview(row, review, now).state, evidence.pricingState, row.id)
    assert.equal(assessPricingReview({ ...row, services: [] }, review, now).state, 'pending', row.id)
    assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-19T00:00Z')), null)
    const response = await handler(new Request('https://gorez.test/api/public/discovery/business/' + row.id), row.id)
    assert.equal(response.status, 200, row.id)
    const { business } = await response.json()
    const services = businessDetailServices(business), covers = businessCoverPhotoSources(profile)
    assert.ok(covers.length, row.id)
    assert.equal(businessDirectionsUrl(business), businessDirectionsUrl(profile), row.id)
    assert.equal(business.details.services.length, row.services.length, row.id)
    const pictures = new Set()
    for (const service of services) {
      assert.ok(english.names[service.name], service.name)
      if (service.description) assert.ok(english.descriptions[service.description], service.name)
      assert.equal(service.price, evidence.prices?.[service.name] ?? null)
      if (service.price != null) {
        assert.equal(service.priceSourceUrl, 'https://beautyhouse.bg/ceni/')
        assert.equal(service.currency, 'EUR')
      }
      const photo = publicDetailServiceThumbnail(service, { business: profile, coverSources: covers })
      assert.ok(photo.src && existsSync(new URL('../public' + photo.src, import.meta.url)), service.name)
      assert.equal(photo.source, 'illustrative')
      assert.equal(matchesBusinessCoverPhoto(photo.src, covers), false)
      assert.ok(!pictures.has(photo.src), photo.src)
      pictures.add(photo.src)
    }
    assert.equal(railExternalAction(business, now).href, row.booking.kind === 'phone' ? 'tel:' + row.phone : row.booking.url)
  }
  const reya = entry('sofia-reya-kids-ovcha-kupel2-ivan-hadzhiyski3')
  assert.equal(reya.services.length, 1)
  assert.doesNotMatch(JSON.stringify(reya.services), /логопед|терапия|диагностика/u)
  const [hair, nails] = entry('sofia-essentisimo-banishora-karlovo7').services
  assert.match(hair.description, /измиване и подсушаване.*отделна услуга/u)
  assert.equal(nails.name, 'Маникюр с гел лак')
})

test('nearby browsing uses the civic point and matches only the selected service category in the preview', () => {
  for (const evidence of report.verified) {
    const row = entry(evidence.id), point = evidence.point
    for (const category of new Set(row.services.map(service => service.category))) {
      const intent = { cityCode: '68134', sofiaOnly: true, category, categoryFilter: true, browse: true,
        neighborhood: row.neighborhood, radiusKm: 1, coordinates: { latitude: point.latitude, longitude: point.longitude } }
      const normalize = extra => normalizeCatalogueBusinesses([row], { ...intent, ...extra }, { now })
      const [result] = normalize()
      assert.equal(result.locationStatus, 'verified_sofia', row.id)
      assert.equal(result.id, evidence.id)
      assert.ok(result.services.length > 0 && result.services.every(service => service.category === category))
      assert.deepEqual(result.availability, { status: 'external', slots: [] })
      assert.equal(new URL(railDirections(result)).searchParams.get('destination'), point.latitude + ',' + point.longitude)
      assert.deepEqual(normalize({ coordinates: { latitude: 42.55, longitude: 23.57 } }), [])
      assert.deepEqual(normalize({ neighborhood: 'Младост 5' }), [])
    }
  }
})
