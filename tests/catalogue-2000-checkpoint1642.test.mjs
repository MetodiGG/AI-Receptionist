import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import home013 from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-013-20261113.mjs'
import dental005 from '../lib/discovery/catalogue-data/neighborhood-dental-2000-005-20261113.mjs'
import psychology002 from '../lib/discovery/catalogue-data/neighborhood-psychology-2000-002-20261113.mjs'
import auto013 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-013-20261113.mjs'
import beauty012 from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-012-20261113.mjs'
import auto014 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-014-20261113.mjs'
import home014 from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-014-20261113.mjs'
import auto015 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-015-20261113.mjs'
import beauty013 from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-013-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const batches = [home013, dental005, psychology002, auto013, beauty012, auto014, home014, auto015, beauty013]
const records = batches.flatMap(batch => batch.records)
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = (business, service = business.services[0]) => serviceThumbnail({
  ...service, ...catalogueServicePhotoFields(service, business),
}, { business })

test('twenty-eight actual providers and thirty services are available to search and partner onboarding with exact identifiers and pricing context', () => {
  assert.equal(records.length, 28)
  assert.equal(records.flatMap(item => item.services).length, 30)
  for (const source of records) {
    const business = row(source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state,
      business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now })
      .some(item => item.id === source.id), source.id)
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    for (const [index, service] of business.services.entries()) {
      assert.equal(imported.services[index].price, service.price ? String(service.price.amount) : '', source.id)
      if (service.price) {
        assert.equal(imported.services[index].currency, service.price.currency)
        assert.equal(imported.services[index].price_details.kind, service.price.kind)
        assert.equal(imported.services[index].price_details.unit, service.price.unit)
      }
      const photo = image(business, service)
      assert.equal(photo.type, 'photo', source.id)
      assert.ok(['exact', 'activity'].includes(photo.photoMatch), source.id)
      assert.doesNotMatch(photo.src, /notebook|neutral/, source.id)
    }
  }
})

test('VM Dent publishes only the genuinely free initial consultation, not free treatment or invented opening hours', () => {
  const business = row('sofia-vm-dent-pimen-zografski14'), service = business.services[0]
  assert.equal(business.services.length, 1)
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(business.booking.kind, 'phone')
  assert.equal(business.openingHours, undefined)
  assert.equal(service.durationMin, undefined)
  assert.match(image(business).src, /dental-exam-v1\.webp$/)
  assert.equal(business.coordinates.addressId, '96366')
})

test('Existea does not turn a free phone introduction into a free in-person consultation or invent a duration or a street-range point', () => {
  const business = row('sofia-existea-magdalina-altavanska'), service = business.services[0]
  assert.equal(service.price, undefined)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.address, 'София, бул. Никола Вапцаров 17–21')
  assert.equal(business.coordinates, null)
  assert.equal(catalogueBoundCoordinates(business), null)
  assert.match(service.description, /не означава безплатна цяла присъствена консултация/)
  assert.deepEqual(business.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5, 6])
  assert.match(image(business).src, /psychology-consultation-v1\.webp$/)
})

test('BestForm retains the actual single group fee, fifty minutes and cancellation conditions while using the independent phone path', () => {
  const business = row('sofia-bestform-bulgaria60g'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency, service.durationMin], [22, 'EUR', 50])
  assert.equal(service.appointmentModel, 'group_reservation')
  assert.match(service.description, /до 5 души/)
  assert.match(service.description, /12 часа/)
  assert.match(service.description, /плащането е преди началото/)
  assert.equal(business.booking.kind, 'phone')
  assert.match(image(business).src, /sx-reformer-group-v1\.webp$/)
})

test('Spider Ink keeps two adult tattoo services, no voucher-as-price and no registered-office duplicate', () => {
  const business = row('sofia-spider-ink-mladost3-block342')
  assert.equal(business.services.length, 2)
  assert.match(business.address, /342/)
  assert.doesNotMatch(business.address, /23/)
  for (const service of business.services) {
    assert.match(service.name, /пълнолетни/)
    assert.equal(service.price, undefined)
    assert.equal(service.durationMin, undefined)
    assert.doesNotMatch(service.description, /50 EUR/)
  }
  assert.match(image(business, business.services[0]).src, /sx-tattoo-application-v1\.webp$/)
  assert.match(image(business, business.services[1]).src, /sx-tattoo-cover-up-session-v1\.webp$/)
  assert.match(business.services[1].description, /Не е лазерно премахване/)
})

