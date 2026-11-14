import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import auto013 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-013-20261113.mjs'
import auto014 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-014-20261113.mjs'
import auto015 from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-015-20261113.mjs'
import { approvedCatalogueRecord, catalogueRecordSchema, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const batches = [auto013, auto014, auto015]
const records = batches.flatMap(batch => batch.records)
const row = id => {
  const business = records.find(item => item.id === id)
  assert.ok(business, id)
  return business
}
const service = id => row(id).services[0]
const review = id => batches.flatMap(batch => batch.reviews).find(item => item.id === id)
const ledger = number => JSON.parse(readFileSync(new URL(`../docs/catalogue-pricing/expansion-auto-sport-2000-${number}-20261113.json`, import.meta.url), 'utf8'))
const receipt = JSON.parse(readFileSync(new URL('../docs/catalogue-geocoding/mitvas-owner-dmm-gps-20261114.json', import.meta.url), 'utf8'))

// These are intake regressions, not an assertion that pending root imports,
// inventory identities or service-photo mappings have already been published.
test('013–015 retain thirteen distinct source-reviewed businesses and exact pricing states without requiring integration', () => {
  assert.deepEqual(batches.map(batch => batch.records.length), [4, 5, 4])
  assert.equal(records.flatMap(item => item.services).length, 13)
  assert.equal(new Set(records.map(item => item.id)).size, 13)
  assert.equal(validateCatalogue(records).length, 13)
  const audit = auditCatalogueBatch([], records, now)
  assert.equal(audit.readyForReview.length, 13)
  assert.deepEqual(audit.pending, [])
  assert.deepEqual(audit.rejected, [])
  const states = []
  for (const business of records) {
    assert.ok(approvedCatalogueRecord(business, now), business.id)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    const sourceReview = review(business.id)
    assert.ok(sourceReview, business.id)
    const state = assessPricingReview(business, { ...sourceReview, inventoryIdentity: pricingIdentity(business) }, now).state
    assert.equal(state, business.services[0].price ? 'reviewed' : 'service_reviewed', business.id)
    states.push(state)
  }
  assert.equal(states.filter(state => state === 'reviewed').length, 6)
  assert.equal(states.filter(state => state === 'service_reviewed').length, 7)
})

test('Naydenov preserves the separate 15 EUR attendance component without inventing a total tyre-change price', () => {
  const business = row('sofia-naydenov-mobile-tyres'), selected = business.services[0]
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.coordinates, null)
  assert.equal(selected.price, undefined)
  assert.equal(selected.durationMin, undefined)
  assert.match(selected.description, /такса за посещение е 15 EUR/)
  assert.match(selected.description, /трудът се договаря отделно/)
  assert.match(selected.description, /15 EUR не е крайна цена/)
  assert.equal(review(business.id).pricingDecision, 'not_publicly_listed')
  assert.equal(review(business.id).priceSearch.bookingUrl, business.verification.booking.url)
})

test('Gumicon is priced per one 13–15-inch tyre with the actual mandatory conditions, not a four-wheel package', () => {
  const selected = service('sofia-gumicon-mobile-tyres')
  assert.deepEqual(selected.price, {
    kind: 'fixed', amount: 12.5, currency: 'EUR',
    unit: 'за една гума 13–15″; Run Flat +50%, подземен гараж +10 EUR',
    sourceUrl: 'https://gumicon.bg/pricing/', checkedOn: '2026-11-14', validUntil: '2027-02-12',
  })
  assert.match(selected.description, /за една гума 13–15″/)
  assert.match(selected.description, /Без такса за посещение в София/)
  assert.match(selected.description, /Run Flat: \+50%/)
  assert.match(selected.description, /подземен гараж: \+10 EUR/)
  assert.doesNotMatch(selected.name, /комплект|четири/i)
  assert.equal(selected.durationMin, undefined, 'arrival marketing is not a service duration')
})

