import test from 'node:test'
import assert from 'node:assert/strict'
import home from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-018-20261113.mjs'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-020-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

// This is an offline regression of already integrated inventories and receipts.
// It performs no fetching, booking, customer writes or source re-research.
const now = Date.parse('2026-11-14T12:00:00Z')
const sources = validateCatalogue([...home.records, ...auto.records])
const row = id => SOFIA_CATALOGUE.find(business => business.id === id)
const receipt = id => reviews.find(review => review.id === id)
const detail = business => catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
const publicRow = business => normalizeCatalogueBusinesses(SOFIA_CATALOGUE,
  { cityCode: '68134', category: business.category, browse: true, searchV2: true, requirements: [] }, { now })
  .find(result => result.id === business.id)
const expected = new Map([
  ['sofia-yanko-vasilev73-buxton-gortalov13', ['other', 'Претапициране на диван · уговорено посещение в ателието', 'sx-home-sofa-reupholster']],
  ['sofia-yanko-vasilev73-mladost2-rum22', ['other', 'Претапициране на диван · уговорено посещение в ателието', 'sx-home-sofa-reupholster']],
  ['sofia-yanko-vasilev73-karpuzitsa-bachiyski6', ['other', 'Претапициране на диван · уговорено посещение в ателието', 'sx-home-sofa-reupholster']],
  ['sofia-got-your-english-kliment-denchev11', ['education', 'Индивидуален присъствен урок по английски', 'language-lesson']],
  ['sofia-vnl-trans-furniture-home-visits', ['home_services', 'Монтаж и демонтаж на мебели на адрес', 'sx-home-hinged-wardrobe-assembly-macro']],
  ['sofia-ip-in-the-spotlight-bersinski12', ['consulting', 'Правна консултация за интелектуална собственост', 'legal-consultation']],
  ['sofia-paintkillers-gryunanger43b', ['detailing', 'Поставяне на защитно PPF фолио на предница', 'sx-detail-ppf-front']],
  ['sofia-v-swim-sveti-georgi-vaptsarov47', ['fitness', 'Групов урок по плуване за начинаещо дете', 'sx-child-swimming-beginner-group']],
  ['sofia-v-swim-vitosha-rosario1', ['fitness', 'Групов урок по плуване за начинаещо дете', 'sx-child-swimming-beginner-group']],
])

test('home018 and auto020 expose exactly nine integrated businesses and nine unchanged service inventories', () => {
  assert.deepEqual([home.records.length, home.reviews.length, auto.records.length, auto.reviews.length], [6, 6, 3, 3])
  assert.equal(sources.length, 9)
  assert.equal(sources.flatMap(business => business.services).length, 9)
  assert.deepEqual([...new Set(sources.map(business => business.id))].sort(), [...expected.keys()].sort())
  for (const source of sources) {
    const business = row(source.id)
    assert.ok(business, source.id)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.deepEqual(business.services, source.services, source.id)
    assert.deepEqual(business.booking, source.booking, source.id)
    assert.equal(business.address, source.address, source.id)
    assert.deepEqual([business.category, business.services[0].name], expected.get(source.id).slice(0, 2))
    assert.equal(assessPricingReview(business, receipt(source.id), now).state,
      home.records.some(item => item.id === source.id) ? 'service_reviewed' : 'reviewed', source.id)
  }
})

test('public search preserves exact service IDs, literal prices and unknown availability for all nine businesses', () => {
  for (const source of sources) {
    const business = row(source.id), found = publicRow(business), service = business.services[0]
    assert.ok(found, source.id)
    assert.equal(found.source, 'catalogue')
    assert.equal(found.services.length, 1)
    assert.equal(found.services[0].id, `${source.id}-0`)
    assert.equal(found.services[0].name, expected.get(source.id)[1])
    assert.equal(found.services[0].category, expected.get(source.id)[0])
    assert.equal(found.services[0].description, service.description)
    assert.equal(found.services[0].price, service.price?.amount ?? null)
    if (service.price) {
      assert.equal(found.services[0].currency, service.price.currency)
      assert.equal(found.services[0].priceKind, service.price.kind)
      assert.equal(found.services[0].priceUnit, service.price.unit)
    }
    assert.equal(found.booking.verified, true)
    assert.deepEqual(found.availability, { status: 'external', slots: [] })
  }
})

