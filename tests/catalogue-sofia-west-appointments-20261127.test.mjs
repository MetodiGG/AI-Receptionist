import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import sharp from 'sharp'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL } from '../lib/discovery/official-sofia-address-source.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railDirections, railExternalAction, railServiceItems } from '../lib/discovery/rail.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { serviceDisplayName, serviceDisplayUnit } from '../lib/locale/public-content.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'

const now = Date.parse('2026-11-27T12:00:00Z'), expired = Date.parse('2026-12-19T12:00:00Z')
const cases = [
  {
    id: 'sofia-boantika-borovo-sveta-marina46', category: 'education', neighborhood: 'Борово',
    address: 'София, кв. Борово, ул. Света Марина 46', addressId: '20936', latitude: 42.669163, longitude: 23.283911,
    booking: 'https://boantika.bg/book-trial-visit/', price: 279, unit: 'месец',
    coverKey: 'go-boantika-borovo-20261127-v1', servicePhotoKey: 'go-boantika-borovo-study-room-20261127',
    bg: /занималня.+1.+4/u, en: /half.day.+(after.school|study).+1.+4/iu,
  },
  {
    id: 'sofia-vizio-works-gorna-banya-boycho-boychev81', category: 'auto_repair', neighborhood: 'Горна баня',
    address: 'София, кв. Горна баня, ул. Бойчо Бойчев 81', addressId: '38420', latitude: 42.683558, longitude: 23.239321,
    booking: 'https://vizio.bg/contacts/', price: 48,
    coverKey: 'go-vizio-works-gorna-banya-20261127-v1', servicePhotoKey: 'go-vizio-works-gorna-banya-tyres-16-17-20261127',
    bg: /4 гуми.+лек автомобил.+16.+17/u, en: /4\s+tyres.+passenger.+16.+17/iu,
  },
  {
    id: 'sofia-autolakir-center-moderno-predgradie-mickevich61', category: 'auto_repair', neighborhood: 'Модерно предградие',
    address: 'София, кв. Модерно предградие, ул. Адам Мицкевич 61', addressId: '117411', latitude: 42.729492, longitude: 23.282617,
    booking: 'https://alzservice.com/contact/', price: null,
    coverKey: 'go-autolakir-center-moderno-predgradie-20261127-v1', servicePhotoKey: 'go-autolakir-center-moderno-predgradie-panel-paint-20261127',
    bg: /бояджийск|боядисване/iu, en: /paint/iu,
  },
  {
    id: 'sofia-ezdasofia-slavia-haydushko-izvorche28', category: 'fitness', neighborhood: 'Славия',
    address: 'София, ж.к. Славия, ул. Хайдушко изворче 28 · Конна база „Хан Аспарух“', latitude: 42.679609, longitude: 23.2765053,
    ownerPoint: 'https://ezdasofia.com/contacts', phone: '+359899891184', price: 35, duration: 30,
    coverKey: 'go-ezdasofia-slavia-20261127-v1', servicePhotoKey: 'go-ezdasofia-slavia-private-lesson-20261127',
    bg: /езда/iu, en: /rid(?:e|ing)/iu,
  },
  {
    id: 'sofia-abv-sporten-svyat-mladost1-dospevski9', category: 'fitness', neighborhood: 'Младост 1',
    address: 'София, ж.к. Младост 1, ул. Димитър Доспевски 9', addressId: '108550', latitude: 42.652122, longitude: 23.376631,
    phone: '+359877695343', price: 45, unit: 'урок',
    coverKey: 'go-abv-sporten-svyat-mladost1-20261127-v1', servicePhotoKey: 'go-abv-sporten-svyat-mladost1-private-swimming-20261127',
    bg: /^Индивидуален урок по плуване · 1 участник$/u, en: /^One-to-one swimming lesson · 1 participant$/u,
  },
]
const records = new Map(SOFIA_CATALOGUE.filter(row => cases.some(item => item.id === row.id)).map(row => [row.id, row]))
const headers = { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }
let externalCalls = 0
const forbidden = () => {
  externalCalls++
  assert.fail('public catalogue search/details may not call booking, calendar or outside providers')
}
test.before(() => test.mock.method(globalThis, 'fetch', forbidden))
test.afterEach(() => assert.equal(externalCalls, 0, 'a caught provider error must not hide a forbidden call'))
test.after(() => test.mock.restoreAll())

