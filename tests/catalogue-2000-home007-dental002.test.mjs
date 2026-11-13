import test from 'node:test'
import assert from 'node:assert/strict'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-007-20261113.mjs'
import dental from '../lib/discovery/catalogue-data/neighborhood-dental-2000-002-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { searchCatalogueForOnboarding, catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { reportBusinessType } from '../scripts/catalogue-expansion-report.mjs'

const now = Date.parse('2026-11-13T22:45:00Z')
const sources = [...home.records, ...dental.records]
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = business => serviceThumbnail({ ...business.services[0], ...catalogueServicePhotoFields(business.services[0], business) }, { business })

test('thirteen independent new businesses retain source-bound reviews, photos and complete registration inventories', () => {
  assert.equal(sources.length, 13)
  assert.equal(new Set(sources.map(item => item.id)).size, 13)
  assert.equal(sources.flatMap(item => item.services).length, 15)
  for (const source of sources) {
    const current = row(source.id)
    assert.equal(assessPricingReview(current, reviews.find(item => item.id === current.id), now).state, current.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', current.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: current.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === current.id), current.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, current.id, { now })
    assert.deepEqual(draft.services.map(service => service.name), current.services.map(service => service.name))
    current.services.forEach((service, index) => {
      assert.equal(draft.services[index].price, service.price ? String(service.price.amount) : '', current.id)
      const photo = serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, current) }, { business: current })
      assert.equal(photo.type, 'photo', current.id)
      assert.ok(['exact', 'activity'].includes(photo.photoMatch), current.id)
      assert.ok(!photo.src.includes('appointment-workspace'), current.id)
    })
  }
})

test('the free adult tattoo consultation is not a paid tattoo booking and electrical prices retain their scope', () => {
  const tattoo = row('sofia-magic-needle-gladstone20').services[0]
  assert.equal(tattoo.price.amount, 0)
  assert.match(tattoo.name, /консултация.*18\+/)
  assert.match(tattoo.description, /Платена сесия се договаря само на място/)
  const electrical = row('sofia-faza-home-electrical')
  assert.equal(electrical.locationKind, 'service_area')
  assert.equal(electrical.address, null)
  assert.equal(electrical.coordinates, null)
  assert.deepEqual([electrical.services[0].price.amount, electrical.services[0].price.maximum], [10, 25])
  assert.match(electrical.services[0].description, /ДДС, труд/)
  assert.match(electrical.services[0].description, /повредени кутии, нов кабел/)
})

test('real teaching branches keep unpublished private fees absent and ceramic painting is not clay shaping', () => {
  const max = home.records.filter(item => item.id.startsWith('sofia-max-international-'))
  const folk = home.records.filter(item => item.id.startsWith('sofia-folklorika-'))
  assert.equal(max.length, 3)
  assert.equal(folk.length, 3)
  assert.equal(new Set([...max, ...folk].map(item => item.address)).size, 6)
  for (const item of [...max, ...folk]) assert.equal(row(item.id).services[0].price, undefined)
  assert.equal(row('sofia-max-international-mladost3-block323').coordinates, null)
  assert.match(image(row('sofia-glinity-hadjikonstantinov88')).src, /sx-adult-ceramic-painting-v1\.webp$/)
  assert.match(image(row('sofia-folklorika-slatina-geo-milev136')).src, /sx-bulgarian-folk-group-v1\.webp$/)
})

test('dentistry is not filed under massage therapies and literal BGN fees retain after-hours qualifications', () => {
  const notov = row('sofia-nestor-notov-neru28')
  assert.equal(notov.category, 'other')
  assert.equal(notov.services[0].category, 'other')
  assert.equal(reportBusinessType(notov), 'Стоматология')
  assert.equal(notov.coordinates.addressId, '94685')
  const viodent = row('sofia-violina-damyanova-ovcha-kupel418')
  assert.deepEqual(viodent.services.map(service => service.price.amount), [10, 60])
  assert.ok(viodent.services.every(service => service.price.currency === 'BGN' && service.description.includes('1,5')))
  assert.equal(viodent.openingHours, undefined)
  const emdent = row('sofia-emdent-sarafov6')
  assert.deepEqual(emdent.services.map(service => service.price.amount), [20, 60])
  assert.ok(emdent.services.every(service => service.price.currency === 'EUR' && service.description.includes('ДДС')))
  assert.equal(emdent.openingHours, undefined, 'conflicting generic hours are not invented into a weekly schedule')
  assert.equal(emdent.coordinates.addressId, '27418')
})