test('onboarding imports all nine exact services without changing unpublished fees, FROM/package meaning or durations', () => {
  for (const source of sources) {
    const business = row(source.id), imported = detail(business), service = business.services[0]
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE,
      { query: business.name, cityCode: '68134' }, { now }).some(result => result.id === source.id), source.id)
    assert.equal(imported.business.id, source.id)
    assert.equal(imported.business.address, source.address)
    assert.equal(imported.serviceCount, 1)
    assert.equal(imported.services[0].name, expected.get(source.id)[1])
    assert.equal(imported.services[0].description, service.description)
    assert.equal(imported.services[0].price, service.price ? String(service.price.amount) : '')
    assert.equal(imported.services[0].duration_min, service.durationMin ? String(service.durationMin) : '')
    if (service.price) {
      assert.equal(imported.services[0].currency, 'EUR')
      assert.deepEqual(imported.services[0].price_details, { kind: service.price.kind, unit: service.price.unit })
    } else {
      assert.deepEqual(imported.services[0].price_details, {})
      assert.equal(imported.services[0].catalogueHint.priceLabel, undefined, 'an absent tariff is never free')
    }
  }
})

test('all six home018 receipts genuinely review unpublished selected-service fees, never claim completed price reviews', () => {
  for (const source of home.records) {
    const business = row(source.id), review = receipt(source.id), search = review.priceSearch
    assert.equal(business.services[0].price, undefined)
    assert.equal(review.pricingDecision, 'not_publicly_listed')
    assert.equal(search.outcome, 'not_published')
    assert.equal(search.bookingUrl, business.booking.kind === 'form' ? business.booking.url : business.verification.booking.url)
    assert.ok(search.serviceUrls.length > 0)
    assert.ok([search.bookingUrl, ...search.serviceUrls].every(url => review.reviewedUrls.includes(url)))
    assert.ok(search.notes.length >= 20)
    assert.equal(review.bookingReview, business.booking.kind === 'phone' ? 'phone_booking_reviewed' : 'owned_booking_reviewed')
    assert.deepEqual(assessPricingReview(business, review, now), {
      id: source.id, state: 'service_reviewed', pricingState: 'not_publicly_listed',
      checkedOn: '2026-11-14', reviewedPriceCount: 0,
    })
    const missingSearch = { ...review, priceSearch: undefined }
    assert.equal(assessPricingReview(business, missingSearch, now).reason, 'explicit_unpublished_price_search_required')
    const missingSource = { ...review, priceSearch: { ...search, serviceUrls: [] } }
    assert.equal(assessPricingReview(business, missingSource, now).state, 'pending')
  }
})

test('home018 separates three real upholstery ateliers, a physical paid English lesson, one mobile assembler and a paid legal consultation', () => {
  const ateliers = home.records.filter(business => business.id.startsWith('sofia-yanko-vasilev73-')).map(source => row(source.id))
  assert.equal(ateliers.length, 3)
  assert.equal(new Set(ateliers.map(business => business.address)).size, 3)
  for (const business of ateliers) {
    assert.equal(business.locationKind, 'premises')
    assert.equal(business.booking.phone, '+359988301635')
    assert.equal(business.services[0].appointmentModel, 'appointment')
    assert.match(business.services[0].description, /само след предварително уговорен час по телефона/)
    assert.equal(business.services[0].durationMin, undefined)
  }
  assert.match(row('sofia-yanko-vasilev73-mladost2-rum22').address, /Теодоров-Балан.*РУМ.*ет\. 2.*офис 22/)
  const english = row('sofia-got-your-english-kliment-denchev11')
  assert.deepEqual(english.booking, { kind: 'form', url: 'https://gotyourenglish.com/contact/' })
  assert.equal(english.services[0].durationMin, 60)
  assert.match(english.address, /Климент Денчев.*11/)
  assert.match(english.services[0].description, /не е безплатен урок или групов онлайн курс/)
  const vnl = row('sofia-vnl-trans-furniture-home-visits')
  assert.deepEqual([vnl.locationKind, vnl.address, vnl.coordinates, vnl.services[0].appointmentModel],
    ['service_area', null, null, 'home_visit'])
  assert.match(vnl.services[0].description, /плащането е след работата, без капаро/)
  assert.match(vnl.services[0].description, /Безплатният оглед не означава безплатен монтаж/)
  assert.ok(vnl.openingHours.days.length === 7 && vnl.openingHours.days.every(day => day.byAppointment && !day.periods.length))
  const legal = row('sofia-ip-in-the-spotlight-bersinski12')
  assert.match(legal.services[0].description, /^Платена консултация/)
  assert.match(legal.services[0].description, /държавни такси и последваща работа не са представени като включени/)
  assert.match(legal.address, /Берсински.*12.*ет\. 5/)
})

