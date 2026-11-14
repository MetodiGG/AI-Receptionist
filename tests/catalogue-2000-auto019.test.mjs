import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-019-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => {
  const business = SOFIA_CATALOGUE.find(item => item.id === id)
  assert.ok(business, id)
  return business
}
const review = id => {
  const receipt = reviews.find(item => item.id === id)
  assert.ok(receipt, id)
  return receipt
}
const photoKeys = new Map([
  ['sofia-fit-kids-priority-vasil-levski', 'sx-child-athletics-group-six-ten'],
  ['sofia-slavia-volleyball-child-school', 'sx-child-girls-volleyball-beginners'],
  ['sofia-septemvri-basketball-usta-gencho1', 'sx-boys-basketball-school-group'],
  ['sofia-slavia-basketball-child-school', 'sx-mixed-child-basketball-school'],
])

test('019 keeps four distinct reserved sport schools through pricing, public search, onboarding and exact activity photos', () => {
  assert.equal(auto.records.length, 4)
  assert.equal(validateCatalogue(auto.records).length, 4)
  assert.equal(new Set(auto.records.map(item => item.id)).size, 4)
  for (const source of auto.records) {
    const business = row(source.id), service = business.services[0]
    assert.deepEqual(business.services, source.services)
    assert.equal(business.services.length, 1)
    assert.equal(service.appointmentModel, 'group_reservation')
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, review(source.id), now).state,
      service.price ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(item => item.id === source.id), source.id)
    const found = normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
      { cityCode: '68134', category: 'fitness', browse: true, searchV2: true }, { now })
      .find(item => item.id === source.id)
    assert.ok(found, source.id)
    assert.equal(found.services[0].price, service.price ? 10 : null)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
    const draft = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.equal(draft.services[0].name, service.name)
    assert.equal(draft.services[0].description, service.description)
    assert.equal(draft.services[0].price, service.price ? '10' : '')
    assert.equal(draft.services[0].duration_min, '')
    const fields = catalogueServicePhotoFields(service, business)
    assert.deepEqual(fields, { illustrativePhotoKey: photoKeys.get(source.id) })
    const image = serviceThumbnail({ ...service, ...fields }, { business })
    assert.equal(image.src, `/service-photos/${photoKeys.get(source.id)}-v1.webp`)
    assert.equal(image.type, 'photo')
    assert.equal(image.photoMatch, 'activity')
    assert.match(image.alt, /Примерна снимка/)
    assert.match(image.alt, /не показва работа на бизнеса/)
  }
})

test('Fit Kids10EUR is one regular athletics class for6–10, not a free trial, childcare hour or inferred private lesson', () => {
  const business = row('sofia-fit-kids-priority-vasil-levski'), service = business.services[0]
  assert.equal(business.address, 'София, Национален стадион Васил Левски')
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://fitkids.club/' })
  assert.match(service.name, /лека атлетика.*6–10 години/)
  assert.deepEqual(service.price, {
    amount: 10, currency: 'EUR', kind: 'fixed', unit: 'един участник / едно групово занимание',
    sourceUrl: 'https://fitkids.club/', checkedOn: '2026-11-14', validUntil: '2027-02-12',
  })
  assert.match(service.description, /редовно групово занимание/)
  assert.match(service.description, /писмено потвърждение и плащане/)
  assert.match(service.description, /не безплатна проба или уикенд занималня/)
  assert.match(service.description, /родителско съгласие/)
  assert.match(service.description, /отмяна до 12 часа предварително/)
  assert.match(service.description, /по-късната отмяна се таксува/)
  assert.equal(review(business.id).pricingDecision, undefined)
})

