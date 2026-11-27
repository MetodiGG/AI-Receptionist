import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import receipt from '../docs/catalogue-coverage/mopart-intake-20261127.json' with { type: 'json' }
import english from '../lib/locale/service-english.json' with { type: 'json' }
import { MOPART_INTAKE_20261127_RECORDS, MOPART_INTAKE_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-mopart-intake-20261127.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { OFFICIAL_SOFIA_CSV_SHA256 } from '../lib/discovery/official-sofia-address-source.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { manualIntakeIdentity } from '../scripts/catalogue-manual-intake-review.mjs'
import approval from './fixtures/catalogue-mopart-20261127-approval.json' with { type: 'json' }
import { mopartIntakeAllowsPath, mopartIntakePriorCatalogue, mopartIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'

const now = Date.parse('2026-11-27T00:00:00Z')
const [draft] = MOPART_INTAKE_20261127_RECORDS
const [review] = MOPART_INTAKE_20261127_REVIEWS
const rows = SOFIA_CATALOGUE.filter(row => row.id === draft.id)

test('Mopart historical scope recognizes only the reviewed data, bytes, and one unmodified branch', () => {
  const cwd = new URL('../', import.meta.url)
  for (const path of [...Object.keys(approval.changed), ...Object.keys(approval.added)]) {
    assert.ok(mopartIntakeAllowsPath(path), path)
  }
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/catalogue-policy.mjs', 'public/service-photos/mopart.webp']) {
    assert.equal(mopartIntakeAllowsPath(path), false, path)
  }
  for (const path of Object.keys(approval.changed)) {
    const bytes = readFileSync(new URL(path, cwd))
    assert.deepEqual(mopartIntakePriorSource(path, bytes), execFileSync('git', ['show', approval.baseline + ':' + path], { cwd, maxBuffer: 5 * 1024 * 1024 }))
    const tampered = Buffer.concat([bytes, Buffer.from('\n')])
    assert.equal(mopartIntakePriorSource(path, tampered), tampered)
  }
  assert.deepEqual(mopartIntakePriorCatalogue(rows), [])
  assert.throws(() => mopartIntakePriorCatalogue([...rows, ...rows]), /Duplicate Mopart record/u)
  assert.throws(() => mopartIntakePriorCatalogue(rows.map(row => ({ ...row, address: row.address + 'A' }))), /Unreviewed Mopart record/u)
})

test('Mopart adds one address-bound Sofia premises and fails closed on expiry or a branch change', () => {
  assert.equal(rows.length, 1)
  const [row] = rows
  assert.equal(manualIntakeIdentity(row), receipt.business.normalizedRecordSha256)
  assert.equal(receipt.pointEvidence.csvSha256, OFFICIAL_SOFIA_CSV_SHA256)
  assert.equal(catalogueBoundCoordinates(row)?.addressId, receipt.pointEvidence.rn)
  assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Филиповци' }), null)
  assert.equal(catalogueBoundCoordinates({ ...row, address: row.address.replace('803', '801') }), null)
  assert.equal(approvedCatalogueRecord(row, Date.parse('2026-12-28T00:00:00Z')), null)
  const cell = records => catalogueCoverageReport(records, { now, target: receipt.targetPerQuarterCategory }).neighborhoods
    .find(area => area.name === row.neighborhood).cells.find(item => item.categoryId === row.category)
  const before = cell(SOFIA_CATALOGUE.filter(record => record.id !== row.id)), after = cell(SOFIA_CATALOGUE)
  assert.equal(after.count - before.count, 1)
  assert.equal(after.locatedCount - before.locatedCount, 1)
})

test('Mopart exposes the same three source-reviewed services to customers and onboarding, with no invented prices or slots', () => {
  const [row] = rows
  assert.equal(BOOKING_PRICE_REVIEWS.find(entry => entry.id === row.id), review)
  assert.deepEqual(assessPricingReview(row, review, now), {
    id: row.id, state: 'service_reviewed', pricingState: 'not_publicly_listed', checkedOn: '2026-11-27', reviewedPriceCount: 0,
  })
  const result = normalizeCatalogueBusinesses(rows, {
    cityCode: '68134', sofiaOnly: true, category: row.category, categoryFilter: true, browse: true,
  }, { now })[0]
  assert.equal(result.booking.kind, 'phone')
  assert.equal(result.booking.phone, receipt.business.phone)
  assert.deepEqual(result.availability, { status: 'external', slots: [] })
  assert.deepEqual(result.details.services.map(service => service.name), receipt.business.services)
  const onboarding = catalogueOnboardingDetail(rows, row.id, { now, cityCode: row.cityCode })
  assert.deepEqual(onboarding.services.map(service => service.name), receipt.business.services)
  assert.ok(onboarding.services.every(service => service.price === '' && service.duration_min === ''))
  assert.equal(onboarding.business.coordinates, undefined)
  assert.ok(row.services.every(service => english.names[service.name] && english.descriptions[service.description] && !service.price && !service.durationMin))

  const cover = businessCoverPhoto(result)
  assert.equal(cover.activityPhotoKey, receipt.imageEvidence.coverKey)
  const photos = result.details.services.map(service => publicDetailServiceThumbnail(service, { business: result }))
  assert.deepEqual(photos.map(photo => photo.src), receipt.imageEvidence.detailScenes)
  assert.ok(photos.every(photo => photo.source === 'illustrative' && photo.src !== cover.src && photo.src !== cover.fallbackSrc
    && existsSync(new URL('../public' + photo.src, import.meta.url))))
})
