import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { serviceArtKind, serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const business = { id: 'business-1', industry: 'beauty' }, service = { id: 'service-1', name: 'Маникюр с парафинова терапия', category: 'nails' }
const photo = { src: '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194', businessId: business.id, serviceId: service.id,
  businessProvided: true, rightsCleared: true, alt: { bg: 'Маникюр от студиото', en: 'Manicure by the studio' } }

test('manicure and pedicure never share the manicure photo, even in a nail business', () => {
  const manicure = serviceThumbnail({ ...service, name: 'Маникюр' }, { business }), pedicure = serviceThumbnail({ name: 'Педикюр с гел лак', category: 'nails' }, { business })
  assert.equal(manicure.kind, 'manicure'); assert.equal(manicure.src, '/service-photos/classic-manicure-v1.webp')
  assert.equal(pedicure.kind, 'pedicure'); assert.equal(pedicure.src, '/service-photos/gel-pedicure-v1.webp'); assert.notEqual(manicure.icon, pedicure.icon)
  for (const name of ['Medical pedicure', 'Терапевтичен педикюр', 'Manicure + Pedicure', 'Маникюр и педикюр', 'Сваляне на гел лак', 'Ноктопластика']) {
    assert.notEqual(serviceThumbnail({ name, category: 'nails' }, { business }).src, manicure.src)
  }
})

test('object illustrations follow the service, not the business name or broad category, and are not counted as photos', async () => {
  const examples = [['Подстригване', 'hair'], ['Ремонт на тенис ракета', 'sports', 'fitness'], ['Груминг на куче и котка', 'pets'],
    ['Външно измиване', 'carwash', 'car_wash'], ['Ремонт на окачване', 'repair', 'auto_repair']]
  for (const [name, asset, category] of examples) {
    const result = serviceThumbnail({ name, category })
    assert.equal(result.src, `/category-art/${asset}-sm-v1.webp`, name)
    assert.equal(result.type, 'illustration'); assert.match(result.srcSet, /128w, .*256w/)
    assert.ok((await stat(new URL(`../public${result.src}`, import.meta.url))).size < 35000)
  }
  for (const [name, category] of [['IPL фотоепилация на лице', 'beauty'], ['Операция на стъпалото', 'health'],
    ['Терапия на тенис лакът', 'health'], ['Ремонт на маса за тенис на маса', 'fitness'],
    ['Carpet repair', 'home_services'], ['Бръснене на лице с кърпа', 'barber']]) {
    assert.equal(serviceThumbnail({ name, category }, { business: { name: 'Nails Hair Tennis Garage', industry: category } }).type, 'icon', name)
  }
})

test('the owner-approved service photos exist locally, are small, and describe what is pictured', async () => {
  const examples = [
    ['Дамско подстригване', 'hair', 'womens-haircut'], ['Маникюр с гел лак', 'nails', 'gel-manicure'],
    ['Педикюр с гел лак – 60 мин', 'nails', 'gel-pedicure'], ['Почистване на лице', 'beauty', 'facial-cleansing'],
    ['Оформяне на брада', 'barber', 'beard-trim'], ['Смяна и баланс на гуми', 'auto_repair', 'tyre-change'],
    ['Безконтактно външно измиване', 'car_wash', 'touchless-car-wash'], ['Пилатес реформър', 'fitness', 'reformer-pilates'],
    ['Курс по пиано', 'education', 'piano-lesson'], ['Подстригване на куче', 'pets', 'dog-haircut'],
    ['Пране на диван', 'home_services', 'sofa-cleaning'], ['Индивидуална кинезитерапия', 'health', 'physiotherapy'],
    ['Счетоводна консултация', 'consulting', 'accounting-consultation'], ['Машинно полиране', 'detailing', 'machine-car-polishing'],
    ['Лабораторни изследвания', 'other', 'lab-tests'],
  ]
  for (const [name, category, id] of examples) {
    const result = serviceThumbnail({ name, category }, { locale: 'en' })
    assert.equal(result.src, `/service-photos/${id}-v1.webp`, name)
    assert.equal(result.type, 'photo'); assert.equal(result.source, 'illustrative'); assert.match(result.alt, /not the business's own work/)
    assert.ok((await stat(new URL(`../public${result.src}`, import.meta.url))).size < 30000)
    assert.notEqual(serviceThumbnail({ name, category }, { unavailableSources: [result.src] }).type, 'photo')
  }
  for (const [name, category] of [
    ['Маникюр и педикюр с гел лак', 'nails'], ['Педикюр за врастнал нокът', 'nails'], ['Сваляне на гел лак и маникюр', 'nails'],
    ['Мъжко подстригване и оформяне на вежди', 'hair'], ['Бръснене на глава + боядисване на брада', 'barber'], ['Смяна на трансмисионно масло', 'auto_repair'],
    ['Машинно полиране на джанти', 'detailing'], ['Пробен урок по пиано или флейта', 'education'], ['Лабораторно изследване NIFTY Pro', 'other'],
    ['Къпане и подстригване на куче', 'pets'], ['Педикюр с гел лак за куче', 'pets'],
  ]) assert.notEqual(serviceThumbnail({ name, category }).type, 'photo', name)
})

test('approved additions win over generic matches without borrowing photos for different procedures', () => {
  for (const [name, category, id] of [
    ['Мъжки маникюр', 'nails', 'male-manicure'],
    ['Маникюр с обикновен лак', 'nails', 'regular-nail-polish'],
    ['Медицински педикюр', 'nails', 'medical-pedicure'],
    ['Боядисване на коса', 'hair', 'full-hair-color'],
    ['Полиране на фарове', 'detailing', 'headlight-restoration'],
    ['Мъжко подстригване и оформяне на брада', 'hair', 'haircut-beard-combo'],
    ['Бръснене на глава', 'barber', 'head-shave'],
    ['Лазерна епилация на лице', 'beauty', 'laser-face'],
    ['Лазерна епилация на интимна зона', 'beauty', 'laser-equipment'],
  ]) assert.equal(serviceThumbnail({ name, category }).src, `/service-photos/${id}-v1.webp`, name)
  const service = { name: 'Лазерна епилация на интимна зона', category: 'beauty' }
  assert.match(serviceThumbnail(service).alt, /апарат за лазерна епилация/)
  assert.match(serviceThumbnail(service, { locale: 'en' }).alt, /hair removal equipment/)
})

test('every approved photo id has a light local file and exactly one provenance entry', async () => {
  const docs = await Promise.all(['docs/service-photo-prompts-2026-11-11.json', 'docs/service-photo-prompts-16-45.json',
    'docs/service-photo-prompts-46-94.json', 'docs/service-photo-prompts-brow-threading.json',
    'docs/service-photo-prompts-95-146.json'].map(path => read(path)))
  const approvedFiles = [...APPROVED_SERVICE_PHOTO_IDS].map(id => `public/service-photos/${id}-v1.webp`)
  assert.equal(approvedFiles.length, 146)
  assert.equal(new Set(approvedFiles).size, approvedFiles.length)
  assert.deepEqual(docs.flatMap(doc => JSON.parse(doc).assets.map(asset => asset.file)).sort(), approvedFiles.sort())
  for (const path of approvedFiles) assert.ok((await stat(new URL(`../${path}`, import.meta.url))).size < 30000, path)
})

test('animal coat/nail care cannot become human haircut/manicure art and vague services stay neutral', () => {
  for (const name of ['Подстригване', 'Подрязване на нокти', 'Маникюр', 'Бръснене на котка']) {
    const result = serviceThumbnail({ name }, { business: { industry: 'pets' } })
    assert.equal(result.kind, 'pet-care'); assert.equal(result.icon, 'paw'); assert.equal(result.src, null)
  }
  assert.equal(serviceArtKind({ name: 'Подстригване на куче' }), 'dog-grooming')
  assert.equal(serviceArtKind({ name: 'Ремонт на нокът', category: 'nails' }), 'other')
  assert.equal(serviceArtKind({ name: 'Измиване на коса', category: 'hair' }), 'other')
  assert.equal(serviceArtKind({ name: 'Catering consultation', category: 'consulting' }), 'consulting')
  for (const value of [undefined, null, {}, { name: '__proto__', category: 'constructor' }, { name: 'Час', category: '__proto__' }]) {
    const result = serviceThumbnail(value)
    assert.equal(result.type, 'icon'); assert.equal(result.src, null); assert.equal(result.icon, 'calendarSearch')
  }
})

test('only an explicit rights-checked business-provided photo for this exact business and service takes precedence', () => {
  const result = serviceThumbnail(service, { business, trustedServiceImage: photo, locale: 'en' })
  assert.equal(result.type, 'photo'); assert.equal(result.src, photo.src); assert.equal(result.alt, photo.alt.en)
  assert.equal(serviceThumbnail(service, { business, trustedServiceImage: photo }).alt, photo.alt.bg)
  for (const changed of [{ businessId: 'another-business' }, { serviceId: 'another-service' }, { businessProvided: false }, { rightsCleared: false }, { rightsCleared: undefined }]) {
    assert.equal(serviceThumbnail(service, { business, trustedServiceImage: { ...photo, ...changed } }).type, 'illustration')
  }
  assert.equal(serviceThumbnail({ ...service, id: undefined }, { business, trustedServiceImage: photo }).type, 'illustration')
  assert.equal(serviceThumbnail({ ...service, photo, image: photo }, { business: { ...business, photos: [photo] } }).type, 'illustration')
})

test('remote, malformed and arbitrary first-party URLs cannot be service photos', () => {
  for (const src of ['https://example.com/manicure.jpg', '//example.com/manicure.jpg', 'data:image/png;base64,a', 'javascript:alert(1)', '/category-photos/nails-v2.webp',
    '/category-art/nails-v1.webp', '/api/business-media/not-a-uuid', '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194?url=https://example.com',
    '/businesses/../private.webp', '/businesses/studio/%2e%2e.webp', '/businesses/studio/image.webp#fragment', '/businesses/studio/image.webp?x=1']) {
    assert.equal(serviceThumbnail(service, { business, trustedServiceImage: { ...photo, src } }).type, 'illustration', src)
  }
  const curated = serviceThumbnail(service, { business, trustedServiceImage: { ...photo, src: '/businesses/studio/manicure-approved.webp', alt: {} } })
  assert.equal(curated.type, 'photo'); assert.match(curated.alt, /Снимка от бизнеса/)
})

test('failed photos degrade to honest illustration, failed illustrations to an accessible icon in either locale', () => {
  const illustrated = serviceThumbnail(service, { business, trustedServiceImage: photo, unavailableSources: [photo.src] })
  assert.equal(illustrated.type, 'illustration'); assert.match(illustrated.alt, /Илюстрация.*не е снимка/)
  const fallback = serviceThumbnail(service, { business, trustedServiceImage: photo, unavailableSources: [photo.src, illustrated.src], locale: 'en' })
  assert.equal(fallback.type, 'icon'); assert.equal(fallback.src, null); assert.match(fallback.alt, /symbol.*not a photo/)
  assert.match(serviceThumbnail(service, { locale: 'en' }).alt, /Illustration.*not a photo/)
  assert.match(serviceThumbnail(service, { locale: 'unsupported' }).alt, /Илюстрация/)
})

test('component reserves space, lazy-loads local art, handles errors and names icon fallbacks accessibly without network requests', async () => {
  const source = await read('components/service-thumbnail.js')
  assert.match(source, /^'use client'/); assert.match(source, /useState\(\[\]\)/)
  assert.match(source, /loading="lazy" decoding="async"/); assert.match(source, /alt=\{thumbnail\.alt\}/)
  assert.match(source, /width=\{displaySize\} height=\{displaySize\}/); assert.match(source, /srcSet=\{thumbnail\.srcSet/)
  assert.match(source, /onError=\{\(\) => setUnavailableSources/)
  assert.match(source, /role="img" aria-label=\{thumbnail\.alt\}/); assert.match(source, /<Icon name=\{thumbnail\.icon\}/)
  assert.match(source, /data-service-kind=\{thumbnail\.kind\}/); assert.match(source, /data-thumbnail-kind=\{thumbnail\.type\}/)
  assert.doesNotMatch(source, /fetch\(|supabase|https?:|dangerouslySetInnerHTML|<button|<a\b/)
})
