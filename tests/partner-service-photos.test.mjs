import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { REVIEWED_PARTNER_SERVICE_PHOTOS, reviewedPartnerServicePhoto } from '../lib/partner-service-photos.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { NEUTRAL_SERVICE_PHOTO_SRC, INLINE_NEUTRAL_SERVICE_PHOTO_SRC } from '../lib/service-photo-fallback.mjs'
import { businessDetailServices } from '../lib/discovery/business-details.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'

const fixture = JSON.parse(await readFile(new URL('./fixtures/native-partner-services-20261113.json', import.meta.url), 'utf8'))
const businesses = fixture.businesses
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const placeholderIds = new Set([
  'a8bfd4a9-1249-4a72-a1d3-5b78edfe2dd5',
  '146da856-04ad-40d2-8095-cdf34dc65bc6',
  '76f91048-afae-47ba-8d8b-003a99efe2c7',
])
const expectedPhotos = new Map([
  ['9b74aa5f-2735-4d41-8c8b-fae2422c8a6f', 'sx-auto-engine-repair'],
  ['191082c0-a7f0-4f69-88e8-149ed69eac2c', 'partner-car-lift-inspection'],
  ['69f2e80d-6631-4fd4-8210-622272d68fcb', 'car-aircon-service'],
  ['cbcb6597-0b5e-44d3-9adc-e0fdf6ca8838', 'sx-hair-male-colour'],
  ['6fab1326-f6fc-4ca2-ab5d-f098fadd3117', 'haircut-beard-combo'],
  ['ddb089f1-4fb3-422f-8fae-5b1689c1a0da', 'partner-megan-supplied'],
  ['ef28ff51-cf90-49dc-9e1d-674713f604a2', 'partner-hair-beard-brows-finish'],
  ['5916e4b4-a1d3-4fe0-8b08-d489b140ee93', 'mens-haircut'],
  ['ddd44c38-1dea-433a-af51-4d812eaee013', 'partner-nose-wax'],
])
const namedServices = business => business.services.filter(service => !placeholderIds.has(service.id))
const locate = id => {
  const business = businesses.find(row => row.services.some(service => service.id === id))
  return { business, service: business?.services.find(service => service.id === id) }
}
const nativeRows = () => businesses.map(business => ({ ...business, active: true, platform_status: 'enabled' }))
const intent = { browse: true, searchV2: true, requirements: [] }
const photoPath = photoId => '/service-photos/' + photoId + '-v1.webp'

test('the native photo fixture retains 25 public service facts and no customer or contact data', () => {
  assert.equal(businesses.length, 6)
  assert.equal(businesses.reduce((sum, business) => sum + business.services.length, 0), 25)
  assert.equal(businesses.flatMap(namedServices).length, 22)
  for (const business of businesses) {
    assert.deepEqual(Object.keys(business).sort(), ['id', 'name', 'industry', 'businessCategory', 'services'].sort())
    assert.match(business.id, uuid)
    for (const service of business.services) {
      assert.deepEqual(Object.keys(service).sort(), ['id', 'name', 'category', 'description', 'price', 'currency', 'duration_min'].sort())
      assert.match(service.id, uuid); assert.equal(service.category, null); assert.equal(service.description, null)
      assert.equal(service.currency, 'EUR'); assert.ok(Number.isFinite(service.price)); assert.ok(service.duration_min > 0)
    }
  }
})

test('nine immutable exact native associations bind to the observed service IDs, not category-wide guesses', () => {
  assert.equal(REVIEWED_PARTNER_SERVICE_PHOTOS.length, 9)
  assert.ok(Object.isFrozen(REVIEWED_PARTNER_SERVICE_PHOTOS))
  assert.deepEqual(REVIEWED_PARTNER_SERVICE_PHOTOS.map(row => row.serviceId).sort(), [...expectedPhotos.keys()].sort())
  assert.equal(new Set(REVIEWED_PARTNER_SERVICE_PHOTOS.map(row => JSON.stringify([row.businessId, row.serviceId]))).size, 9)
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId)
    assert.ok(Object.isFrozen(record)); assert.equal(record.businessId, business.id)
    assert.equal(record.name, service.name); assert.equal(record.category, null)
    assert.equal(record.photoId, expectedPhotos.get(service.id))
    assert.match(record.photoId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    assert.equal(record.source, record.photoId === 'partner-megan-supplied' ? 'provided' : 'illustrative')
    assert.ok(!Object.hasOwn(record, 'price')); assert.ok(!Object.hasOwn(record, 'duration_min'))
    assert.equal(reviewedPartnerServicePhoto(service, business), record)
    assert.equal(reviewedPartnerServicePhoto({ ...service, name: '  ' + service.name + '\n' }, business), record)
    assert.equal(reviewedPartnerServicePhoto(service, { ...business, name: 'Преименуван партньор' }), record)
  }
})