test('Taormina uses literal printed euro single-procedure prices, no expired promotion or invented duration', () => {
  const business = row('sofia-taormina-druzhba2-block275')
  assert.deepEqual(business.services.map(service => [service.price.amount, service.price.currency]), [[15.34, 'EUR'], [7.67, 'EUR']])
  assert.deepEqual(business.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5, 6, 7])
  for (const service of business.services) {
    assert.equal(service.price.kind, 'fixed')
    assert.equal(service.price.unit, 'една процедура за посочената зона')
    assert.equal(service.durationMin, undefined)
    assert.match(service.name, /жени/)
    assert.match(service.description, /не е пакет или промоционална цена/)
  }
  assert.match(image(business, business.services[0]).src, /sx-laser-underarm-woman-v1\.webp$/)
  assert.match(image(business, business.services[1]).src, /sx-laser-upperlip-woman-v1\.webp$/)
})

test('specific new activity photos cannot fall back to adult-only dance, gravity oil or tyre fitting for a complete-wheel swap', () => {
  for (const [id, expected] of [
    ['sofia-mobilix-mobile-vacuum-oil', 'sx-auto-mobile-vacuum-oil'],
    ['sofia-simda-slivnitsa178-dance', 'sx-child-modern-hiphop-class'],
    ['sofia-levski-rakovski-balsha18', 'sx-football-private-coaching'],
    ['sofia-filchev-auto-mobile-tyres', 'sx-auto-mobile-tyre-car'],
    ['sofia-naydenov-mobile-tyres', 'sx-auto-mobile-tyre-fit-balance'],
    ['sofia-gumicon-mobile-tyres', 'sx-auto-mobile-tyre-fit-balance'],
  ]) assert.ok(image(row(id)).src.endsWith('/' + expected + '-v1.webp'), id)
  const manifest = JSON.parse(readFileSync(new URL('../docs/specific-service-photo-generation-2026-11-12.json', import.meta.url), 'utf8'))
  for (const id of ['sx-auto-mobile-vacuum-oil', 'sx-child-modern-hiphop-class', 'sx-laser-underarm-woman',
    'sx-laser-upperlip-woman', 'sx-football-private-coaching', 'sx-auto-mobile-tyre-fit-balance']) {
    const asset = manifest.assets.find(item => item.id === id)
    assert.equal(asset.review.status, 'accepted', id)
    assert.equal(asset.width, 256)
    assert.equal(asset.height, 256)
    assert.equal(asset.generatedOn, '2026-11-14')
    assert.ok(asset.prompt.length > 200)
    assert.equal(asset.review.sourceSha256, asset.sourceSha256)
  }
})

test('ten exact postal bindings fail closed after a move, while park/faculty/stadium points remain explicitly unverified', () => {
  for (const [id, rn] of [["sofia-allegro-vivace-andrey-lyapchev72","94959"],["sofia-allegro-vivace-dimitar-manov18","5115"],["sofia-yonev-kanchelov-dimitar-petkov111","104298"],["sofia-vm-dent-pimen-zografski14","96366"],["sofia-j-auto-jacques-duclos55","90121"],["sofia-bestform-bulgaria60g","91590"],["sofia-malketov-asen-yordanov11","23134"],["sofia-simda-slivnitsa178-dance","49666"],["sofia-iskra-iskrenova-hubavka8","24011"],["sofia-krasimir-belezhkov-hubcha2","19562"]]) {
    const business = row(id)
    assert.equal(business.coordinates.addressId, rn)
    assert.equal(business.coordinates.method, 'verified_official_address')
    assert.equal(catalogueBoundCoordinates(business), business.coordinates)
    assert.equal(catalogueBoundCoordinates({ ...business, address: business.address + 'А' }), null)
  }
  for (const id of ['sofia-nvs-workshop-tsarigradsko391', 'sofia-ax-horca-bio-dragan-tsankov8', 'sofia-levski-rakovski-balsha18']) {
    assert.equal(row(id).coordinates, null)
    assert.equal(catalogueBoundCoordinates(row(id)), null)
  }
})
