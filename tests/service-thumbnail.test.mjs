import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { serviceArtKind, serviceThumbnail } from '../lib/service-thumbnail.mjs'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const business = { id: 'business-1', industry: 'beauty' }, service = { id: 'service-1', name: 'Маникюр', category: 'nails' }
const photo = { src: '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194', businessId: business.id, serviceId: service.id,
  businessProvided: true, rightsCleared: true, alt: { bg: 'Маникюр от студиото', en: 'Manicure by the studio' } }

test('manicure and pedicure never share the manicure illustration, even in a nail business', () => {
  const manicure = serviceThumbnail(service, { business }), pedicure = serviceThumbnail({ name: 'Педикюр с гел лак', category: 'nails' }, { business })
  assert.equal(manicure.kind, 'manicure'); assert.equal(manicure.src, '/category-art/nails-sm-v1.webp')
  assert.equal(pedicure.kind, 'pedicure'); assert.equal(pedicure.src, null); assert.notEqual(manicure.icon, pedicure.icon)
  for (const name of ['Medical pedicure', 'Терапевтичен педикюр', 'Manicure + Pedicure', 'Маникюр и педикюр', 'Сваляне на гел лак', 'Ноктопластика']) {
    assert.notEqual(serviceThumbnail({ name, category: 'nails' }, { business }).src, manicure.src)
  }
})

test('object illustrations follow the exact service, not the business name or broad category', async () => {
  const examples = [['Дамско подстригване', 'hair'], ['Оформяне на брада', 'barber'], ['Индивидуален тенис', 'sports'], ['Цялостен груминг на куче', 'pets'],
    ['Външно измиване', 'carwash', 'car_wash'], ['Смяна на масло', 'repair', 'auto_repair']]
  for (const [name, asset, category] of examples) {
    const result = serviceThumbnail({ name, category })
    assert.equal(result.src, `/category-art/${asset}-sm-v1.webp`, name)
    assert.equal(result.type, 'illustration'); assert.match(result.srcSet, /128w, .*256w/)
    assert.ok((await stat(new URL(`../public${result.src}`, import.meta.url))).size < 35000)
  }
  for (const [name, category] of [['Йога', 'fitness'], ['Пилатес реформър', 'fitness'], ['Лазерна епилация', 'beauty'], ['Боядисване на коса', 'hair'], ['Дентален преглед', 'health'],
    ['Масаж', 'health'], ['Терапия на тенис лакът', 'health'], ['Table tennis lesson', 'fitness'], ['Тенис на маса', 'fitness'], ['Курс по пиано', 'education'], ['Счетоводна консултация', 'consulting'],
    ['Почистване на дом', 'home_services'], ['Carpet repair', 'home_services'], ['Полиране на автомобил', 'detailing'], ['Бръснене', 'barber']]) {
    assert.equal(serviceThumbnail({ name, category }, { business: { name: 'Nails Hair Tennis Garage', industry: category } }).type, 'icon', name)
  }
})

test('animal coat/nail care cannot become human haircut/manicure art and vague services stay neutral', () => {
  for (const name of ['Подстригване', 'Подрязване на нокти', 'Маникюр', 'Груминг за котка']) {
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
