import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-003-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-004-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-13T21:00:00Z')
const row = id => SOFIA_CATALOGUE.find(value => value.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('frozen auto and beauty intakes retain nineteen real businesses and inventory-bound source receipts', () => {
  assert.equal(auto.records.length, 11)
  assert.equal(beauty.records.length, 8)
  const source = [...auto.records, ...beauty.records]
  assert.equal(new Set(source.map(item => item.id)).size, 19)
  assert.equal(source.flatMap(item => item.services).length, 35)
  for (const item of source) {
    const current = row(item.id)
    const assessment = assessPricingReview(current, reviews.find(review => review.id === item.id), now)
    assert.equal(assessment.state, current.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', item.id)
    for (let index = 0; index < current.services.length; index++) {
      const image = photo(current, index)
      assert.equal(image.type, 'photo', `${item.id}: ${index}`)
      assert.ok(['exact', 'activity'].includes(image.photoMatch), `${item.id}: ${index}`)
      assert.ok(!image.src.includes('appointment-workspace'))
    }
  }
})

test('child tennis, individual tennis and table tennis use the matching age and apparatus photos', () => {
  for (const id of ['sofia-happy-win-slavia-child-tennis', 'sofia-360tennis-borisova-child-school']) {
    assert.match(photo(row(id)).src, /sx-child-tennis-group-v1\.webp$/)
    assert.equal(row(id).services[0].appointmentModel, 'group_reservation')
  }
  for (const id of ['sofia-vk-tennis-academy-kliment4', 'sofia-pro-sport-nsa-kliment22']) {
    assert.match(photo(row(id)).src, /sx-adult-tennis-individual-v1\.webp$/)
    assert.equal(row(id).services[0].appointmentModel, 'individual_training')
  }
  for (const id of ['sofia-mega-spin-petar-mutafchiev13', 'sofia-fireball-tsarigradsko133']) {
    assert.match(photo(row(id)).src, /sx-adult-table-tennis-coaching-v1\.webp$/)
  }
})

test('table rental and coach-only components are never fabricated into complete lesson prices', () => {
  const mega = row('sofia-mega-spin-petar-mutafchiev13').services[0]
  assert.equal(mega.price, undefined)
  assert.equal(mega.durationMin, 60)
  assert.match(mega.description, /10 € са само наем на маса/)
  const pro = row('sofia-pro-sport-nsa-kliment22')
  assert.equal(pro.coordinates, null, 'a sole postal campus point is not the actual tennis court')
  assert.equal(pro.services[0].price.amount, 19.43)
  assert.match(pro.services[0].price.unit, /треньорска такса.*допълнително/)
  const vk = row('sofia-vk-tennis-academy-kliment4').services[0]
  assert.equal(vk.price.amount, 65)
  assert.match(vk.description, /Happy Hours е отделна тарифа/)
})

test('electronic AC diagnostics and workshop tyre fitting are not illustrated as leak detection or mobile assistance', () => {
  assert.match(photo(row('sofia-autoklima-evropa80')).src, /sx-auto-ac-electronic-diagnostics-v1\.webp$/)
  for (const id of ['sofia-velikan-studentski-ivan-stranski1', 'sofia-velikan-mladost3-gyumyushev265']) {
    const current = row(id)
    assert.match(photo(current).src, /sx-auto-workshop-tyre-fit-balance-v1\.webp$/)
    assert.equal(current.locationKind, 'premises')
  }
})

test('men, unpolished nails and root-colour combinations retain appropriate photos and real prices without restricted-provider tariffs', () => {
  const byWay = row('sofia-by-the-way-vrabnitsa632')
  assert.match(photo(byWay, 1).src, /sx-nails-male-natural-manicure-v1\.webp$/)
  assert.match(photo(byWay, 2).src, /classic-pedicure-v1\.webp$/)
  assert.equal(byWay.services[0].durationMin, undefined, '90–120 minutes is not a fixed scalar')
  assert.equal(byWay.services[0].price.kind, 'range')
  const emotion = row('sofia-emotion-teodora-bulgaria106')
  assert.match(photo(emotion, 1).src, /sx-hair-root-colour-rough-dry-v1\.webp$/)
  assert.match(photo(emotion, 2).src, /sx-barber-cut-wash-style-v1\.webp$/)
  assert.equal(row('sofia-makeup-lashes-brows-banat17'), undefined, 'provider-dependent tariff remains held after source terms review')
  const alex = row('sofia-alex-nails-bademova11')
  assert.deepEqual(alex.services.map(service => service.price.amount), [45, 30, 55])
  assert.ok(alex.services.every(service => service.price.currency === 'BGN'), 'retain original factual source currency; existing presentation converts it to EUR')
  assert.deepEqual(row('sofia-miracle-barber-obikolna275').services.map(service => service.price.amount), [15, 20, 13], 'current own tariff supersedes the old platform snapshot')
})
