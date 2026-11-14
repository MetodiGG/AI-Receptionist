import test from 'node:test'
import assert from 'node:assert/strict'
import batch from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-011-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = (business, index) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('two real hair and SPA venues expose all six published-price services to public and partner catalogue selection', () => {
  assert.equal(batch.records.length, 2)
  assert.equal(batch.records.flatMap(item => item.services).length, 6)
  for (const source of batch.records) {
    const business = row(source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state, 'reviewed')
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id))
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(item => item.name), business.services.map(item => item.name))
    assert.deepEqual(imported.services.map(item => item.price), business.services.map(item => String(item.price.amount)))
    business.services.forEach((service, index) => {
      assert.equal(service.price.currency, 'EUR')
      assert.equal(image(business, index).type, 'photo')
      assert.ok(['exact', 'activity'].includes(image(business, index).photoMatch))
    })
  }
})

test('women haircut and blow-dry photos preserve hair-length variants without illustrating an unlisted washing inclusion', () => {
  const business = row('sofia-valentin-hair-spot-san-stefano22')
  assert.deepEqual(business.services.map(item => item.price.amount), [49, 59, 24])
  assert.match(image(business, 0).src, /sx-womens-short-cut-blowdry-v1\.webp$/)
  assert.match(image(business, 1).src, /sx-womens-long-cut-blowdry-v1\.webp$/)
  assert.match(image(business, 2).src, /mens-haircut-v1\.webp$/)
  assert.ok(business.services.every(item => item.durationMin === undefined))
  assert.equal(business.openingHours.days.length, 7)
  assert.deepEqual(business.openingHours.days[6].periods, [])
})

test('SPA uses its real owned reservation form and procedure durations without hotel availability, clinical claims or a forced partial zone', () => {
  const business = row('sofia-vitosha-park-spa-baku5')
  assert.equal(business.booking.kind, 'form')
  assert.equal(business.booking.url, 'https://spa.vitoshaparkhotel.com/spa/reservations')
  assert.deepEqual(business.services.map(item => [item.price.amount, item.durationMin]), [[49, 55], [65, 90], [29, 30]])
  assert.ok(business.services.every(item => /15 минути/.test(item.description)))
  assert.match(business.services[2].name, /избрана зона/)
  assert.match(business.services[2].description, /Зоната се уточнява/)
  assert.equal(business.openingHours, undefined)
  assert.ok(business.services.every(item => !/Не са проверявани/.test(item.description)))
})

test('a possible yoga co-location is not counted as an additional merchant without current identity and venue proof', () => {
  assert.ok(!batch.records.some(item => /dharma/.test(item.website + item.id)))
  assert.ok(batch.records.every(item => item.services.length === 3))
})