test('partner associations reject reused IDs, another business, altered names and nonmatching categories', () => {
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId)
    for (const changed of [
      { id: '00000000-0000-4000-8000-000000000001' },
      { id: undefined }, { id: null }, { id: {} },
      { name: service.name + ' и друга процедура' }, { name: '' }, { name: null },
      { category: 'other' }, { category: 'barber' }, { category: {} },
    ]) assert.equal(reviewedPartnerServicePhoto({ ...service, ...changed }, business), null, service.name)
    for (const changed of [
      { id: '00000000-0000-4000-8000-000000000002' }, { id: undefined }, { id: null }, { id: {} },
    ]) assert.equal(reviewedPartnerServicePhoto(service, { ...business, ...changed }), null, service.name)
    for (const other of businesses.filter(row => row.id !== business.id)) assert.equal(reviewedPartnerServicePhoto(service, other), null)
    const anotherId = REVIEWED_PARTNER_SERVICE_PHOTOS.find(row => row.serviceId !== service.id).serviceId
    assert.equal(reviewedPartnerServicePhoto({ ...service, id: anotherId }, business), null)
  }
  for (const value of [null, undefined, {}, '__proto__']) assert.equal(reviewedPartnerServicePhoto(value, {}), null)
})

test('native reviewed photos win over forged image fields and unrelated catalogue keys', () => {
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId)
    const injected = { ...service, photoId: '../private', image: { src: 'https://invalid.example/photo.jpg' },
      photo: { src: 'javascript:alert(1)' }, illustrativePhotoKey: 'sx-auto-engine-repair' }
    assert.equal(reviewedPartnerServicePhoto(injected, business), record)
    assert.equal(serviceThumbnail(injected, { business }).src, photoPath(record.photoId))
  }
})

test('the supplied MEGAN photo and illustrative alternatives have honest Bulgarian and English provenance', () => {
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId)
    for (const locale of ['bg', 'en']) {
      const image = serviceThumbnail(service, { business, locale })
      assert.equal(image.type, 'photo'); assert.equal(image.photoMatch, 'exact')
      assert.equal(image.source, record.source); assert.equal(image.src, photoPath(record.photoId))
      assert.equal(image.srcSet, null); assert.ok(image.alt.trim())
      if (record.source === 'provided') {
        assert.match(image.alt, locale === 'en' ? /provided|supplied/i : /предоставен/i)
        assert.doesNotMatch(image.alt, /\bAI\b|генериран|generated/i)
      } else {
        assert.match(image.alt, locale === 'en' ? /illustrative/i : /примерна|илюстративна/i)
        assert.match(image.alt, locale === 'en' ? /not .*business.*work/i : /не .*работа.*бизнес/i)
      }
    }
  }
})

test('a rights-checked exact business service image keeps priority over the reviewed native default', () => {
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId)
    const trusted = { businessId: business.id, serviceId: service.id, businessProvided: true, rightsCleared: true,
      src: '/api/business-media/11111111-2222-4333-8444-555555555555', alt: { bg: 'Снимка от партньора', en: 'Partner photo' } }
    const owned = serviceThumbnail(service, { business, trustedServiceImage: trusted, locale: 'en' })
    assert.equal(owned.src, trusted.src); assert.equal(owned.alt, trusted.alt.en)
    for (const changed of [{ businessId: 'another-business' }, { serviceId: 'another-service' }, { rightsCleared: false }, { businessProvided: false }]) {
      assert.equal(serviceThumbnail(service, { business, trustedServiceImage: { ...trusted, ...changed } }).src, photoPath(record.photoId))
    }
    assert.equal(serviceThumbnail(service, { business, trustedServiceImage: trusted, unavailableSources: [trusted.src] }).src, photoPath(record.photoId))
  }
})

test('failed reviewed photos use the safe existing fallback chain without retrying their unavailable source', () => {
  for (const record of REVIEWED_PARTNER_SERVICE_PHOTOS) {
    const { business, service } = locate(record.serviceId), src = photoPath(record.photoId)
    const fallback = serviceThumbnail(service, { business, unavailableSources: [src] })
    assert.equal(fallback.type, 'photo'); assert.notEqual(fallback.src, src)
    assert.ok(fallback.src.startsWith('/service-photos/') || fallback.src === INLINE_NEUTRAL_SERVICE_PHOTO_SRC)
  }
  const record = REVIEWED_PARTNER_SERVICE_PHOTOS.find(row => row.photoId === 'partner-megan-supplied')
  const { business, service } = locate(record.serviceId)
  const terminal = serviceThumbnail(service, { business, locale: 'en', unavailableSources: [photoPath(record.photoId), NEUTRAL_SERVICE_PHOTO_SRC] })
  assert.equal(terminal.src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC)
  assert.match(terminal.alt, /Neutral.*not a depiction/)
})

