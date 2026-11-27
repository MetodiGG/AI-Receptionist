import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'
import report from '../docs/catalogue-coverage/verified-sofia-cross-quarter-20261127.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import pricingBaseline from '../lib/discovery/catalogue-data/pricing-review-baseline-20261110.json' with { type: 'json' }
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const ids = new Set(report.newBranches.map(row => row.id))
const source = SOFIA_CATALOGUE.filter(row => ids.has(row.id))
const existing = PUBLIC_CATALOGUE.filter(row => !ids.has(row.id))
const host = value => new URL(value).hostname.replace(/^www\./u, '')

test('three distinct verified premises fill the zero Връбница 2 education cell without expanding to adjacent areas', () => {
  assert.equal(source.length, 3)
  assert.equal(new Set(source.map(row => host(row.website))).size, source.length)
  assert.equal(report.addressSource.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  const before = catalogueCoverageReport(SOFIA_CATALOGUE.filter(row => !ids.has(row.id)), { now, target: 30 })
  const after = catalogueCoverageReport(SOFIA_CATALOGUE, { now, target: 30 })
  assert.deepEqual([before.counts.approvedBusinesses, after.counts.approvedBusinesses], report.beforeAfter.approvedSofiaBusinesses)
  assert.deepEqual([before.counts.zeroCells, after.counts.zeroCells], report.beforeAfter.emptyCells)
  for (const evidence of report.newBranches) {
    const entry = source.find(row => row.id === evidence.id)
    assert.ok(!existing.some(other => host(other.website) === host(entry.website) || (entry.phone && entry.phone === other.phone)))
    assert.equal(entry.address, evidence.address)
    assert.equal(entry.neighborhood, evidence.neighborhood)
    const point = catalogueBoundCoordinates(entry)
    assert.deepEqual([point.addressId, point.latitude, point.longitude], [evidence.point.addressId, evidence.point.latitude, evidence.point.longitude])
    assert.equal(catalogueBoundCoordinates({ ...entry, address: entry.address + 'А' }), null)
    const cell = audit => audit.neighborhoods.find(row => row.name === entry.neighborhood).cells.find(row => row.categoryId === entry.category)
    assert.deepEqual([cell(before).locatedCount, cell(after).locatedCount], evidence.locatedInCell)
    assert.ok(cell(after).locatedBusinessIds.includes(entry.id))
  }
})

test('external enquiry terms, exact prices and service photos are preserved without creating appointments', () => {
  for (const evidence of report.newBranches) {
    const entry = source.find(row => row.id === evidence.id)
    const review = BOOKING_PRICE_REVIEWS.find(row => row.id === entry.id)
    assert.ok(!pricingBaseline.some(row => row.id === entry.id), entry.id)
    assert.equal(pricingIdentity(entry), evidence.pricingIdentity)
    assert.equal(assessPricingReview(entry, review, now).state, evidence.price ? 'reviewed' : 'service_reviewed')
    assert.equal(assessPricingReview({ ...entry, booking: { kind: 'form', url: entry.website } }, review, now).state, 'pending')
    assert.equal(approvedCatalogueRecord(entry, Date.parse('2026-12-19T00:00:00Z')), null)
    const business = normalizeCatalogueBusinesses([entry], { cityCode: '68134', sofiaOnly: true,
      category: entry.category, categoryFilter: true, browse: true }, { now })[0]
    assert.equal(business.booking.kind, 'form')
    assert.equal(host(business.booking.url), host(entry.website))
    assert.deepEqual(business.availability, { status: 'external', slots: [] })
    const cover = businessCoverPhoto(business)
    const pictures = []
    for (const service of business.details.services) {
      assert.ok(english.names[service.name] && english.descriptions[service.description], service.name)
      assert.equal(service.price, evidence.price?.amount ?? null)
      assert.equal(service.priceUnit, evidence.price?.unit ?? '')
      if (evidence.price) {
        assert.equal(service.priceSourceUrl, evidence.price.source)
        assert.match(service.description, /целия пакет.*капаро/u)
      }
      const photo = publicDetailServiceThumbnail(service, { business })
      assert.ok(photo.src && photo.src !== cover.src && photo.src !== cover.fallbackSrc, entry.id)
      assert.ok(existsSync(new URL('../public' + photo.src, import.meta.url)))
      assert.equal(photo.source, 'illustrative')
      pictures.push(photo.src)
    }
    assert.equal(new Set(pictures).size, pictures.length)
  }
})
