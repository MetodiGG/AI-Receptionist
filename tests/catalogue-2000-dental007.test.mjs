import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import intake from '../lib/discovery/catalogue-data/neighborhood-dental-2000-007-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const business = SOFIA_CATALOGUE.find(row => row.id === 'sofia-noradent-slavyanska6')
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('Nora is one actual phone-booked dental practice with three reviewed services available for partner import', () => {
  assert.equal(intake.records.length, 1)
  assert.equal(business.address, 'София, ул. Славянска 6')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359899128852' })
  assert.equal(assessPricingReview(business, reviews.find(row => row.id === business.id), now).state, 'reviewed')
  assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now })
    .some(row => row.id === business.id))
  const detail = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
  assert.deepEqual(detail.services.map(row => row.name), business.services.map(row => row.name))
  assert.deepEqual(detail.services.map(row => row.price), ['42', '42', '98'])
  assert.ok(detail.services.every(row => row.currency === 'EUR' && row.duration_min === ''))
  assert.ok(!reviews.find(row => row.id === business.id).reviewedUrls.some(url => /fresha/i.test(url)))
})

test('adult and child first examinations and grade-one cleaning retain their literal variants without made-up minutes or hours', () => {
  assert.deepEqual(business.services.map(row => row.price.amount), [42, 42, 98])
  assert.ok(business.services.every(row => row.durationMin === undefined && row.price.kind === 'fixed'))
  assert.equal(business.openingHours, undefined)
  assert.match(business.services[0].name, /Първичен.*преглед/)
  assert.match(business.services[1].name, /за дете/)
  assert.match(business.services[1].description, /Не включва.*четка и паста/)
  assert.equal(business.services[2].price.unit, 'първично почистване и Airflow, степен 1')
  assert.match(business.services[2].description, /Степен 2.*други тарифи/)
  assert.ok(business.services.every(row => row.price.sourceUrl === 'https://www.noradent.bg/prices/'))
})

test('the differently worded child examination has an explicit real child-exam photo rather than the neutral notebook fallback', () => {
  const expected = ['dental-exam', 'child-dental-exam', 'sx-dental-scale-airflow']
  business.services.forEach((service, index) => {
    const fields = catalogueServicePhotoFields(service, business)
    const image = serviceThumbnail({ ...service, ...fields }, { business })
    assert.equal(fields.illustrativePhotoKey, expected[index])
    assert.equal(image.src, '/service-photos/' + expected[index] + '-v1.webp')
    assert.equal(image.type, 'photo')
    assert.equal(image.source, 'illustrative')
    assert.equal(image.photoMatch, 'activity')
    assert.doesNotMatch(image.src, /neutral|notebook|appointment-workspace/)
  })
})

test('promoting the existing child image preserves its original generation date, source/public hashes and distinct legacy provenance', () => {
  const original = json('../docs/service-photo-generation-2026-11-12.json')
  const asset = original.images.find(row => row.id === 'child-dental-exam')
  const review = json('../docs/catalogue-pricing/expansion-dental-2000-007-20261113.json').rootExistingPhotoReReview
  const specific = json('../docs/specific-service-photo-generation-2026-11-12.json')
  assert.equal(original.generatedOn, '2026-11-12')
  assert.equal(review.asset.generatedOn, original.generatedOn)
  assert.equal(review.checkedOn, '2026-11-14')
  assert.equal(review.asset.sourceSha256, asset.sourceSha256)
  assert.equal(review.asset.sha256, asset.sha256)
  assert.equal(review.asset.review.status, 'accepted')
  assert.ok(!specific.assets.some(row => row.id === asset.id), 'legacy asset must not create an unreferenced SX-only generation record')
  const bytes = readFileSync(new URL('../' + asset.file, import.meta.url))
  assert.equal(bytes.length, asset.bytes)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
  assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now: Date.parse('2027-02-13T12:00:00Z') }), null)
})
