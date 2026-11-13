import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { serviceArtKind, serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { catalogueServicePhotoKind } from '../lib/service-photo-catalogue-matches.mjs'
import { NEUTRAL_SERVICE_PHOTO_SRC } from '../lib/service-photo-fallback.mjs'
import { specificServicePhotoKey } from '../lib/specific-service-photo-ids.mjs'

const photoId = 'sx-auto-panel-spray-paint'
const src = `/service-photos/${photoId}-v1.webp`
// Public fields from the reported native-service example, not an ID-specific
// override. The price and duration are never used to choose the activity.
const business = { id: 'native-auto-fixture', name: 'АИМ АУТОПЕЙНТ', industry: 'auto' }
const service = { id: 'native-panel-fixture', name: 'Боядисване на детайл', price: 300, currency: 'EUR', duration_min: 60 }

test('native panel painting uses vehicle context before the ambiguous hair-colour word', () => {
  const before = JSON.stringify({ business, service })
  for (const category of [undefined, null, '', 'auto', 'auto_repair', 'detailing', 'other', 'Автобояджийски услуги']) {
    const current = { ...service, category }
    assert.equal(serviceArtKind(current, business), 'auto-repair', String(category))
    const result = serviceThumbnail(current, { business })
    assert.equal(result.src, src, String(category))
    assert.equal(result.kind, 'auto-repair')
    assert.equal(result.icon, 'wrench')
    assert.equal(result.photoMatch, 'activity')
    assert.equal(result.source, 'illustrative')
    assert.match(result.alt, /не показва работа на бизнеса/)
  }
  assert.equal(JSON.stringify({ business, service }), before)
})

test('future native services match the activity, not the reported merchant identity', () => {
  for (const context of [{ industry: 'auto' }, { businessCategory: 'auto_repair' }, { category: 'auto_repair' }]) {
    for (const name of ['Боядисване на детайл', 'Пребоядисване на един детайл', 'Боядисване на автомобилен детайл', 'Боядисване на детайл · 60 минути', 'Car panel repainting', 'Automotive panel spray painting', 'Repainting a car panel']) {
      const current = { name }
      assert.equal(catalogueServicePhotoKind(current, context), photoId, name)
      assert.equal(serviceThumbnail(current, { business: context }).src, src, name)
      assert.equal(serviceArtKind(current, context), 'auto-repair', name)
    }
  }
  assert.equal(catalogueServicePhotoKind({ name: 'Боядисване на автомобилен детайл' }), photoId)
  assert.equal(catalogueServicePhotoKind({ name: 'Car panel painting' }), photoId)
  assert.equal(catalogueServicePhotoKind({ name: 'Боядисване на детайл' }), null)
  assert.equal(serviceThumbnail({ name: 'Боядисване' }, { business }).src, NEUTRAL_SERVICE_PHOTO_SRC)
})

test('a car panel image never substitutes for other domains or a conflicting declared service domain', () => {
  for (const category of ['hair', 'barber', 'beauty', 'nails', 'home_services', 'pets', 'education', 'fitness', 'consulting', 'health']) {
    const current = { ...service, category }
    assert.notEqual(serviceThumbnail(current, { business }).src, src, category)
    assert.equal(catalogueServicePhotoKind(current, business), null, category)
    assert.notEqual(serviceThumbnail(current, { business: { category } }).src, src, category)
  }
  for (const [name, category] of [['Боядисване на коса', 'hair'], ['Боядисване на корени', 'hair'], ['Боядисване на стени', 'home_services'], ['Боядисване на мебелен детайл', 'home_services'], ['Боядисване на нокти', 'nails'], ['Боядисване на куче', 'pets']]) {
    assert.notEqual(serviceThumbnail({ name, category }).src, src, name)
  }
  assert.equal(serviceArtKind({ name: 'Боядисване на стени', category: 'home_services' }), 'home-services')
  assert.equal(serviceThumbnail({ name: 'Боядисване на коса', category: 'hair' }).src, '/service-photos/full-hair-color-v1.webp')
  assert.equal(serviceThumbnail({ name: 'Боядисване на корени', category: 'hair' }).src, '/service-photos/hair-color-v1.webp')
})

test('another vehicle, part, method or combined activity never borrows panel painting', () => {
  for (const name of ['Боядисване на спирачни апарати', 'Боядисване на джанти', 'Тенекеджийско изчукване', 'Ремонт на детайл', 'Боядисване на детайл и ремонт', 'Боядисване на детайл + полиране', 'Боядисване на детайл · прахово', 'Боядисване на детайл · PDR', 'Боядисване на детайл · без боя', 'Боядисване на детайл · PPF', 'Боядисване на детайл · керамично покритие', 'Боядисване на детайл · джанта', 'Боядисване на детайл · мотоциклет', 'Цялостно боядисване на автомобил', 'Car panel painting and repair', 'Car panel painting · powder coating', 'Car panel painting · motorcycle', 'Car panel painting · caliper']) {
    assert.notEqual(serviceThumbnail({ name }, { business }).src, src, name)
    assert.equal(catalogueServicePhotoKind({ name }, business), null, name)
  }
  for (const description of ['Прахово боядисване.', 'Боядисване на спирачни апарати.', 'Includes bodywork repair.', 'Motorcycle panel painting.']) {
    assert.equal(catalogueServicePhotoKind({ ...service, description }, business), null, description)
  }
})

test('business-provided service images retain priority and an unavailable panel image fails safely', () => {
  const trustedServiceImage = { businessId: business.id, serviceId: service.id, businessProvided: true, rightsCleared: true, src: '/businesses/native-auto-fixture/panel.webp' }
  const supplied = serviceThumbnail(service, { business, trustedServiceImage })
  assert.equal(supplied.src, trustedServiceImage.src)
  assert.equal(supplied.photoMatch, 'exact')
  const failed = serviceThumbnail(service, { business, unavailableSources: [src] })
  assert.equal(failed.src, NEUTRAL_SERVICE_PHOTO_SRC)
  assert.equal(failed.photoMatch, 'neutral')
})

test('the reviewed panel frame is browser-allowlisted and has one matching local provenance entry', async () => {
  assert.equal(specificServicePhotoKey(photoId), photoId)
  const manifest = JSON.parse(await readFile(new URL('../docs/specific-service-photo-generation-2026-11-12.json', import.meta.url), 'utf8'))
  const matches = manifest.assets.filter(asset => asset.id === photoId)
  assert.equal(matches.length, 1)
  const asset = matches[0]
  assert.equal(asset.file, `public${src}`)
  assert.equal(asset.width, 256)
  assert.equal(asset.height, 256)
  assert.equal(asset.review.status, 'accepted')
  const bytes = await readFile(new URL(`../public${src}`, import.meta.url))
  assert.ok(bytes.length > 0 && bytes.length < 35000)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
})
