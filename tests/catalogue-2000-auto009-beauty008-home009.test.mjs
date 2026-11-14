import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-009-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-008-20261113.mjs'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-009-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { reportBusinessType } from '../scripts/catalogue-expansion-report.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })
const draft = business => catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })

test('nineteen new independent operators expose twenty source-bound service photos and literal qualified prices in partner onboarding', () => {
  const sources = [...auto.records, ...beauty.records, ...home.records]
  assert.equal(sources.length, 19)
  assert.equal(sources.flatMap(item => item.services).length, 20)
  for (const source of sources) {
    const business = row(source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === business.id), now).state, business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', business.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === business.id), business.id)
    const imported = draft(business)
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    business.services.forEach((service, index) => {
      assert.equal(imported.services[index].price, service.price ? String(service.price.amount) : '', business.id)
      if (service.price) {
        assert.equal(imported.services[index].currency, service.price.currency)
        assert.equal(imported.services[index].price_details.kind, service.price.kind)
        assert.equal(imported.services[index].price_details.unit, service.price.unit)
      }
      assert.equal(photo(business, index).type, 'photo', business.id)
      assert.ok(['exact', 'activity'].includes(photo(business, index).photoMatch), business.id)
    })
  }
})

test('child individual swimming, unspecified-apparatus group Pilates and group Reformer retain distinct contexts', () => {
  const child = row('sofia-pluven-klub-lyulin-33ou')
  assert.equal(child.services[0].price.amount, 25)
  assert.match(child.services[0].name, /дете от 5 години/)
  assert.equal(child.services[0].durationMin, undefined)
  assert.match(photo(child).src, /sx-child-swimming-individual-v1\.webp$/)
  const group = row('sofia-west-gym-gevgeliyski-pilates')
  assert.equal(group.services[0].price.amount, 5.11)
  assert.equal(group.services[0].durationMin, 60)
  assert.match(photo(group).src, /sx-group-pilates-standing-control-v1\.webp$/)
  assert.equal(group.coordinates, null, 'opposite block1 is not its address point')
  const reformer = row('sofia-house-of-pilates-van-gogh1')
  assert.equal(reformer.services[0].price.amount, 20.45)
  assert.match(photo(reformer).src, /sx-reformer-group-v1\.webp$/)
  assert.equal(reformer.coordinates.addressId, '122994')
})

test('five actual Nosia venues have no guessed fees or durations and the mobile garage has no fake base pin', () => {
  const branches = auto.records.filter(item => item.id.startsWith('sofia-nosia-'))
  assert.equal(branches.length, 5)
  assert.equal(new Set(branches.map(item => item.address)).size, 5)
  for (const source of branches) {
    const business = row(source.id)
    assert.equal(business.services[0].price, undefined)
    assert.equal(business.services[0].durationMin, undefined)
    assert.equal(draft(business).services[0].price, '')
    assert.equal(business.booking.url, 'https://nosia-bg.com/join-us/')
  }
  assert.equal(row('sofia-nosia-mladost4').coordinates, null, 'two entrances are not guessed')
  const mobile = row('sofia-global-autofix-mobile')
  assert.equal(mobile.locationKind, 'service_area')
  assert.equal(mobile.address, null)
  assert.equal(mobile.coordinates, null)
  assert.equal(mobile.services[0].price, undefined)
  assert.match(mobile.services[0].name, /непалещ автомобил/)
})

test('solarium prices remain per minute and tattoo fees remain adult-only from prices without a blocked calendar', () => {
  const solarium = row('sofia-mavelle-godech3')
  assert.equal(solarium.services[0].price.amount, 0.7)
  assert.equal(solarium.services[0].price.unit, 'минута')
  assert.equal(draft(solarium).services[0].price_details.unit, 'минута')
  assert.match(draft(solarium).services[0].catalogueHint.priceLabel, /минута/)
  assert.equal(solarium.services[0].durationMin, undefined)
  assert.match(photo(solarium).src, /sx-vertical-solarium-equipment-v1\.webp$/)
  const tattoo = row('sofia-vean-tattoo-stambolov6')
  assert.equal(tattoo.category, 'other')
  assert.equal(reportBusinessType(tattoo), 'Татуировки и пиърсинг')
  assert.equal(tattoo.booking.kind, 'phone')
  assert.ok(tattoo.services.every(service => service.category === 'other' && service.price.currency === 'BGN' && service.price.kind === 'from' && service.price.amount === 100))
  assert.ok(tattoo.services.every(service => /пълнолетни/.test(service.name)))
  assert.match(photo(tattoo).src, /sx-tattoo-application-v1\.webp$/)
  assert.match(photo(tattoo, 1).src, /sx-tattoo-cover-up-session-v1\.webp$/)
})

test('language packages and academic-unit fees are not flattened into one visit or an invented duration', () => {
  const omega = row('sofia-omega-vitosha29')
  assert.equal(omega.services[0].price.amount, 165)
  assert.match(omega.services[0].price.unit, /10 учебни часа по 40 минути/)
  assert.equal(omega.services[0].durationMin, undefined)
  const studio = row('sofia-studio-s-mladost1-chomakov4a')
  assert.equal(studio.services[0].price.amount, 19)
  assert.match(draft(studio).services[0].price_details.unit, /минимум 4 урока по 2 учебни часа/)
  assert.match(studio.services[0].description, /26%/)
  const olympia = row('sofia-olympia-tsaribrodska75')
  assert.equal(olympia.services[0].price.amount, 225)
  assert.match(olympia.services[0].price.unit, /10 учебни часа по 45 минути/)
  assert.match(olympia.services[0].description, /до 5 седмици/)
  assert.equal(olympia.openingHours, undefined, 'administration hours are not lessons')
})

test('cleaning minimum order, VAT and consultation windows remain visible without treating inspections as paid cleaning', () => {
  const clean = row('sofia-clean-bg-home-cleaning')
  assert.equal(clean.services[0].price.amount, 10.25)
  assert.match(draft(clean).services[0].price_details.unit, /минимум поръчка 99 EUR; без ДДС/)
  assert.match(photo(clean).src, /sx-home-upholstery-extraction-macro-v1\.webp$/)
  const cinderella = row('sofia-pepelyashka-home-cleaning')
  assert.equal(cinderella.services[0].price.amount, 3)
  assert.match(cinderella.services[0].price.unit, /минимум 120 EUR/)
  assert.match(cinderella.services[0].description, /\+100%/)
  const divinity = row('sofia-divinity-home-cleaning')
  assert.equal(divinity.services[0].price.kind, 'from')
  assert.equal(divinity.services[0].price.amount, 60)
  assert.equal(divinity.booking.kind, 'phone')
  assert.match(divinity.services[0].description, /Безплатният оглед не е безплатно почистване/)
  const lawyer = row('sofia-hristo-vasilev-james-bourchier103')
  assert.equal(lawyer.services[0].price, undefined)
  assert.ok(lawyer.openingHours.days.every(day => day.weekday <= 5 && day.periods[0].open === '12:00' && day.periods[0].close === '15:00'))
  const court = row('sofia-double-yellow-squash-nsa')
  assert.equal(court.services[0].price.amount, 16)
  assert.match(court.services[0].description, /целия корт/)
  assert.match(court.services[0].description, /22 EUR/)
  assert.equal(court.coordinates, null, 'unconfirmed campus physical building remains held')
})
