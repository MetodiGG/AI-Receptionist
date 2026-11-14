import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-007-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-007-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-13T23:50:00Z')
const sources = [...auto.records, ...beauty.records]
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('eighteen real businesses expose thirty-three source-bound services and specific photos to partner onboarding', () => {
  assert.equal(sources.length, 18)
  assert.equal(new Set(sources.map(item => item.id)).size, 18)
  assert.equal(sources.flatMap(item => item.services).length, 33)
  for (const source of sources) {
    const business = row(source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === business.id), now).state, business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', business.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
    assert.deepEqual(draft.services.map(service => service.name), business.services.map(service => service.name))
    business.services.forEach((service, index) => {
      assert.equal(draft.services[index].price, service.price ? String(service.price.amount) : '', business.id)
      if (service.price) assert.equal(draft.services[index].currency, service.price.currency)
      assert.equal(photo(business, index).type, 'photo', business.id)
      assert.ok(['exact', 'activity'].includes(photo(business, index).photoMatch), business.id)
    })
  }
})

test('mobile pre-purchase inspection is not a workshop and horizontal suspension testing is not a combined test fee', () => {
  const mobile = row('sofia-redline-speed-prepurchase-mobile')
  assert.equal(mobile.locationKind, 'service_area')
  assert.equal(mobile.address, null)
  assert.equal(mobile.coordinates, null)
  assert.equal(mobile.services[0].price.amount, 100)
  assert.match(mobile.services[0].description, /при продавача/)
  assert.match(mobile.services[0].description, /ДДС и транспорт/)
  assert.match(photo(mobile).src, /sx-auto-seller-prepurchase-visit-v1\.webp$/)
  const test = row('sofia-dunev-motor-sport-asen-yordanov4')
  assert.equal(test.services[0].price.amount, 40)
  assert.match(test.services[0].description, /вертикалният тест е отделна/)
  assert.match(photo(test).src, /sx-auto-horizontal-suspension-play-test-v1\.webp$/)
})

test('six actual Gaitani venues keep seven-euro single visits without fake slots, room clones or landmark pins', () => {
  const branches = auto.records.filter(item => item.id.startsWith('sofia-gaitani-'))
  assert.equal(branches.length, 6)
  assert.equal(new Set(branches.map(item => item.address)).size, 6)
  for (const source of branches) {
    const business = row(source.id)
    assert.equal(business.services[0].price.amount, 7)
    assert.equal(business.services[0].durationMin, undefined)
    assert.match(business.services[0].description, /не гарантира свободно място/)
    assert.equal(business.openingHours, undefined)
  }
  assert.equal(row('sofia-gaitani-mladost3-bl334').coordinates, null, 'near block334 is not the venue postal address')
  assert.equal(row('sofia-gaitani-lozenets-139ou').coordinates, null, 'two exact school postal rows remain ambiguous')
  assert.equal(row('sofia-baiadery-mladost2-budnina').services[0].price, undefined)
})

test('ordinary beauty tariffs retain staff tier, source currency, lash conditions and massage service windows', () => {
  assert.deepEqual(row('sofia-tinta-cherni-vrah181d').services.map(service => service.price.currency), ['BGN', 'BGN', 'BGN'])
  const gbar = row('sofia-gbar-gorski-patnik40')
  assert.deepEqual(gbar.services.map(service => service.price.amount), [33, 28, 40])
  assert.match(gbar.services[2].description, /без укрепване/)
  assert.equal(gbar.coordinates, null, 'unknown entrance among three is not chosen')
  const lashes = row('sofia-benyova-lyulin769b')
  assert.match(lashes.services[2].name, /до 3 седмици/)
  assert.match(photo(lashes, 1).src, /sx-lash-lift-and-tint-v1\.webp$/)
  assert.match(photo(lashes, 2).src, /sx-beauty-lash-refill-v1\.webp$/)
  const veda = row('sofia-veda-metodi-andonov106')
  assert.match(veda.services[0].description, /понеделник–четвъртък, 16:00–21:00/)
  assert.match(veda.services[1].description, /петък–неделя/)
  assert.equal(veda.openingHours, undefined, 'pool hours are not massage availability')
})

test('Asen Yordanov street10 and boulevard4 remain separate postal destinations and tiny-dog coat photos stay distinct', () => {
  const dog = row('sofia-groom-tosia-asen-yordanov10')
  const auto = row('sofia-dunev-motor-sport-asen-yordanov4')
  assert.equal(dog.coordinates.addressId, '121704')
  assert.equal(auto.coordinates.addressId, '93542')
  assert.match(dog.coordinates.sourceAddress, /ул\. Асен Йорданов 10/)
  assert.match(auto.coordinates.sourceAddress, /бул\. Асен Йорданов 4/)
  assert.ok(Math.abs(dog.coordinates.longitude - auto.coordinates.longitude) > 0.05)
  assert.deepEqual(dog.services.map(service => service.price.amount), [30, 40, 40])
  for (const [index, id] of ['sx-groom-small-shortcoat', 'sx-groom-small-flowing-coat', 'sx-groom-small-double-coat'].entries()) assert.match(photo(dog, index).src, new RegExp(id + '-v1\\.webp$'))
})
