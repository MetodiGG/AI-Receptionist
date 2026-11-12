import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { serviceArtKind, serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'
import { GENERATED_CATALOGUE_SERVICE_PHOTO_IDS } from '../lib/service-photos-catalogue-expansion.mjs'
import { createHash } from 'node:crypto'
import { NEUTRAL_SERVICE_PHOTO_SRC, INLINE_NEUTRAL_SERVICE_PHOTO_SRC } from '../lib/service-photo-fallback.mjs'

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

test('unpictured services use a neutral photo, never category objects or an unrelated business-name image', async () => {
  const examples = [['Подстригване'], ['Ремонт на тенис ракета', 'fitness'], ['Груминг на куче и котка', 'pets']]
  for (const [name, category] of examples) {
    const result = serviceThumbnail({ name, category })
    assert.equal(result.src, NEUTRAL_SERVICE_PHOTO_SRC, name)
    assert.equal(result.type, 'photo'); assert.equal(result.photoMatch, 'neutral'); assert.equal(result.srcSet, null)
    assert.ok((await stat(new URL(`../public${result.src}`, import.meta.url))).size < 35000)
  }
  assert.equal(serviceThumbnail({ name: 'Външно измиване', category: 'car_wash' }).src, '/service-photos/car-exterior-hand-wash-v1.webp')
  for (const [name, category] of [['IPL фотоепилация на лице', 'beauty'], ['Операция на стъпалото', 'health'],
    ['Терапия на тенис лакът', 'health'], ['Ремонт на маса за тенис на маса', 'fitness'],
    ['Carpet repair', 'home_services'], ['Бръснене на лице с кърпа', 'barber']]) {
    const result = serviceThumbnail({ name, category }, { business: { name: 'Nails Hair Tennis Garage', industry: category } })
    assert.equal(result.photoMatch, 'neutral', name); assert.equal(result.src, NEUTRAL_SERVICE_PHOTO_SRC, name)
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
    const failed = serviceThumbnail({ name, category }, { unavailableSources: [result.src] })
    assert.equal(failed.type, 'photo'); assert.notEqual(failed.src, result.src)
  }
  for (const [name, category] of [
    ['Маникюр и педикюр с гел лак', 'nails'], ['Педикюр за врастнал нокът', 'nails'], ['Сваляне на гел лак и маникюр', 'nails'],
    ['Мъжко подстригване и оформяне на вежди', 'hair'], ['Бръснене на глава + боядисване на брада', 'barber'], ['Смяна на трансмисионно масло', 'auto_repair'],
    ['Машинно полиране на джанти', 'detailing'], ['Пробен урок по пиано или флейта', 'education'], ['Лабораторно изследване NIFTY Pro', 'other'],
    ['Къпане и подстригване на куче', 'pets'], ['Педикюр с гел лак за куче', 'pets'],
  ]) {
    const result = serviceThumbnail({ name, category })
    assert.equal(result.type, 'photo', name)
    assert.equal(result.photoMatch, 'neutral', `${name}: do not borrow a photo of one half, another technique, species or body area`)
  }
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

test('every registered precise or generated activity photo has a light local file and exactly one provenance entry', async () => {
  const docs = await Promise.all(['docs/service-photo-prompts-2026-11-11.json', 'docs/service-photo-prompts-16-45.json',
    'docs/service-photo-prompts-46-94.json', 'docs/service-photo-prompts-brow-threading.json',
    'docs/service-photo-prompts-95-146.json'].map(path => read(path)))
  const generated = JSON.parse(await read('docs/service-photo-generation-2026-11-12.json'))
  assert.match(generated.generator, /image_gen/)
  const registeredIds = new Set([...APPROVED_SERVICE_PHOTO_IDS, ...GENERATED_CATALOGUE_SERVICE_PHOTO_IDS])
  const provenance = [...docs.flatMap(doc => JSON.parse(doc).assets), ...generated.images]
  for (const id of registeredIds) {
    const path = `public/service-photos/${id}-v1.webp`
    const matches = provenance.filter(asset => asset.file === path)
    assert.equal(matches.length, 1, `${id}: exactly one recorded source, not a fabricated approval or business photo`)
    const bytes = await readFile(new URL(`../${path}`, import.meta.url))
    assert.ok(bytes.length > 0 && bytes.length < 256 * 1024, path)
    if (matches[0].sha256) assert.equal(createHash('sha256').update(bytes).digest('hex'), matches[0].sha256, path)
  }
  assert.equal(generated.images.filter(asset => asset.file === `public${NEUTRAL_SERVICE_PHOTO_SRC}`).length, 1, 'neutral workspace has its own provenance, not an exact-service approval')
  const derived = (generated.derivedAssets || []).filter(asset => asset.file === 'public/service-photos/appointment-workspace-inline-v1.webp')
  assert.equal(derived.length, 1); assert.equal(derived[0].derivedFrom, 'appointment-workspace', 'inline image is a derivative, not a separate generation')
})

test('animal coat/nail care cannot become human haircut/manicure art and vague services stay neutral', () => {
  for (const name of ['Подстригване', 'Подрязване на нокти', 'Маникюр', 'Бръснене на котка']) {
    const result = serviceThumbnail({ name }, { business: { industry: 'pets' } })
    assert.equal(result.kind, 'pet-care'); assert.equal(result.icon, 'paw'); assert.equal(result.src, NEUTRAL_SERVICE_PHOTO_SRC)
    assert.equal(result.photoMatch, 'neutral')
  }
  assert.equal(serviceArtKind({ name: 'Подстригване на куче' }), 'dog-grooming')
  assert.equal(serviceArtKind({ name: 'Ремонт на нокът', category: 'nails' }), 'other')
  assert.equal(serviceArtKind({ name: 'Измиване на коса', category: 'hair' }), 'other')
  assert.equal(serviceArtKind({ name: 'Catering consultation', category: 'consulting' }), 'consulting')
  for (const value of [undefined, null, {}, { name: '__proto__', category: 'constructor' }, { name: 'Час', category: '__proto__' }]) {
    const result = serviceThumbnail(value)
    assert.equal(result.type, 'photo'); assert.equal(result.src, NEUTRAL_SERVICE_PHOTO_SRC); assert.equal(result.icon, 'calendarSearch')
    assert.equal(result.photoMatch, 'neutral')
  }
})

test('only an explicit rights-checked business-provided photo for this exact business and service takes precedence', () => {
  const result = serviceThumbnail(service, { business, trustedServiceImage: photo, locale: 'en' })
  assert.equal(result.type, 'photo'); assert.equal(result.src, photo.src); assert.equal(result.alt, photo.alt.en)
  assert.equal(serviceThumbnail(service, { business, trustedServiceImage: photo }).alt, photo.alt.bg)
  for (const changed of [{ businessId: 'another-business' }, { serviceId: 'another-service' }, { businessProvided: false }, { rightsCleared: false }, { rightsCleared: undefined }]) {
    const fallback = serviceThumbnail(service, { business, trustedServiceImage: { ...photo, ...changed } })
    assert.equal(fallback.type, 'photo'); assert.notEqual(fallback.src, photo.src); assert.equal(fallback.source, 'illustrative')
  }
  assert.notEqual(serviceThumbnail({ ...service, id: undefined }, { business, trustedServiceImage: photo }).src, photo.src)
  assert.notEqual(serviceThumbnail({ ...service, photo, image: photo }, { business: { ...business, photos: [photo] } }).src, photo.src)
})

test('remote, malformed and arbitrary first-party URLs cannot be service photos', () => {
  for (const src of ['https://example.com/manicure.jpg', '//example.com/manicure.jpg', 'data:image/png;base64,a', 'javascript:alert(1)', '/category-photos/nails-v2.webp',
    '/category-art/nails-v1.webp', '/api/business-media/not-a-uuid', '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194?url=https://example.com',
    '/businesses/../private.webp', '/businesses/studio/%2e%2e.webp', '/businesses/studio/image.webp#fragment', '/businesses/studio/image.webp?x=1']) {
    const fallback = serviceThumbnail(service, { business, trustedServiceImage: { ...photo, src } })
    assert.equal(fallback.type, 'photo', src); assert.notEqual(fallback.src, src, 'invalid supplied URLs are not used'); assert.equal(fallback.source, 'illustrative')
  }
  const curated = serviceThumbnail(service, { business, trustedServiceImage: { ...photo, src: '/businesses/studio/manicure-approved.webp', alt: {} } })
  assert.equal(curated.type, 'photo'); assert.match(curated.alt, /Снимка от бизнеса/)
})

test('failed photos fall through to honest neutral static and terminal inline photos in either locale', () => {
  const unknown = { ...service, name: 'Неуточнена услуга за записване' }
  const neutral = serviceThumbnail(unknown, { business, trustedServiceImage: photo, unavailableSources: [photo.src] })
  assert.equal(neutral.type, 'photo'); assert.equal(neutral.photoMatch, 'neutral'); assert.match(neutral.alt, /Неутрална.*не изобразява услугата/)
  const fallback = serviceThumbnail(unknown, { business, trustedServiceImage: photo, unavailableSources: [photo.src, neutral.src], locale: 'en' })
  assert.equal(fallback.type, 'photo'); assert.equal(fallback.src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC); assert.match(fallback.alt, /Neutral.*not a depiction/)
  assert.match(serviceThumbnail(unknown, { locale: 'en' }).alt, /Neutral.*not a depiction/)
  assert.match(serviceThumbnail(unknown, { locale: 'unsupported' }).alt, /Неутрална/)
})

test('component reserves space, lazy-loads photos and stops its error chain at the inline fallback', async () => {
  const source = await read('components/service-thumbnail.js')
  assert.match(source, /^'use client'/); assert.match(source, /useState\(\[\]\)/)
  assert.match(source, /loading="lazy" decoding="async"/); assert.match(source, /alt=\{thumbnail\.alt\}/)
  assert.match(source, /width=\{displaySize\} height=\{displaySize\}/); assert.match(source, /srcSet=\{thumbnail\.srcSet/)
  assert.match(source, /onError=\{thumbnail\.src\.startsWith\('data:image\/webp;base64,'\) \? undefined : \(\) => setUnavailableSources/)
  assert.doesNotMatch(source, /import.*Icon|<Icon|service-thumbnail-icon/)
  assert.match(source, /data-service-kind=\{thumbnail\.kind\}/); assert.match(source, /data-thumbnail-kind=\{thumbnail\.type\}/)
  assert.doesNotMatch(source, /fetch\(|supabase|https?:|dangerouslySetInnerHTML|<button|<a\b/)
})
