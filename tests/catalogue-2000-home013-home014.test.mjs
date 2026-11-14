import test from 'node:test'
import assert from 'node:assert/strict'
import home013 from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-013-20261113.mjs'
import home014 from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-014-20261113.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as integratedReviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const batches = [home013, home014]
const records = batches.flatMap(batch => validateCatalogue(batch.records))
const row = id => records.find(item => item.id === id)
const sourceReview = id => batches.flatMap(batch => batch.reviews).find(item => item.id === id)
// Intake014 is deliberately tested without requiring its shared integration.
// This temporary identity is never written to a catalogue receipt/baseline.
const intakeReview = business => ({ ...sourceReview(business.id), inventoryIdentity: pricingIdentity(business) })

test('frozen home013 and home014 retain ten distinct source inventories without invented source coordinates or durations', () => {
  assert.deepEqual(batches.map(batch => [batch.records.length, batch.reviews.length]), [[6, 6], [4, 4]])
  assert.equal(records.length, 10)
  assert.equal(new Set(records.map(item => item.id)).size, 10)
  assert.equal(records.flatMap(item => item.services).length, 10)
  for (const business of records) {
    assert.ok(approvedCatalogueRecord(business, now), business.id)
    assert.equal(business.coordinates, null, 'source intake does not invent an owner marker')
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.equal(business.services[0].durationMin, undefined, business.id)
  }
  for (const business of validateCatalogue(home013.records)) {
    const review = integratedReviews.find(item => item.id === business.id)
    assert.equal(assessPricingReview(business, review, now).state,
      business.services[0].price ? 'reviewed' : 'service_reviewed', business.id)
  }
  for (const business of validateCatalogue(home014.records)) {
    assert.equal(assessPricingReview(business, intakeReview(business), now).state,
      business.services[0].price ? 'reviewed' : 'service_reviewed', business.id)
  }
})

test('FAMETE charges twenty-five euros per forty-five-minute academic unit, not a package or fixed appointment length', () => {
  const business = row('sofia-famete-rakovski99'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [25, 'EUR', 'fixed'])
  assert.equal(service.price.unit, 'учебен час · 45 минути')
  assert.equal(service.price.sourceUrl, 'https://www.fatibg.com/individualni-uroci-po-nemski-ezik/')
  assert.equal(service.durationMin, undefined)
  assert.match(service.description, /не за пакет от 20 часа/)
  assert.match(service.description, /до 10:00 предходния ден/)
  assert.match(service.description, /до 20%/)
  assert.match(service.description, /само за навършили 18 години/)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://www.fatibg.com/online-zapisvane/' })
  assert.equal(business.address, 'София, ул. „Г. Раковски“ 99')
  assert.equal(business.openingHours, undefined, 'administrative hours are not inferred as lessons')
})

test('the computer provider has one Sofia home-visit record with paid labour up to one hour and separately excluded parts', () => {
  const business = row('sofia-serviz-engineerings-home-computers'), service = business.services[0]
  assert.deepEqual([business.category, business.locationKind, business.address], ['home_services', 'service_area', null])
  assert.equal(home013.records.filter(item => item.website === business.website).length, 1)
  assert.equal(service.appointmentModel, 'home_visit')
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [48.99, 'EUR', 'fixed'])
  assert.equal(service.price.unit, 'труд за общи хардуерни услуги · до 1 час')
  assert.match(service.description, /Труд.*до един час/)
  assert.match(service.description, /Посещението в София е без отделна такса/)
  assert.match(service.description, /резервните части не са включени/)
  assert.equal(service.durationMin, undefined, 'a maximum labour allowance is not a fixed sixty-minute visit')
  assert.equal(business.openingHours, undefined, 'general contact hours do not establish home-visit hours')
})