function searchRequest(item, extras = {}, at = now) {
  const handler = createDiscoveryHandler({
    config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    sofiaOnly: true, now: DateTime.fromMillis(at), allowAttempt: () => true,
    readCatalogue: async () => [...records.values()], readInternal: async () => [],
    fetcher: forbidden, claimBudget: forbidden, readLinks: forbidden, readBookablePlaces: forbidden,
    readPartnerPlaces: forbidden, getBusiness: forbidden, getSlots: forbidden,
  })
  return handler(new Request('https://gorez.test/api/public/discovery', {
    method: 'POST', headers,
    body: JSON.stringify({ browse: true, cityCode: '68134', neighborhood: item.neighborhood, category: item.category, ...extras }),
  }))
}

function detailsRequest(id, at = now) {
  const handler = createPublicBusinessDetailsHandler({
    config: { enabled: true }, now: () => at, allowAttempt: () => true,
    findCatalogue: key => records.get(key), readPartner: forbidden,
  })
  return handler(new Request('https://gorez.test/api/public/discovery/business/' + id, { headers }), id)
}

test('dated appointments preserve service claims and exact civic or owner point evidence, including a genuinely unpriced offer', () => {
  assert.equal(records.size, cases.length)
  for (const item of cases) {
    const row = records.get(item.id), review = BOOKING_PRICE_REVIEWS.find(review => review.id === item.id)
    assert.equal(row.address, item.address)
    assert.equal(row.locationKind, 'premises')
    const bound = catalogueBoundCoordinates(row)
    assert.deepEqual([bound.latitude, bound.longitude, bound.sourceAddress], [item.latitude, item.longitude, item.address])
    if (item.addressId) {
      assert.deepEqual([bound.source, bound.method, bound.addressId],
        [OFFICIAL_SOFIA_SOURCE_URL, 'verified_official_address', item.addressId])
      assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Друг квартал' }), null)
    } else {
      assert.equal(bound.method, 'first_party_coordinates')
      assert.equal(bound.addressId, undefined, 'never represent the owner point as a municipal address row')
      assert.equal(bound.source, item.ownerPoint)
    }
    assert.equal(catalogueBoundCoordinates({ ...row, address: row.address + 'А' }), null)
    assert.deepEqual(row.booking, item.phone ? { kind: 'phone', phone: item.phone } : { kind: 'form', url: item.booking })
    assert.equal(row.services.length, 1)
    const [service] = row.services
    assert.match(service.name, item.bg)
    assert.equal(service.durationMin, item.duration)
    const verification = assessPricingReview(row, review, now)
    if (item.price !== null) {
      assert.equal(verification.state, 'reviewed')
      assert.equal(verification.reviewedPriceCount, 1)
      assert.deepEqual([service.price.amount, service.price.currency, service.price.kind, service.price.unit],
        [item.price, 'EUR', 'fixed', item.unit])
    } else {
      assert.equal(verification.state, 'service_reviewed')
      assert.equal(verification.pricingState, 'not_publicly_listed')
      assert.equal(verification.reviewedPriceCount, 0)
      assert.equal(review.priceSearch.bookingUrl, item.booking)
      assert.equal(service.price, undefined)
    }
    assert.equal(assessPricingReview({ ...row, services: [{ ...service, name: 'Changed after review' }] }, review, now).reason, 'reviewed_service_inventory_changed')
    assert.equal(approvedCatalogueRecord(row, expired), null)
  }
})