test('Mitvas keeps the literal owner degrees/minutes GPS, exact-address binding and ambiguity instead of selecting a municipal centroid', () => {
  const business = row('sofia-mitvas-nissan-tsvetan-lazarov48')
  assert.equal(business.address, 'София, ж.к. Дружба 1, бул. Проф. Цветан Лазаров 48')
  assert.deepEqual(business.coordinates, {
    latitude: 42.664867, longitude: 23.38805, method: 'first_party_coordinates',
    source: 'https://nissan.mitvas.com/?cmd=contacts', sourceAddress: business.address,
  })
  assert.equal(receipt.id, business.id)
  assert.equal(receipt.source, business.coordinates.source)
  assert.equal(receipt.sourceAddress, business.address)
  assert.equal(receipt.literalLabel, "GPS координати: N42°39.892', E23°23.283'")
  assert.deepEqual(receipt.acceptedPoint, { latitude: 42.664867, longitude: 23.38805 })
  assert.equal(Number((42 + 39.892 / 60).toFixed(6)), receipt.acceptedPoint.latitude)
  assert.equal(Number((23 + 23.283 / 60).toFixed(6)), receipt.acceptedPoint.longitude)
  assert.equal(receipt.municipalCorroboration.status, 'ambiguous_two_exact_address_rows')
  assert.equal(receipt.municipalCorroboration.selectedMunicipalPoint, null)
  assert.deepEqual(receipt.municipalCorroboration.candidates.map(item => item.rn), ['88508', '98140'])
  assert.equal(catalogueBoundCoordinates(business), business.coordinates)
  const moved = { ...business, address: business.address.replace('48', '49') }
  assert.equal(catalogueBoundCoordinates(moved), null)
  assert.equal(catalogueRecordSchema.safeParse(moved).success, false)
  assert.equal(catalogueBoundCoordinates({ ...business, coordinates: { ...business.coordinates, latitude: 0, longitude: 0 } }), null)
  assert.equal(business.booking.url, 'https://nissan.mitvas.com/?cmd=service')
  assert.equal(business.services[0].price, undefined)
})

test('Mobilix is a from-priced vacuum oil extraction only on safe private property, without invented hours or duration', () => {
  const business = row('sofia-mobilix-mobile-vacuum-oil'), selected = business.services[0]
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.coordinates, null)
  assert.deepEqual([selected.price.kind, selected.price.amount, selected.price.currency], ['from', 75, 'EUR'])
  assert.match(selected.name, /с вакуум/)
  assert.match(selected.description, /вакуумна система/)
  assert.match(selected.description, /частен терен: гараж, двор или частен паркинг, не пред блока/)
  assert.match(selected.price.unit, /според автомобила и уговорените консумативи/)
  assert.equal(selected.durationMin, undefined)
  assert.equal(business.openingHours, undefined, 'contradictory venue hours are not silently selected')
})

test('SIMDA is one reserved child modern/hip-hop group and does not inherit adult dance fees or room aliases', () => {
  const business = row('sofia-simda-slivnitsa178-dance'), selected = business.services[0]
  assert.equal(business.services.length, 1)
  assert.match(selected.name, /модерни танци и хип-хоп за деца 7–12/)
  assert.equal(selected.appointmentModel, 'group_reservation')
  assert.equal(selected.durationMin, 60)
  assert.equal(selected.price, undefined)
  assert.match(selected.description, /двете учебни зали са в един обект/)
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359888706645' })
  assert.equal(review(business.id).pricingDecision, 'not_publicly_listed')
  assert.ok(review(business.id).reviewedUrls.includes('https://simda.bg/цени/'))
  assert.equal(auto014.records.filter(item => item.website === business.website).length, 1)
})

