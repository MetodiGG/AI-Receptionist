import test from 'node:test'
import assert from 'node:assert/strict'
import intake from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-015-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const imported = business => catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
const photo = (business, service) => serviceThumbnail({ ...service, ...catalogueServicePhotoFields(service, business) }, { business })

test('home015 exposes four distinct appointment providers and five qualified services in runtime and partner onboarding', () => {
  assert.equal(intake.records.length, 4)
  assert.equal(intake.records.flatMap(business => business.services).length, 5)
  assert.equal(new Set(intake.records.map(business => business.id)).size, 4)
  for (const source of intake.records) {
    const business = row(source.id), detail = imported(business)
    assert.ok(approvedCatalogueRecord(business, now), source.id)
    assert.equal(assessPricingReview(business, reviews.find(review => review.id === source.id), now).state,
      business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now })
      .some(result => result.id === source.id), source.id)
    assert.equal(detail.business.address, source.address)
    assert.deepEqual(detail.services.map(service => service.name), source.services.map(service => service.name))
    for (const [index, service] of business.services.entries()) {
      assert.equal(service.durationMin, undefined)
      assert.equal(detail.services[index].duration_min, '')
      assert.equal(detail.services[index].description, service.description)
      assert.equal(detail.services[index].price, service.price ? String(service.price.amount) : '')
      if (service.price) {
        assert.equal(detail.services[index].currency, service.price.currency)
        assert.equal(detail.services[index].price_details.unit, service.price.unit)
      }
    }
    assert.equal(source.coordinates, null, 'source intake invented no owner marker')
  }
})

test('Iva Todorova offers a PAID individually agreed consultation with a genuine unpublished-price receipt, never a free or normative-rate fee', () => {
  const business = row('sofia-iva-todorova-dondukov93'), service = business.services[0]
  const review = reviews.find(item => item.id === business.id)
  assert.equal(service.price, undefined)
  assert.match(service.description, /Платена консултация/)
  assert.match(service.description, /Възнаграждението се уточнява индивидуално/)
  assert.equal(business.booking.kind, 'phone')
  assert.equal(business.verification.booking.url, 'https://advokattodorova.com/kontakti')
  assert.equal(review.pricingDecision, 'not_publicly_listed')
  assert.equal(review.priceSearch.outcome, 'not_published')
  assert.equal(review.priceSearch.bookingUrl, business.verification.booking.url)
  assert.ok(review.priceSearch.serviceUrls.includes('https://advokattodorova.com/tarifa'))
  assert.ok([review.priceSearch.bookingUrl, ...review.priceSearch.serviceUrls].every(url => review.reviewedUrls.includes(url)))
  assert.equal(assessPricingReview(business, review, now).state, 'service_reviewed')
  assert.equal(imported(business).services[0].price, '')
})

test('Integral limits zero euros to the FIRST higher-education orientation with under-sixteen consent and later appointment confirmation, not a WAT clone', () => {
  const business = row('sofia-integral-evlogi-georgievi99'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(service.price.unit, 'първа ориентационна консултация за висше образование')
  assert.match(service.description, /Безплатна е само първата консултация/)
  assert.match(service.description, /не обучение или цял пакет/)
  assert.match(service.description, /консултант потвърждава/)
  assert.match(service.description, /под 16 г.*родителско съгласие/)
  assert.equal(business.address, 'София, бул. „Евлоги и Христо Георгиеви“ 99')
  assert.deepEqual(business.booking, { kind: 'form', url: 'https://www.integral.bg/' })
  assert.equal(business.openingHours, undefined)
  assert.equal(intake.records.filter(item => new URL(item.website).hostname.endsWith('integral.bg')).length, 1)
  assert.doesNotMatch(business.address, /Студентски|Николай Стоянов/)
})

test('UNIFY separates a free FIRST consultation UP TO one hour from fifty euros PER HOUR AFTER that meeting, without fixed sixty-minute slots', () => {
  const business = row('sofia-unify-nikolay-haytov2'), [first, specialised] = business.services
  assert.equal(business.services.length, 2)
  assert.deepEqual([first.price.amount, specialised.price.amount], [0, 50])
  assert.equal(first.price.unit, 'първа ориентационна консултация · до 1 час')
  assert.equal(specialised.price.unit, 'час специализирана консултация · след първа безплатна')
  assert.match(first.description, /до един час/)
  assert.match(first.description, /Последващите специализирани консултации са платени/)
  assert.match(specialised.description, /Почасова.*след първата безплатна среща/)
  assert.match(specialised.description, /университетските такси не са включен пакет/)
  assert.ok(business.services.every(service => service.durationMin === undefined))
  assert.ok(imported(business).services.every(service => service.duration_min === ''))
  assert.equal(business.booking.url, 'https://www.unify.bg/bezplatna-konsultaciq')
  assert.match(business.address, /Николай Хайтов.*2.*36/)
  assert.doesNotMatch(business.address, /Емилиян Станев/)
})

test('EDLANTA offers a free SECONDARY-education information meeting, not the complete consultancy package, with under-fourteen parental consent', () => {
  const business = row('sofia-edlanta-vasil-levski3'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency], [0, 'EUR'])
  assert.equal(service.price.unit, 'информационна консултация за средно образование в чужбина')
  assert.match(service.name, /средно образование/)
  assert.match(service.description, /ученици и родители.*присъствена консултация/)
  assert.match(service.description, /не е целият консултантски пакет/)
  assert.match(service.description, /под 14 години.*съгласие на родител/)
  assert.doesNotMatch(service.description, /първа|незабавно|гарантирано/)
  assert.equal(business.phone, '+359887851919')
  assert.equal(business.booking.url, 'https://www.edlanta.com/kontakti')
  assert.equal(business.openingHours, undefined)
})

test('all five services use exact reviewed illustrative photos for the actual consultation type, not a generic language lesson or neutral notebook', () => {
  const expected = new Map([
    ['sofia-iva-todorova-dondukov93', 'legal-consultation'],
    ['sofia-integral-evlogi-georgievi99', 'sx-university-admissions-consultation'],
    ['sofia-unify-nikolay-haytov2', 'sx-university-admissions-consultation'],
    ['sofia-edlanta-vasil-levski3', 'sx-secondary-study-abroad-consultation'],
  ])
  for (const source of intake.records) {
    const business = row(source.id)
    for (const service of business.services) {
      const fields = catalogueServicePhotoFields(service, business), image = photo(business, service)
      assert.equal(fields.illustrativePhotoKey, expected.get(source.id))
      assert.equal(image.src, `/service-photos/${expected.get(source.id)}-v1.webp`)
      assert.equal(image.type, 'photo')
      assert.equal(image.source, 'illustrative')
      assert.equal(image.photoMatch, 'activity')
      assert.doesNotMatch(image.src, /notebook|neutral|language-lesson/)
    }
  }
})
