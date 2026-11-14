import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-011-20261113.mjs'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-011-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-010-20261113.mjs'
import studio from '../lib/discovery/catalogue-data/neighborhood-photography-2000-004-20261113.mjs'
import identities from '../lib/discovery/catalogue-data/neighborhood-reviewed-identities-20261113.json' with { type: 'json' }
import points from '../public/catalogue-official-address-points-2000-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('sixteen source-complete operators expose eighteen real services and exact prices/units/photos to partner onboarding', () => {
  const records = [auto, home, beauty, studio].flatMap(batch => batch.records)
  assert.equal(records.length, 16)
  assert.equal(records.flatMap(item => item.services).length, 18)
  for (const source of records) {
    const business = row(source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state,
      business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    business.services.forEach((service, index) => {
      assert.equal(imported.services[index].price, service.price ? String(service.price.amount) : '')
      if (service.price) {
        assert.equal(imported.services[index].currency, service.price.currency)
        assert.equal(imported.services[index].price_details.kind, service.price.kind)
        assert.equal(imported.services[index].price_details.unit, service.price.unit)
        assert.equal(imported.services[index].price_details.maximum, service.price.maximum)
      }
      assert.equal(image(business, index).type, 'photo')
      assert.ok(['exact', 'activity'].includes(image(business, index).photoMatch), `${source.id}: ${service.name}`)
    })
  }
})

test('an unconfirmed branch campaign is held completely rather than labelled genuinely unpublished', () => {
  const id = 'sofia-silver-star-ringmall-service214'
  assert.equal(row(id), undefined)
  assert.equal(identities[id], undefined)
  assert.ok(!reviews.some(item => item.id === id))
  assert.ok(!points.points.some(item => item.id === id))
  assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, id, { now }), null)
  assert.ok(!auto.records.some(item => item.id === id))
})

test('client powered eyebrow PMU, fresh ordinary massage fees and dedicated short-nail tariffs are not course or other-branch fees', () => {
  const pmu = row('sofia-eurostandart28-hair-stroke-treti-mart28')
  assert.equal(pmu.services[0].price, undefined)
  assert.match(pmu.services[0].description, /онлайн консултация със снимки/)
  assert.match(image(pmu).src, /sx-beauty-brow-machine-hairstrokes-v1\.webp$/)
  const massage = row('sofia-rapaks-masterhands-pushkin13')
  assert.deepEqual(massage.services.map(service => [service.price.amount, service.durationMin]), [[40, 30], [60, 60]])
  assert.match(image(massage).src, /sx-lower-back-massage-v1\.webp$/)
  const nails = row('sofia-the-kod-studentski-grad-block15')
  assert.equal(nails.category, 'nails')
  assert.deepEqual(nails.services.map(service => [service.price.amount, service.price.currency]), [[25.56, 'EUR'], [15.34, 'EUR']])
  assert.match(nails.services[0].name, /къси нокти/)
  assert.match(image(nails).src, /sx-nails-base-gel-polish-v1\.webp$/)
  assert.match(image(nails, 1).src, /classic-manicure-v1\.webp$/)
  assert.equal(nails.coordinates, null, 'in front ofblock15 is not the residential point')
  assert.ok(nails.services.every(service => service.durationMin === undefined))
})

test('moving labour retains per-worker costs, separate transport and minimum hours while cleaning preserves a qualified range', () => {
  const pro = row('sofia-prohamali-home-moving')
  assert.equal(pro.services[0].price.amount, 12.78)
  assert.match(pro.services[0].price.unit, /на човек/)
  assert.match(pro.services[0].description, /25,56 EUR\/час/)
  const chista = row('sofia-chista-rabota-home-moving')
  assert.equal(chista.services[0].price.amount, 17.9)
  assert.match(chista.services[0].price.unit, /минимум 2 часа · без ДДС/)
  assert.equal(chista.services[0].durationMin, undefined)
  for (const business of [pro, chista]) {
    assert.equal(business.address, null)
    assert.equal(business.coordinates, null)
    assert.match(image(business).src, /sx-home-moving-labour-no-vehicle-v1\.webp$/)
  }
  const clean = row('sofia-chisto-s-lili-home-cleaning').services[0]
  assert.deepEqual([clean.price.amount, clean.price.maximum, clean.price.currency, clean.price.kind], [150, 180, 'BGN', 'range'])
  assert.match(clean.description, /Минимална поръчка 70 лв/)
  assert.match(clean.description, /30–100%/)
})