test('AX Horca selects the resolved intermediate Biofaculty group, not the separate unconfirmed beginners group', () => {
  const business = row('sofia-ax-horca-bio-dragan-tsankov8'), selected = business.services[0]
  assert.match(business.address, /Драган Цанков 8/)
  assert.equal(selected.name, 'Групови народни танци за средно напреднали')
  assert.deepEqual([selected.price.kind, selected.price.amount, selected.price.currency, selected.price.unit],
    ['fixed', 10, 'EUR', 'за един човек; едно посещение в група'])
  assert.equal(selected.durationMin, 60)
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://ax-horca.com/' })
  const evidence = ledger('014').orderedLedger.find(item => item.id === business.id).findings
  assert.match(evidence, /18:30/)
  assert.match(evidence, /19:30/)
  assert.match(evidence, /TBC/)
})

test('AutoDiagExpert remains unpriced while Avtodiagnoza45 is diagnostic-only, never the90EUR full inspection or a VIN report', () => {
  const expert = row('sofia-autodiag-expert-mobile')
  const diagnostic = row('sofia-avtodiagnoza-mobile-diagnostics'), selected = diagnostic.services[0]
  assert.equal(expert.services[0].price, undefined)
  assert.equal(review(expert.id).pricingDecision, 'not_publicly_listed')
  assert.deepEqual(expert.booking, { kind: 'phone', phone: '+359882062112' })
  assert.deepEqual([selected.price.kind, selected.price.amount, selected.price.currency], ['fixed', 45, 'EUR'])
  assert.equal(selected.price.unit, 'за самостоятелна компютърна диагностика на място в София')
  assert.match(selected.description, /без пълен предпокупен оглед/)
  assert.match(selected.description, /без отделния платен VIN доклад/)
  assert.deepEqual(diagnostic.booking, { kind: 'phone', phone: '+359897950120' })
  for (const business of [expert, diagnostic]) {
    assert.equal(business.locationKind, 'service_area')
    assert.equal(business.address, null)
    assert.equal(business.coordinates, null)
    assert.equal(business.services.length, 1)
    assert.equal(business.services[0].durationMin, undefined)
  }
})

test('Filchev20 is only four complete passenger-car wheels, with the15EUR visit separately visible rather than a computed total', () => {
  const business = row('sofia-filchev-auto-mobile-tyres'), selected = business.services[0]
  assert.deepEqual([selected.price.kind, selected.price.amount, selected.price.currency], ['fixed', 20, 'EUR'])
  assert.equal(selected.price.unit, '4 колела с джанти; отделно посещение 15 EUR')
  assert.match(selected.name, /четири колела с готови джанти — лек автомобил/)
  assert.match(selected.description, /20 EUR е само за сваляне\/качване на 4 гуми с джанти на лек автомобил/)
  assert.match(selected.description, /Посещението на адрес в София се заплаща отделно: 15 EUR/)
  assert.match(selected.description, /Не е демонтаж\/монтаж на гума върху джанта или баланс/)
  assert.doesNotMatch(selected.description + selected.price.unit, /35 EUR|от 20 EUR/)
  assert.equal(business.locationKind, 'service_area')
  assert.equal(business.address, null)
  assert.equal(business.coordinates, null)
  assert.equal(selected.durationMin, undefined)
})

test('Levski-Rakovski uses the explicit phone fallback for one-player coaching, without claiming the unread JS calendar is rendered', () => {
  const business = row('sofia-levski-rakovski-balsha18'), selected = business.services[0]
  assert.equal(business.address, 'София, ул. Балша 18')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359884441919' })
  assert.equal(selected.appointmentModel, 'individual_training')
  assert.deepEqual([selected.price.amount, selected.price.currency, selected.price.unit, selected.durationMin],
    [30, 'EUR', 'един човек / 60 минути', 60])
  assert.match(selected.description, /три дни предварително/)
  assert.match(selected.description, /не пакет или групов урок/)
  assert.equal(review(business.id).bookingReview, 'phone_booking_reviewed')
  assert.ok(review(business.id).reviewedUrls.includes('https://www.levskirakovski.bg/booking-calendar/персонална-тренировка'))
  assert.match(review(business.id).notes, /not readable calendar/)
})