test('three actual Allegro locations offer only a free adult placement meeting, never a paid lesson or whole-course price', () => {
  const ids = ['sofia-allegro-vivace-shesti-septemvri37', 'sofia-allegro-vivace-andrey-lyapchev72', 'sofia-allegro-vivace-dimitar-manov18']
  const businesses = ids.map(row)
  assert.equal(new Set(businesses.map(item => item.address)).size, 3)
  assert.deepEqual(businesses.map(item => item.phone), ['+359988833411', '+359893355354', '+359893355354'])
  for (const business of businesses) {
    const service = business.services[0]
    assert.equal(business.locationKind, 'premises')
    assert.equal(business.services.length, 1)
    assert.equal(service.name, 'Първоначална езикова среща-събеседване за възрастни')
    assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [0, 'EUR', 'fixed'])
    assert.equal(service.price.sourceUrl, 'https://suggestopediabg.com/pricing-info/')
    assert.match(service.description, /Безплатно първоначално събеседване-тест/)
    assert.match(service.description, /уговорени ден, час и обект/)
    assert.match(service.description, /Това не е платен урок или записване в цял курс/)
    assert.equal(business.openingHours, undefined)
    assert.equal(service.durationMin, undefined)
  }
})

test('unpriced legal/notarial consultations retain explicit genuine-unpublished receipts rather than free or statutory fees', () => {
  const ids = ['sofia-yonev-kanchelov-dimitar-petkov111', 'sofia-dahterov-tsarigradsko5',
    'sofia-iskra-iskrenova-hubavka8', 'sofia-violeta-angelova-james-bourchier95-97']
  for (const id of ids) {
    const business = row(id), review = sourceReview(id)
    assert.equal(business.category, 'consulting')
    assert.equal(business.services[0].price, undefined, 'another provider or statutory table supplies no guessed fee')
    assert.equal(review.pricingDecision, 'not_publicly_listed')
    assert.equal(review.bookingReview, 'phone_booking_reviewed')
    assert.equal(review.priceSearch.outcome, 'not_published')
    assert.equal(review.priceSearch.bookingUrl, business.verification.booking.url)
    assert.ok(review.reviewedUrls.includes(review.priceSearch.bookingUrl))
    assert.ok(review.priceSearch.serviceUrls.length > 0)
    assert.ok(review.priceSearch.serviceUrls.every(url => review.reviewedUrls.includes(url)))
    assert.ok(review.priceSearch.notes.length >= 20)
    assert.equal(assessPricingReview(business, intakeReview(business), now).state, 'service_reviewed')
    const falselyPriced = { ...business, services: [{ ...business.services[0], price: {
      amount: 8, currency: 'BGN', kind: 'fixed', unit: 'час', checkedOn: '2026-11-14', sourceUrl: business.website,
    } }] }
    assert.equal(assessPricingReview(falselyPriced, { ...review, inventoryIdentity: pricingIdentity(falselyPriced) }, now).reason,
      'unpublished_price_receipt_contains_prices')
    assert.equal(assessPricingReview(business, { ...intakeReview(business), pricingDecision: 'hold_conflicting_sources' }, now).reason,
      'conflicting_published_prices_require_owner_confirmation')
  }
  assert.equal(row('sofia-violeta-angelova-james-bourchier95-97').openingHours, undefined)
})

test('Belezhkov keeps the owner-published hourly 4.09 EUR ex-VAT amount without computing 4.91 or inventing a sixty-minute slot', () => {
  const business = row('sofia-krasimir-belezhkov-hubcha2'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [4.09, 'EUR', 'fixed'])
  assert.notEqual(service.price.amount, 4.91)
  assert.equal(service.price.unit, 'час устна консултация · без ДДС')
  assert.equal(service.price.sourceUrl, 'https://notarius617.com/notarialni-taksi/')
  assert.match(service.description, /добавя се 20% ДДС/)
  assert.match(service.description, /само след предварително записване по телефона/)
  assert.match(service.description, /таксуват отделно/)
  assert.equal(service.durationMin, undefined)
  assert.equal(business.phone, '+35929876645')
  assert.equal(business.verification.booking.url, 'https://notarius617.com/нотариални-услуги/')
  assert.equal(sourceReview(business.id).pricingDecision, undefined)
  assert.equal(assessPricingReview(business, intakeReview(business), now).state, 'reviewed')
})