test('interior consultation fees do not become whole-project prices or a fixed duration from an upper limit', () => {
  assert.equal(home.records.filter(item => item.services[0].price.amount === 0).length, 2)
  const kraftek = row('sofia-kraftek-design-pimen-zografski16a')
  assert.deepEqual(kraftek.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5])
  const sfumato = row('sofia-sfumato-design-home-consultation')
  assert.equal(sfumato.services[0].price.amount, 150)
  assert.match(sfumato.services[0].price.unit, /до 2 часа · без ДДС/)
  assert.equal(sfumato.services[0].durationMin, undefined)
  assert.match(sfumato.services[0].description, /без писмено становище/)
  assert.equal(sfumato.address, null, 'conflicting offices are not the selected home-visit venue')
})

test('private HEMA, shared school stretching, individual Reformer and a quarterly child dance package keep their actual contexts', () => {
  const hema = row('sofia-angel-chernaev-hema-cherkovna28')
  assert.equal(hema.services.length, 1)
  assert.equal(hema.services[0].price, undefined)
  assert.equal(hema.services[0].appointmentModel, 'individual_training')
  assert.match(image(hema).src, /sx-hema-private-coaching-v1\.webp$/)
  const stretch = row('sofia-stretching-school-hladilnika')
  assert.equal(stretch.services[0].price.amount, 9)
  assert.equal(stretch.services[0].durationMin, 60)
  const reformer = row('sofia-contrology-club-krakra2')
  assert.equal(reformer.services[0].price.amount, 33)
  assert.equal(reformer.services[0].durationMin, 50)
  assert.match(image(reformer).src, /reformer-pilates-v1\.webp$/)
  const child = row('sofia-urban-dance-studio-meridian22')
  assert.equal(child.services[0].price.amount, 192)
  assert.match(child.services[0].price.unit, /тримесечие/)
  assert.equal(child.services[0].durationMin, 60)
  assert.match(image(child).src, /sx-child-bulgarian-folk-group-v1\.webp$/)
  assert.equal(child.coordinates, null, 'near block227 is not that apartment block')
})

test('studio recording prices preserve started-hour billing versus a maximum-length from price without simulated slots', () => {
  const audio = row('sofia-it-corner-podcast-slavyanska29')
  assert.equal(audio.services[0].price.amount, 60)
  assert.match(audio.services[0].price.unit, /започнат час; без ДДС/)
  assert.match(audio.services[0].description, /30 минути по-рано/)
  assert.match(audio.services[0].description, /500 MB\/s/)
  const yep = row('sofia-yep-podcasts-tsum')
  assert.deepEqual([yep.services[0].price.amount, yep.services[0].price.currency, yep.services[0].price.kind], [590, 'BGN', 'from'])
  assert.match(yep.services[0].price.unit, /до 1,5 часа; без ДДС/)
  assert.equal(yep.services[0].durationMin, undefined)
  for (const business of [audio, yep]) {
    assert.equal(business.booking.kind, 'form')
    assert.equal(business.openingHours, undefined)
    assert.match(image(business).src, /sx-audio-podcast-conversation-v1\.webp$/)
  }
})

test('five precise postal matches and the explicitly labelled LR owner GPS retain exact address binding', () => {
  for (const [id, rn] of [['sofia-angel-chernaev-hema-cherkovna28', '26393'], ['sofia-contrology-club-krakra2', '44181'],
    ['sofia-kraftek-design-pimen-zografski16a', '99221'], ['sofia-inout-design-ishirkov23', '97068'], ['sofia-it-corner-podcast-slavyanska29', '25811']]) {
    const business = row(id)
    assert.equal(business.coordinates.addressId, rn)
    assert.equal(catalogueBoundCoordinates({ ...business, address: business.address + 'А' }), null)
  }
  const lr = row('sofia-lr-solution-parva-armiya47')
  assert.deepEqual([lr.coordinates.latitude, lr.coordinates.longitude], [42.7218145, 23.3315488])
  assert.equal(lr.coordinates.method, 'first_party_coordinates')
  assert.equal(lr.coordinates.source, 'https://www.lrsolution.bg/contacts/')
  assert.equal(catalogueBoundCoordinates({ ...lr, address: lr.address.replace('47', '48') }), null)
})