test('PaintKillers retains FROM 750 euros for the WHOLE front PPF package and the rear entrance, never a per-panel or whole-car fee', () => {
  const business = row('sofia-paintkillers-gryunanger43b'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [750, 'EUR', 'from'])
  assert.equal(service.price.unit, 'целият пакет за предна броня, капак, калници и огледала')
  assert.equal(service.price.sourceUrl, 'https://paintkillers.eu/zashitno-folio')
  assert.match(service.description, /модела, размера и състоянието на автомобила/)
  assert.match(service.description, /не е цялостно облепяне на автомобила/)
  assert.equal(business.address, 'София, ж.к. Овча купел 2, ул. Фридрих Грюнангер 43Б, вход от задната страна на блока')
  assert.deepEqual(business.booking, { kind: 'phone', phone: '+359879232329' })
  assert.match(business.verification.booking.excerpt, /Запазете час.*tel:\+359879232329/)
  assert.equal(service.durationMin, undefined, 'one-to-two workdays is not a fixed appointment duration')
  assert.deepEqual(business.openingHours.days.map(day => day.weekday), [1, 2, 3, 4, 5])
  assert.ok(business.openingHours.days.every(day => day.periods[0].open === '09:00' && day.periods[0].close === '17:00'))
})

test('V-SWIM offers one 20-euro CHILD GROUP visit at each of two real pools, with genuine phone and later club confirmation', () => {
  const swimming = auto.records.filter(business => business.website === 'https://www.v-swim.net/').map(source => row(source.id))
  assert.equal(swimming.length, 2)
  assert.deepEqual(swimming.map(business => business.address), [
    'София, кв. Лозенец, бул. Никола Вапцаров 47, басейн Свети Георги',
    'София, ул. Росарио 1, басейн Парк хотел Витоша',
  ])
  for (const business of swimming) {
    const service = business.services[0]
    assert.equal(service.appointmentModel, 'group_reservation')
    assert.deepEqual([service.price.amount, service.price.currency, service.price.kind], [20, 'EUR', 'fixed'])
    assert.equal(service.price.unit, 'един участник / един групов урок')
    assert.match(service.name, /за начинаещо дете/)
    assert.match(service.description, /без отстъпка с MultiSport/)
    assert.match(service.description, /След телефонно записване и потвърждение от клуба за група и час/)
    assert.match(service.description, /Пропуснат урок не се възстановява, освен при друга уговорка/)
    assert.match(service.description, /Не е свободно плуване или индивидуален урок/)
    assert.deepEqual(business.booking, { kind: 'phone', phone: '+359882709872' })
    assert.equal(business.verification.booking.url, 'https://www.v-swim.net/obshti-uslovia')
    assert.match(business.verification.booking.excerpt, /записване по телефон.*валидно само след потвърждение от клуба/)
    assert.ok(receipt(business.id).reviewedUrls.includes(business.verification.booking.url))
    assert.equal(service.durationMin, undefined, 'schedule spacing does not prove a fixed lesson duration')
    assert.equal(business.openingHours, undefined)
  }
})

test('all nine exact public-service photo keys match the reviewed activity and survive search rendering', () => {
  for (const source of sources) {
    const business = row(source.id), service = business.services[0], key = expected.get(source.id)[2]
    const fields = catalogueServicePhotoFields(service, business)
    assert.equal(fields.illustrativePhotoKey, key, source.id)
    assert.equal(publicRow(business).services[0].illustrativePhotoKey, key, source.id)
    const image = serviceThumbnail({ ...service, ...fields }, { business })
    assert.equal(image.src, `/service-photos/${key}-v1.webp`, source.id)
    assert.equal(image.type, 'photo')
    assert.equal(image.source, 'illustrative')
    assert.equal(image.photoMatch, 'activity')
    assert.doesNotMatch(image.src, /notebook|neutral|appointment-workspace|upholstery-extraction/)
  }
})
