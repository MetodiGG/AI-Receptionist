import test from 'node:test'
import assert from 'node:assert/strict'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-009-20261113.mjs'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-010-20261113.mjs'
import studio from '../lib/discovery/catalogue-data/neighborhood-photography-2000-003-20261113.mjs'
import sport from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-010-20261113.mjs'
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
const image = business => serviceThumbnail({ ...business.services[0], ...catalogueServicePhotoFields(business.services[0], business) }, { business })

test('seventeen independent operators have exact booking review targets, real service photos and usable partner imports', () => {
  const records = [beauty, home, studio, sport].flatMap(batch => batch.records)
  assert.equal(records.length, 17)
  assert.equal(records.flatMap(item => item.services).length, 17)
  for (const source of records) {
    const business = row(source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    const receipt = reviews.find(item => item.id === source.id)
    assert.equal(receipt.bookingEntry, business.booking.kind === 'form' ? business.booking.url : 'phone')
    assert.equal(assessPricingReview(business, receipt, now).state, business.services[0].price ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(draft.services.map(service => service.name), business.services.map(service => service.name))
    const price = business.services[0].price
    assert.equal(draft.services[0].price, price ? String(price.amount) : '')
    if (price) {
      assert.equal(draft.services[0].currency, price.currency)
      assert.equal(draft.services[0].price_details.kind, price.kind)
      assert.equal(draft.services[0].price_details.unit, price.unit)
    }
    assert.equal(image(business).type, 'photo')
    assert.ok(['exact', 'activity'].includes(image(business).photoMatch), source.id)
    assert.ok(!image(business).src.includes('appointment-workspace'))
  }
})

test('personal colour analysis is not makeup and a group Mysore visit is not a private lesson or subscription', () => {
  const colour = row('sofia-image-style-rosie-fil-madrid39')
  assert.equal(colour.category, 'consulting')
  assert.equal(colour.services[0].durationMin, 90)
  assert.equal(colour.services[0].price.amount, 140)
  assert.match(image(colour).src, /sx-personal-colour-analysis-drapes-v1\.webp$/)
  const yoga = row('sofia-tristana-ashtanga-iskar54')
  assert.equal(yoga.services[0].price.amount, 12)
  assert.equal(yoga.services[0].durationMin, undefined)
  assert.equal(yoga.services[0].appointmentModel, 'group_reservation')
  assert.ok(yoga.booking.url.includes('/viewform?'))
  assert.ok(!yoga.booking.url.includes('/edit'))
  assert.match(image(yoga).src, /yoga-class-v1\.webp$/)
})

test('only four explicitly free preliminary meetings are zero-priced and two unpublished consultations remain blank', () => {
  const free = home.records.filter(item => item.services[0].price?.amount === 0)
  assert.equal(free.length, 4)
  assert.equal(home.records.filter(item => !item.services[0].price).length, 2)
  assert.equal(row('sofia-kuhnia-bg-geshov2e').services[0].durationMin, 15)
  const pegas = row('sofia-pegasland-vasil-zlatarev54').services[0]
  assert.equal(pegas.durationMin, undefined, 'up to30minutes is not a fixed length')
  assert.match(pegas.description, /до 30 минути/)
  const verde = row('sofia-verde-interiori-home-consultation').services[0]
  assert.equal(verde.price.amount, 50)
  assert.match(verde.price.unit, /без ДДС/)
  assert.equal(row('sofia-hamefa-kliment-ohridski105d').services[0].price, undefined)
  assert.equal(row('sofia-dream-design-home-consultation').services[0].price, undefined)
})

test('citywide interior visits have no fake showroom pins and curtain measurements are not illustrated as cleaning', () => {
  for (const source of home.records.filter(item => item.locationKind === 'service_area')) {
    const business = row(source.id)
    assert.equal(business.address, null)
    assert.equal(business.coordinates, null)
    assert.equal(business.openingHours, undefined)
  }
  const curtain = row('sofia-tendencia-mobile-showroom')
  assert.match(image(curtain).src, /sx-curtain-blind-home-measurement-v1\.webp$/)
  assert.match(image(row('sofia-hamefa-kliment-ohridski105d')).src, /sx-interior-design-consultation-v1\.webp$/)
})

test('hourly studio prices retain minimum, VAT and extras without inventing duration or live calendar availability', () => {
  const recording = row('sofia-slightly-offensive-strandzha52a')
  assert.equal(recording.services[0].price.amount, 60)
  assert.equal(recording.services[0].price.kind, 'from')
  assert.equal(recording.services[0].durationMin, undefined)
  assert.match(image(recording).src, /sx-audio-recording-v1\.webp$/)
  const rental = row('sofia-anamorph-istoria-slavyanobalgarska7')
  assert.equal(rental.services[0].price.amount, 80)
  assert.match(rental.services[0].price.unit, /минимум 3 часа; без ДДС/)
  assert.match(rental.services[0].description, /почистване 80 €/)
  assert.equal(rental.services[0].durationMin, undefined)
  assert.equal(rental.openingHours, undefined, '24/7 access by reservation is not ordinary service hours')
  assert.equal(rental.booking.url, 'https://anamorphstudio.com/bg/contact-us/')
})

test('private coached sport fees are distinct from court admission, group packages and arbitrary player counts', () => {
  const golf = row('sofia-city-golf-academy-abagar462')
  assert.equal(golf.services[0].price.amount, 61.2)
  assert.equal(golf.services[0].durationMin, 50)
  assert.match(image(golf).src, /sx-indoor-golf-simulator-lesson-v1\.webp$/)
  const padel = row('sofia-premier-padel-private-georgi-belov5')
  assert.equal(padel.booking.kind, 'phone')
  assert.equal(padel.services[0].price.amount, 50)
  assert.equal(padel.services[0].durationMin, 60)
  assert.match(padel.services[0].description, /Включени са кортът и падел ракетата/)
  assert.match(image(padel).src, /sx-private-padel-coaching-v1\.webp$/)
  const crossfit = row('sofia-crossfit-serdika-vasil-levski')
  assert.equal(crossfit.services[0].price.amount, 35.79)
  assert.equal(crossfit.services[0].durationMin, 60)
  assert.equal(crossfit.booking.phone, '+359886321377')
  assert.match(image(crossfit).src, /sx-crossfit-private-kettlebell-coaching-v1\.webp$/)
})

test('monthly aikido, winter tennis rental and unpublished minifootball remain three different service units', () => {
  const aikido = row('sofia-plamen-yurukov-aikido-dianabad')
  assert.equal(aikido.services[0].price.amount, 80)
  assert.equal(aikido.services[0].price.currency, 'BGN')
  assert.match(aikido.services[0].price.unit, /месечна такса/)
  assert.equal(aikido.services[0].durationMin, undefined)
  assert.match(image(aikido).src, /sx-aikido-adult-group-v1\.webp$/)
  const tennis = row('sofia-sport-complex-lozenets-tennis-kozyak2')
  assert.equal(tennis.services[0].price.amount, 30)
  assert.match(tennis.services[0].price.unit, /ноември–април/)
  assert.match(tennis.services[0].description, /включен ДДС/)
  assert.match(image(tennis).src, /sx-indoor-tennis-court-rental-v1\.webp$/)
  assert.equal(row('sofia-greensport-minifootball-geomilev158').services[0].price, undefined)
})

test('four exact postal bindings and GreenSport owner destination fail closed after identity/address edits', () => {
  for (const [id, rn] of [['sofia-image-style-rosie-fil-madrid39', '44619'], ['sofia-symmetry-design-bulgaria105a', '120246'],
    ['sofia-slightly-offensive-strandzha52a', '46962'], ['sofia-plamen-yurukov-aikido-dianabad', '34419']]) {
    const business = row(id)
    assert.equal(business.coordinates.addressId, rn)
    assert.equal(business.coordinates.method, 'verified_official_address')
    assert.equal(catalogueBoundCoordinates({ ...business, website: 'https://example.com/' }), null)
  }
  const green = row('sofia-greensport-minifootball-geomilev158')
  assert.deepEqual([green.coordinates.latitude, green.coordinates.longitude], [42.6767565, 23.3805799])
  assert.equal(green.coordinates.method, 'first_party_coordinates')
  assert.equal(catalogueBoundCoordinates({ ...green, address: green.address + 'А' }), null)
  assert.equal(row('sofia-double-yellow-squash-nsa').coordinates, null, 'campus postal point is not the actual squash building')
})