test('all 22 named partner services resolve to photos while original unspecified rows do not invent a procedure', () => {
  const before = JSON.stringify(fixture)
  let named = 0, unspecified = 0, reviewed = 0
  for (const business of businesses) for (const service of business.services) {
    const image = serviceThumbnail(service, { business })
    assert.equal(image.type, 'photo')
    if (placeholderIds.has(service.id)) {
      unspecified++; assert.equal(service.name, 'Нова услуга'); assert.equal(service.price, 0)
      assert.equal(reviewedPartnerServicePhoto(service, business), null)
      assert.equal(image.photoMatch, 'neutral'); assert.equal(image.src, NEUTRAL_SERVICE_PHOTO_SRC)
    } else {
      named++; assert.notEqual(image.photoMatch, 'neutral', business.name + ': ' + service.name)
      assert.doesNotMatch(image.src, /appointment-workspace|category-art/)
      if (expectedPhotos.has(service.id)) { reviewed++; assert.equal(image.src, photoPath(expectedPhotos.get(service.id))) }
    }
  }
  assert.equal(named, 22); assert.equal(unspecified, 3); assert.equal(reviewed, 9)
  assert.equal(JSON.stringify(fixture), before, 'photo resolution never changes IDs, prices, durations or historical placeholders')
})

test('the detail projection retains valid native service UUIDs and prices but never exposes malformed IDs', () => {
  const before = JSON.stringify(fixture)
  for (const business of businesses) {
    const services = namedServices(business), projected = businessDetailServices({ id: business.id, details: { services } })
    assert.equal(projected.length, services.length)
    for (let index = 0; index < projected.length; index++) {
      const item = projected[index], original = services[index]
      assert.equal(item.id, original.id); assert.equal(item.name, original.name); assert.equal(item.category, original.category)
      assert.equal(item.price, original.price); assert.equal(item.currency, original.currency); assert.equal(item.durationMin, original.duration_min)
      assert.notEqual(serviceThumbnail(item, { business }).photoMatch, 'neutral')
    }
  }
  for (const id of ['../private', '__proto__', {}, null]) {
    const [item] = businessDetailServices({ services: [{ id, name: 'Безопасен тест', price: 5, currency: 'EUR' }] })
    assert.ok(!Object.hasOwn(item, 'id') || item.id == null)
  }
  assert.equal(JSON.stringify(fixture), before)
})

test('native homepage normalization and detail adapters publish 22 named services without changing price or selection IDs', () => {
  const before = JSON.stringify(fixture)
  const rows = normalizeInternalBusinesses(nativeRows(), intent, { detailLimit: 500 })
  assert.equal(rows.length, 6); assert.equal(rows.reduce((sum, row) => sum + row.services.length, 0), 22)
  for (const row of rows) {
    const original = businesses.find(business => business.id === row.id), expected = namedServices(original)
    assert.deepEqual(row.services.map(service => service.id).sort(), expected.map(service => service.id).sort())
    for (const service of [...row.services, ...businessDetailServices(row)]) {
      const source = expected.find(item => item.id === service.id)
      assert.ok(source, 'the projected UUID must identify a real retained native service')
      assert.equal(service.price, source.price); assert.equal(service.currency, source.currency)
      assert.equal(service.durationMin, source.duration_min)
      assert.notEqual(serviceThumbnail(service, { business: row }).photoMatch, 'neutral', row.name + ': ' + service.name)
      if (expectedPhotos.has(service.id)) assert.equal(serviceThumbnail(service, { business: row }).src, photoPath(expectedPhotos.get(service.id)))
    }
    assert.ok(!row.services.some(service => placeholderIds.has(service.id)))
  }
  assert.equal(JSON.stringify(fixture), before)
})

test('the actual native public-details handler delivers photo-capable IDs with no database or booking write', async () => {
  const before = JSON.stringify(fixture), reads = []
  const rows = nativeRows()
  const handler = createPublicBusinessDetailsHandler({
    config: { enabled: true, environment: 'production' }, allowAttempt: async () => true,
    readPartner: async id => { reads.push(id); return rows.find(row => row.id === id) },
    findCatalogue: async () => { throw Error('native UUID must not use catalogue adapter') },
  })
  let visible = 0
  for (const original of businesses) {
    const request = new Request('https://www.gorez.co/api/public/discovery/business/' + original.id,
      { headers: { origin: 'https://www.gorez.co', 'sec-fetch-site': 'same-origin' } })
    const response = await handler(request, original.id)
    assert.equal(response.status, 200)
    const { business } = await response.json(), services = businessDetailServices(business)
    assert.equal(business.id, original.id); assert.equal(services.length, namedServices(original).length)
    for (const service of services) {
      const source = namedServices(original).find(item => item.id === service.id)
      assert.ok(source); assert.equal(service.price, source.price)
      assert.notEqual(serviceThumbnail(service, { business }).photoMatch, 'neutral')
      if (expectedPhotos.has(service.id)) assert.equal(serviceThumbnail(service, { business }).src, photoPath(expectedPhotos.get(service.id)))
    }
    visible += services.length
  }
  assert.equal(reads.length, 6); assert.equal(visible, 22)
  assert.equal(JSON.stringify(fixture), before)
})
