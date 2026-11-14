import test from 'node:test'
import assert from 'node:assert/strict'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-sport-2000-016-20261113.mjs'
import beauty from '../lib/discovery/catalogue-data/neighborhood-beauty-2000-014-20261113.mjs'
import photography from '../lib/discovery/catalogue-data/neighborhood-photography-2000-005-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261113_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261113.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { catalogueOnboardingDetail, searchCatalogueForOnboarding } from '../lib/catalogue-onboarding.mjs'
import { catalogueServicePhotoFields } from '../lib/catalogue-service-photo-keys.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'

const now = Date.parse('2026-11-14T12:00:00Z')
const records = [auto, beauty, photography].flatMap(batch => batch.records)
const row = id => SOFIA_CATALOGUE.find(item => item.id === id)
const image = (business, index = 0) => serviceThumbnail({
  ...business.services[index], ...catalogueServicePhotoFields(business.services[index], business),
}, { business })

test('six real providers and thirteen services retain literal data and specific photos in partner catalogue selection', () => {
  assert.equal(records.length, 6)
  assert.equal(records.flatMap(item => item.services).length, 13)
  for (const source of records) {
    const business = row(source.id)
    assert.equal(assessPricingReview(business, reviews.find(item => item.id === source.id), now).state,
      business.services.some(service => service.price) ? 'reviewed' : 'service_reviewed', source.id)
    assert.ok(searchCatalogueForOnboarding(SOFIA_CATALOGUE, { query: business.name, cityCode: '68134' }, { now })
      .some(item => item.id === source.id), source.id)
    const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, source.id, { now })
    assert.deepEqual(imported.services.map(service => service.name), business.services.map(service => service.name))
    for (const [index, service] of business.services.entries()) {
      assert.equal(imported.services[index].price, service.price ? String(service.price.amount) : '')
      if (service.price) {
        assert.equal(imported.services[index].currency, service.price.currency)
        assert.equal(imported.services[index].price_details.unit, service.price.unit)
      }
      const photo = image(business, index)
      assert.equal(photo.type, 'photo')
      assert.ok(['exact', 'activity'].includes(photo.photoMatch), source.id)
    }
  }
})

test('PaLante charges for one actual recurring beginner class, not a divided card or an account-only calendar', () => {
  const business = row('sofia-palante-rakovski78'), service = business.services[0]
  assert.deepEqual([service.price.amount, service.price.currency, service.durationMin], [7.5, 'EUR', undefined])
  assert.equal(service.price.unit, 'един човек / едно посещение в начинаещата група')
  assert.equal(business.booking.kind, 'form')
  assert.match(business.booking.url, /nova-grupa-bachata-ot-10-noemvri$/)
  assert.match(service.description, /потвърждение по имейл/)
  assert.equal(business.openingHours, undefined)
  assert.ok(image(business).src.endsWith('/sx-adult-bachata-group-v1.webp'))
})

test('DIVA has three real venues with mandatory first-visit phone arrangement, not a free-trial price or group/teacher clones', () => {
  const businesses = auto.records.filter(item => item.id.startsWith('sofia-diva-zone-')).map(item => row(item.id))
  assert.equal(businesses.length, 3)
  assert.equal(new Set(businesses.map(item => item.address)).size, 3)
  assert.equal(new Set(businesses.map(item => item.phone)).size, 1)
  for (const business of businesses) {
    assert.equal(business.services.length, 1)
    const service = business.services[0]
    assert.match(service.name, /начинаещи 10–14/)
    assert.equal(service.durationMin, 60)
    assert.equal(service.price, undefined)
    assert.equal(business.booking.kind, 'phone')
    assert.match(service.description, /Преди първо посещение е необходимо предварително обаждане/)
    assert.equal(business.openingHours, undefined)
    assert.equal(reviews.find(item => item.id === business.id).pricingDecision, 'not_publicly_listed')
    assert.ok(image(business).src.endsWith('/sx-preteen-modern-hiphop-class-v1.webp'))
  }
  assert.equal(row('sofia-diva-zone-mladost1-chitalishte').coordinates, null)
})

test('Maria Art keeps actual BGN values and minutes without adding washing or extensions and uses separate short/shoulder blow-dry images', () => {
  const business = row('sofia-maria-art-salon-moskva-han-presian15')
  assert.deepEqual(business.services.map(service => [service.price.amount, service.price.currency, service.durationMin]),
    [[25, 'BGN', 30], [30, 'BGN', 20], [40, 'BGN', 40]])
  assert.equal(business.openingHours, undefined)
  for (const service of business.services) {
    assert.match(service.name, /без екстеншъни/)
    assert.match(service.description, /20 лв/)
  }
  assert.match(business.services[0].description, /Не е заявено включено измиване/)
  assert.match(business.services[1].description, /Измиването е отделна услуга/)
  assert.ok(image(business, 0).src.endsWith('/womens-haircut-v1.webp'))
  assert.ok(image(business, 1).src.endsWith('/sx-womens-short-blowdry-styling-v1.webp'))
  assert.ok(image(business, 2).src.endsWith('/sx-womens-shoulder-blowdry-styling-v1.webp'))
})

test('Emotion is one studio with six whole-product euro fees, actual frame counts and variable durations rather than price-per-frame or invented appointment lengths', () => {
  const business = row('sofia-emotion-studio-gotse-delchev48')
  assert.deepEqual(business.services.map(service => service.price.amount), [92, 163, 230, 143, 143, 178])
  assert.ok(business.services.every(service => service.price.currency === 'EUR' && service.price.kind === 'fixed'))
  assert.ok(business.services.every(service => service.durationMin === undefined))
  assert.ok(business.services.every(service => service.description.length <= 300))
  assert.match(business.services[0].price.unit, /10 кадъра.*самостоятелно седящи, 6–7 м\.\+.*40–60/)
  assert.match(business.services[1].price.unit, /20 кадъра/)
  assert.match(business.services[2].price.unit, /30 кадъра.*60–90/)
  assert.match(business.services[3].price.unit, /неседящо бебе.*до 3 часа/)
  assert.match(business.services[4].price.unit, /самостоятелна фотосесия.*до 3 часа/)
  assert.match(business.services[5].price.unit, /церемония.*пред църквата.*до 1 час/)
  assert.equal(business.openingHours, undefined)
  assert.equal(photography.records.length, 1, 'two owner domains and external event work do not create extra businesses')
  assert.ok(image(business, 3).src.endsWith('/sx-newborn-studio-photo-v1.webp'))
  assert.ok(image(business, 4).src.endsWith('/sx-maternity-studio-photography-v1.webp'))
  assert.ok(image(business, 5).src.endsWith('/sx-baptism-event-photography-v1.webp'))
})

test('photography conditions survive compact descriptions and onboarding, including portfolio opt-out, express surcharge and child consent', () => {
  const business = row('sofia-emotion-studio-gotse-delchev48')
  const imported = catalogueOnboardingDetail(SOFIA_CATALOGUE, business.id, { now })
  for (const [index, service] of business.services.entries()) {
    assert.match(service.description, /10\+ дни/)
    assert.match(service.description, /30 работни дни/)
    assert.match(service.description, /експресно \+50%/)
    assert.match(service.description, /реклама се договаря/)
    assert.match(service.description, /при отказ студиото може да откаже ангажимента/)
    assert.equal(imported.services[index].description, service.description)
    assert.equal(imported.services[index].price_details.unit, service.price.unit)
    if (index !== 4) assert.match(service.description, /писмено съгласие на родител\/настойник/)
  }
})
