import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-008-20261113.mjs'
import tech from '../lib/discovery/catalogue-data/neighborhood-photography-2000-002-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T00:30:00Z')
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const photo = (business, index = 0) => serviceThumbnail({ ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business) }, { business })

test('eleven real appointment operators expose twelve sourced services and specific photos in partner onboarding', () => {
  const sources = [...auto.records, ...tech.records]
  assert.equal(sources.length, 11)
  assert.equal(sources.flatMap(item => item.services).length, 12)
  for (const source of sources) {
    const business = row(source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === business.id), now).state, business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', business.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name.slice(0, 120), cityCode: '68134' }, { now }).some(item => item.id === business.id), business.id)
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

test('a full Aramii group is only a waitlist request, and the garage cannot inherit a nearby residential block pin', () => {
  const aramii = row('sofia-aramii-mladost1-genadiev5g')
  assert.equal(aramii.services[0].price.amount, 8)
  assert.match(aramii.services[0].description, /групата е запълнена/)
  assert.match(aramii.services[0].description, /резервен списък/)
  assert.match(aramii.services[0].description, /не потвърдени свободни места/)
  assert.equal(aramii.booking.kind, 'phone')
  assert.equal(aramii.coordinates.addressId, '96261')
  const garage = row('sofia-dggery-ovcha-kupel-lincoln')
  assert.equal(garage.services[0].price, undefined)
  assert.equal(garage.coordinates, null)
  assert.match(garage.address, /срещу бл\. 48/)
  assert.match(photo(garage).src, /oil-change-v1\.webp$/)
})

test('Horovodets has four independently operated real venues, not room, instructor or host-school clones', () => {
  const branches = auto.records.filter(item => item.id.startsWith('sofia-horovodets-'))
  assert.equal(branches.length, 4)
  assert.equal(new Set(branches.map(item => item.address)).size, 4)
  assert.ok(branches.every(item => item.phone === '+359888988258'))
  assert.equal(row('sofia-horovodets-isul-mayor-agov4').services[0].price.amount, 6)
  for (const suffix of ['iztok-tsarigradsko101', 'osogovo2', 'samuil50']) assert.equal(row('sofia-horovodets-' + suffix).services[0].price.amount, 6.5)
  assert.equal(row('sofia-horovodets-isul-mayor-agov4').coordinates, null, 'two postal descriptions are not silently reduced to a pin')
  assert.equal(row('sofia-horovodets-samuil50').coordinates, null, 'missing exact street row is not a nearby house')
})

test('PhotoCafe is one operator with in-studio monitor calibration and sensor cleaning, not lens cleaning or a home-visit fee', () => {
  const business = row('sofia-photo-cafe-dertliev42')
  assert.equal(business.category, 'other')
  assert.equal(business.booking.kind, 'phone')
  assert.equal(business.phone, '+359888701698')
  assert.deepEqual(business.services.map(service => service.price.amount), [30, 40])
  assert.match(business.services[0].name, /в студиото/)
  assert.match(business.services[1].description, /напълно заредена батерия/)
  assert.match(photo(business).src, /sx-monitor-hardware-calibration-v1\.webp$/)
  assert.match(photo(business, 1).src, /sx-camera-sensor-wet-cleaning-v1\.webp$/)
  assert.equal(business.coordinates, null)
  assert.equal(business.openingHours, undefined)
  assert.ok(business.services.every(service => !service.durationMin))
})

test('Nails Security uses independently reviewed own prices and explicit phone booking without external-calendar durations', () => {
  const business = row('sofia-nails-security-darwin')
  const review = reviews.find(item => item.id === business.id)
  assert.equal(business.booking.kind, 'phone')
  assert.deepEqual(business.services.map(service => service.price.amount), [35, 40, 30])
  assert.ok(business.services.every(service => service.price.sourceUrl === 'https://www.nailssecurity.com/pricing'))
  assert.ok(business.services.every(service => service.durationMin === undefined && service.durationSourceUrl === undefined))
  assert.equal(review.bookingEntry, 'phone')
  assert.ok(review.reviewedUrls.every(url => !url.includes('alteg')))
  assert.match(review.notes, /2026-11-14/)
  assert.equal(review.checkedOn, '2026-11-13', 'keep actual original own-source observation date, not a fabricated fresh render')
  assert.equal(assessPricingReview(business, review, now).state, 'reviewed')
})