test('Slavia volleyball retains only the beginner GIRLS2015–2019 programme and its actual registration coach phone', () => {
  const business = row('sofia-slavia-volleyball-child-school'), service = business.services[0]
  assert.equal(business.address, 'София, ул. Коломан 1, зала Панайот Пондалов')
  assert.equal(service.name, 'Групова волейболна тренировка за начинаещи момичета, родени 2015–2019 г.')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359886608116' })
  assert.equal(business.verification.booking.url, 'https://slaviavolley.bg/детска-школа-по-волейбол/')
  assert.match(service.description, /сезон 2026\/27/)
  assert.match(service.description, /потвърждават по телефона/)
  assert.match(service.description, /според училищните смени/)
  assert.doesNotMatch(service.name, /момчета|мъже|възрастни/)
})

test('Septemvri basketball is BOYS7–18 atUstaGencho1 with the actual owner enrollment-to-contact path', () => {
  const business = row('sofia-septemvri-basketball-usta-gencho1'), service = business.services[0]
  assert.equal(business.address, 'София, ул. Уста Генчо 1, зала Септември')
  assert.equal(service.name, 'Групови баскетболни тренировки за момчета на 7–18 години')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359889777502' })
  assert.equal(business.verification.booking.url, 'https://septemvribasketball.com/')
  assert.equal(business.verification.contact, 'https://septemvribasketball.com/contact/')
  assert.ok(review(business.id).reviewedUrls.includes('https://septemvribasketball.com/home-eng/'))
  assert.match(service.description, /уточняват предварително/)
  assert.match(service.description, /не е свободен вход.*билет за мач или обучение в спортно училище/)
})

test('Slavia basketball is the mixed5–12 current school, not an inventedKoloman house number, team or coach alias', () => {
  const business = row('sofia-slavia-basketball-child-school'), service = business.services[0]
  assert.equal(business.address, 'София, Овча купел, стадион Славия, баскетболна зала')
  assert.doesNotMatch(business.address, /Коломан|\d/)
  assert.equal(service.name, 'Групова баскетболна тренировка за деца на 5–12 години')
  assert.match(business.verification.booking.excerpt, /момчета и момичета на 5–12 години/)
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359878878903' })
  assert.equal(business.verification.booking.url, 'https://slaviabasketball.bg/item-21-priem-na-deca-vij-tuk-/')
  assert.match(service.description, /сезон 2026\/27/)
  assert.match(service.description, /не е билет за мач, свободен вход в залата или безплатна проба/)
})

test('019 preserves three strict unpublished receipts and no guessed times or source points, then expires fail-closed', () => {
  const expired = Date.parse('2027-02-13T12:00:00Z')
  let unpublished = 0
  for (const source of auto.records) {
    const business = row(source.id), service = business.services[0], receipt = review(source.id)
    assert.equal(source.coordinates, null)
    assert.equal(source.openingHours, undefined)
    assert.equal(service.durationMin, undefined)
    assert.equal(business.verification.checkedOn, '2026-11-14')
    assert.equal(business.verification.validUntil, '2027-02-12')
    assert.ok(receipt.reviewedUrls.includes(business.website))
    assert.ok(receipt.reviewedUrls.includes(business.verification.booking.url))
    if (!service.price) {
      unpublished += 1
      assert.equal(receipt.bookingReview, 'phone_booking_reviewed')
      assert.equal(receipt.pricingDecision, 'not_publicly_listed')
      assert.equal(receipt.priceSearch.outcome, 'not_published')
      assert.equal(receipt.priceSearch.bookingUrl, business.verification.booking.url)
      assert.ok(receipt.priceSearch.notes.length >= 20)
      assert.ok(receipt.priceSearch.serviceUrls.length)
      assert.ok(receipt.priceSearch.serviceUrls.every(url => receipt.reviewedUrls.includes(url)))
      assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now }).services[0].price, '')
    }
    assert.equal(approvedCatalogueRecord(business, expired), null)
    assert.equal(catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now: expired }), null)
    assert.deepEqual(normalizeCatalogueBusinesses([business],
      { cityCode: '68134', category: 'fitness', browse: true, searchV2: true }, { now: expired }), [])
  }
  assert.equal(unpublished, 3)
})