test('BG and EN nearby search, details and profiles retain the trip and outbound booking without native slots', async () => {
  for (const item of cases) {
    const row = records.get(item.id), profile = catalogueProfileView(row, { now })
    const details = await detailsRequest(item.id)
    assert.equal(details.status, 200)
    const { business } = await details.json()
    const [service] = business.details.services
    assert.match(serviceDisplayName(service, 'bg'), item.bg)
    assert.match(serviceDisplayName(service, 'en'), item.en)
    assert.doesNotMatch(service.presentationEn.description, /\p{Script=Cyrillic}/u)
    assert.equal(service.price, item.price)
    if (item.unit) {
      assert.equal(serviceDisplayUnit(service, 'bg'), item.unit)
    }
    if (item.price === 279) {
      assert.match(serviceDisplayUnit(service, 'en'), /month/iu)
      assert.match(service.description, /Месечна такса.+2 учебни часа.+5%.+5%.+пробно посещение/u)
      assert.match(service.presentationEn.description, /monthly.+2.+5%.+5%.+trial/iu)
    }
    if (item.price === 45) {
      assert.equal(serviceDisplayUnit(service, 'en'), 'lesson')
      assert.match(service.description, /пълно плащане.+12:00 предходния ден.+12:00 в петък.+сумата не се връща/u)
      assert.match(service.presentationEn.description, /full payment.+12:00 the day before.+12:00 on Friday.+non-refundable/iu)
    }
    if (item.price === 48) {
      assert.match(service.description, /четири стандартни гуми.+Run Flat.+SUV.+4×4.+микробус/u)
      assert.match(service.presentationEn.description, /(?:four|4) standard.+run.flat.+SUV.+4[×x]4.+van/iu)
    }
    if (item.duration) {
      assert.equal(service.durationMin, item.duration)
      assert.match(service.description, /за един човек.+10:00.+18:00.+авансово плащане.+ул\. Славия/u)
      assert.match(service.presentationEn.description, /one person.+10:00.+18:00.+(?:advance|prepayment).+Slavia/iu)
    }
    for (const locale of ['bg', 'en']) {
      const nearby = await searchRequest(item, { locale, coordinates: { latitude: item.latitude, longitude: item.longitude, consent: true }, radiusKm: 1 })
      assert.equal(nearby.status, 200)
      const { results } = await nearby.json()
      assert.deepEqual(results.map(hit => hit.id), [item.id])
      const [card] = results
      assert.deepEqual(card.availability, { status: 'external', slots: [] })
      assert.deepEqual(railServiceItems(card).map(service => service.price), [item.price])
      for (const view of [card, business, profile]) {
        assert.equal(view.address, item.address)
        assert.deepEqual(railExternalAction(view, now),
          item.phone ? { kind: 'phone', href: 'tel:' + item.phone } : { kind: 'form', href: item.booking })
        const map = new URL(businessDirectionsUrl(view))
        assert.equal(map.href, railDirections(view))
        assert.equal(map.origin, 'https://www.google.com')
        assert.equal(map.searchParams.get('api'), '1')
        assert.equal(map.searchParams.get('destination'), `${item.latitude},${item.longitude}`)
        assert.equal(map.searchParams.get('destination_place_id'), null)
      }
    }
    const far = await searchRequest(item, { coordinates: { latitude: 42.787, longitude: 23.47, consent: true }, radiusKm: 1 })
    assert.deepEqual((await far.json()).results, [])
    assert.equal((await detailsRequest(item.id, expired)).status, 404)
  }
})

test('the cover and detail photos resolve through the public runtime and decode to distinct local images', async () => {
  const paths = new Set(), decoded = new Set()
  for (const item of cases) {
    const row = records.get(item.id), profile = catalogueProfileView(row, { now })
    const response = await detailsRequest(item.id)
    const { business } = await response.json()
    const [service] = business.details.services
    const [cover] = businessCoverPhotoSources(profile)
    const detail = publicDetailServiceThumbnail(service, { business: profile })
    assert.equal(cover, `/business-cover-photos/${item.coverKey}.webp`)
    assert.equal(detail.source, 'illustrative')
    assert.equal(detail.src, `/service-photos/${item.servicePhotoKey}-v1.webp`)
    assert.equal(publicDetailServiceThumbnail(service, { business: profile, locale: 'en' }).src, detail.src)
    const fingerprints = await Promise.all([cover, detail.src].map(async path => {
      assert.match(path, /^\/(?:business-cover-photos|service-photos)\/[a-z0-9_-]+\.webp$/u)
      assert.ok(!paths.has(path), `duplicate cover or detail path: ${path}`)
      paths.add(path)
      const bytes = await readFile(new URL('../public' + path, import.meta.url))
      const metadata = await sharp(bytes).metadata()
      assert.equal(metadata.format, 'webp')
      assert.ok(metadata.width >= 320 && metadata.height >= 320)
      const pixels = await sharp(bytes).raw().toBuffer()
      const hash = createHash('sha256').update(pixels).digest('hex')
      assert.ok(!decoded.has(hash), `duplicate decoded pixels: ${path}`)
      decoded.add(hash)
      return fingerprintDiscoveryPhoto(bytes)
    }))
    assert.equal(compareDiscoveryPhotos(...fingerprints), null, `${item.id}: cover and service need distinct scenes`)
  }
  assert.equal(paths.size, cases.length * 2)
})
