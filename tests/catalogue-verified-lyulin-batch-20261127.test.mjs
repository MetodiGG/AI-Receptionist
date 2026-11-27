import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import report from '../docs/catalogue-coverage/verified-lyulin-batch-20261127.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { nearbyAddressReviewPriorCatalogue } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const ids = report.listings.map(record => record.id)
const records = ids.map(id => SOFIA_CATALOGUE.find(row => row.id === id))

test('the two independent Lyulin classrooms improve exact located coverage, not mobile or adjacent-quarter totals', () => {
  assert.equal(report.municipalExport.sha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(new Set(records.map(row => new URL(row.website).hostname)).size, 2)
  assert.equal(new Set(records.map(row => row.phone)).size, 2)
  for (const [index, row] of records.entries()) {
    const expected = report.listings[index]
    const point = catalogueBoundCoordinates(row)
    assert.equal(row.address, expected.address)
    assert.equal(row.neighborhood, 'Люлин 3')
    assert.equal(point.addressId, expected.point.addressId)
    assert.equal(point.latitude, expected.point.latitude)
    assert.equal(point.longitude, expected.point.longitude)
    assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Люлин 4' }), null)
  }
  const cell = rows => catalogueCoverageReport(rows, { now, target: 30 }).neighborhoods
    .find(area => area.name === 'Люлин 3').cells.find(entry => entry.categoryId === 'education')
  // Replay the exact approved location edits from later that day: the
  // addition report does not attribute a subsequent recovery to these schools.
  const reviewedSnapshot = nearbyAddressReviewPriorCatalogue(SOFIA_CATALOGUE)
  const before = cell(reviewedSnapshot.filter(row => !ids.includes(row.id))), after = cell(reviewedSnapshot)
  assert.deepEqual([before.count, after.count], report.coverageDelta.premises)
  assert.deepEqual([before.locatedCount, after.locatedCount], report.coverageDelta.locatedPremises)
  assert.equal(after.locatedGap, report.coverageDelta.remainingLocatedToTarget)
})

test('reviewed amounts retain their original units and external contact modes; service images differ from covers', () => {
  const results = normalizeCatalogueBusinesses(records, {
    cityCode: '68134', sofiaOnly: true, category: 'education', categoryFilter: true, browse: true,
  }, { now })
  for (const row of records) {
    const review = BOOKING_PRICE_REVIEWS.find(item => row.id === item.id)
    const [offer] = row.services
    assert.equal(assessPricingReview(row, review, now).reviewedPriceCount, 1)
    assert.equal(assessPricingReview({ ...row, services: [{ ...offer, price: { ...offer.price, amount: 99 } }] }, review, now).state, 'pending')
    assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-19T00:00:00Z')), null)
    assert.ok(english.names[offer.name] && english.descriptions[offer.description] && english.units[offer.price.unit])
    const business = results.find(item => item.id === row.id)
    assert.deepEqual(business.availability, { status: 'external', slots: [] })
    const cover = businessCoverPhoto(business)
    const image = publicDetailServiceThumbnail(business.details.services[0], { business })
    assert.ok(image.src && image.src !== cover.src && image.src !== cover.fallbackSrc, row.id)
    assert.equal(image.source, 'illustrative')
    assert.ok(existsSync(new URL('../public' + image.src, import.meta.url)))
  }
  const [solema, alice] = ids.map(id => results.find(row => row.id === id))
  assert.equal(solema.booking.kind, 'phone')
  assert.equal(solema.details.services[0].price, 8.20)
  assert.equal(solema.details.services[0].priceUnit, 'учебен час от 40 минути')
  assert.equal(alice.booking.url, 'https://alice-academy.bg/contact/')
  assert.equal(alice.details.services[0].price, 0)
  assert.match(alice.details.services[0].description, /не включва самия курс/)
})
