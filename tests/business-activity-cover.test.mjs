import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
import { businessActivityPhotoKey, businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { BUSINESS_ACTIVITY_COVER_ASSETS } from '../lib/business-activity-cover-assets.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { quarterRefreshPriorCatalogue } from './catalogue-quarter-refresh-20261123-scope.mjs'

const service = (name, category, illustrativePhotoKey) => ({ name, category, ...(illustrativePhotoKey ? { illustrativePhotoKey } : {}) })
const hash = value => createHash('sha256').update(value).digest('hex')
const revalidatedIds = new Set(['sofia-svetlinki-sheynovo13a', 'sofia-artizba-cherni-vrah33e'])
const oldEducationText = execFileSync('git', ['show', 'b8dcdf4:lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
const oldEducation = (await import('data:text/javascript;base64,' + Buffer.from(oldEducationText).toString('base64'))).default.records
const historicalCatalogue = quarterRefreshPriorCatalogue(SOFIA_CATALOGUE).map(row => revalidatedIds.has(row.id)
  ? { ...oldEducation.find(item => item.id === row.id), coordinates: row.coordinates } : row)

test('all fourteen business categories resolve real published activities rather than the generic broad cover', () => {
  const cases = [
    ['hair', service('Дамско подстригване', 'hair'), 'womens-haircut'],
    ['nails', service('Класически педикюр', 'nails'), 'classic-pedicure'],
    ['beauty', service('Лазерна епилация', 'beauty'), 'laser-hair-removal'],
    ['barber', service('Оформяне на брада', 'barber'), 'beard-trim'],
    ['auto_repair', service('Компютърна диагностика', 'auto_repair'), 'auto-diagnostics'],
    ['car_wash', service('Безконтактно външно измиване', 'car_wash'), 'touchless-car-wash'],
    ['detailing', service('Машинно полиране', 'detailing'), 'machine-car-polishing'],
    ['fitness', service('Народни танци', 'fitness', 'sx-bulgarian-folk-group'), 'sx-bulgarian-folk-group'],
    ['education', service('Индивидуален урок по пиано', 'education'), 'piano-lesson'],
    ['pets', service('Груминг на котка', 'pets'), 'cat-grooming'],
    ['home_services', service('Пране на диван', 'home_services'), 'sofa-cleaning'],
    ['health', service('Индивидуална кинезитерапия', 'health'), 'physiotherapy'],
    ['consulting', service('Счетоводна консултация', 'consulting'), 'accounting-consultation'],
    ['other', service('Професионална фотосесия', 'other'), 'photography-session'],
  ]
  assert.equal(new Set(cases.map(([category]) => category)).size, 14)
  for (const [category, offered, expected] of cases) {
    const business = { category, services: [offered] }
    assert.equal(businessActivityPhotoKey(business), expected, category)
    assert.equal(businessCoverPhoto(business).activityPhotoKey, expected, category)
  }
})

test('folk dance, yoga, mat pilates and reformer do not receive a boxing cover or the wrong pilates equipment', () => {
  for (const [offered, expected] of [
    [service('Народни танци', 'fitness', 'sx-bulgarian-folk-group'), 'sx-bulgarian-folk-group'],
    [service('Йога', 'fitness'), 'yoga-class'],
    [service('Пилатес на постелка', 'fitness', 'sx-mat-pilates-group'), 'sx-mat-pilates-group'],
    [service('Индивидуален пилатес реформър', 'fitness'), 'reformer-pilates'],
  ]) {
    const cover = businessCoverPhoto({ category: 'fitness', services: [offered] })
    assert.equal(cover.activityPhotoKey, expected)
    assert.doesNotMatch(cover.src, /fitness-v1|kickboxing|boxing-v1/)
  }
})

test('future native folk-dance registrations work without catalogue-specific image keys', () => {
  assert.equal(businessActivityPhotoKey({ industry: 'fitness', services: [service('Народни танци', 'fitness')] }), 'sx-bulgarian-folk-group')
  assert.equal(businessActivityPhotoKey({ category: 'fitness', services: [service('Индивидуален урок по народни танци', 'fitness')] }), 'sx-bulgarian-folk-private-lesson')
  assert.equal(businessActivityPhotoKey({ category: 'fitness', services: [service('Детска група по народни танци', 'fitness')] }), 'sx-child-bulgarian-folk-group')
  assert.notEqual(businessActivityPhotoKey({ category: 'fitness', services: [service('Индивидуален урок по народни танци за деца', 'fitness')] }), 'sx-bulgarian-folk-group')
  for (const [name, key] of [
    ['Народни танци за деца', 'sx-child-bulgarian-folk-group'],
    ['Урок по хоро', 'sx-bulgarian-folk-group'],
    ['Айкидо за начинаещи', 'martial-arts-aikido'],
    ['Групова тренировка по джудо', 'sx-judo-adult-group'],
    ['Групова тренировка по джудо за деца', 'sx-judo-child-group'],
    ['Индивидуален урок по джудо', 'sx-judo-private'],
  ]) assert.equal(businessActivityPhotoKey({ category: 'fitness', services: [service(name, 'fitness')] }), key, name)
  assert.equal(businessCoverPhoto({ category: 'fitness', services: [service('Индивидуален урок по народни танци за деца', 'fitness')] }).src, null)
})

test('unmapped future services get truthful missing-artwork feedback, never unrelated broad-category artwork', () => {
  for (const category of ['fitness', 'hair', 'education', 'other']) {
    const cover = businessCoverPhoto({ category, services: [service('Неуточнена специална услуга', category)] })
    assert.equal(cover.src, null)
    assert.equal(cover.category, category)
  }
  assert.equal(businessCoverPhoto({ category: 'fitness', services: [service('Айкидо за деца', 'fitness')] }).src, null)
})

test('full inventory ordering and a server-derived allowlisted key survive matching-service compaction', () => {
  const offered = [service('Народни танци', 'fitness', 'sx-bulgarian-folk-group'), service('Йога', 'fitness')]
  const full = { businessCategory: 'fitness', publicServiceNames: offered.map(row => row.name), details: { services: offered }, services: [offered[1]] }
  assert.equal(businessActivityPhotoKey(full), 'sx-bulgarian-folk-group')
  const compact = { businessCategory: 'fitness', category: 'beauty', illustrativeCoverPhotoKey: 'sx-bulgarian-folk-group', services: [offered[1]] }
  assert.equal(businessCoverPhoto(compact).activityPhotoKey, 'sx-bulgarian-folk-group')
  assert.equal(businessCoverPhoto(compact).category, 'fitness')
  for (const invalid of ['constructor', '__proto__', 'https://example.com/image.webp', '../../image', '', null]) {
    assert.equal(businessCoverPhoto({ ...compact, illustrativeCoverPhotoKey: invalid }).activityPhotoKey, 'yoga-class')
  }
})

test('legacy broad labels with only real cross-category services still show an actual activity', () => {
  const business = { category: 'beauty', services: [service('Дамско подстригване', 'hair')] }
  assert.equal(businessActivityPhotoKey(business), 'womens-haircut')
  assert.equal(businessActivityPhotoKey({ category: 'fitness', services: [service('Йога', 'fitness'), { ...service('Бокс', 'fitness'), active: false }] }), 'yoga-class')
})

test('a future approved precise photo without a large derivative keeps its honest native resolution', () => {
  const candidates = ['sx-child-bulgarian-folk-group', 'sx-folk-duo', 'sx-child-swimming-individual']
  const key = candidates.find(value => !Object.hasOwn(BUSINESS_ACTIVITY_COVER_ASSETS, value))
  assert.ok(key)
  const cover = businessCoverPhoto({ category: 'fitness', illustrativeCoverPhotoKey: key })
  assert.equal(cover.activityPhotoKey, key)
  assert.equal(cover.src, `/service-photos/${key}-v1.webp`)
  assert.equal(cover.size, 256)
  assert.doesNotMatch(cover.src, /fitness-v1|boxing/)
})

test('failed activity covers retry the same activity thumbnail, not an unrelated category or neutral image', () => {
  const business = { category: 'fitness', illustrativeCoverPhotoKey: 'sx-bulgarian-folk-group' }
  const first = businessCoverPhoto(business)
  assert.ok(first.src.startsWith('/business-cover-photos/activity-'))
  const second = businessCoverPhoto(business, { unavailableSources: [first.src] })
  assert.equal(second.src, '/service-photos/sx-bulgarian-folk-group-v1.webp')
  assert.equal(second.size, 256)
  const last = businessCoverPhoto(business, { unavailableSources: [first.src, second.src] })
  assert.equal(last.src, null)
  assert.equal(last.activityPhotoKey, first.activityPhotoKey)
})

test('new activity cover derivatives are hash-bound to the existing approved source, full-size and compressed', async () => {
  const manifest = JSON.parse(await readFile(new URL('../docs/business-activity-cover-sources-2026-11-15.json', import.meta.url), 'utf8'))
  assert.ok(manifest.assets.length > 100)
  assert.equal(manifest.unresolved.length, 0)
  assert.equal(Object.keys(BUSINESS_ACTIVITY_COVER_ASSETS).length, manifest.assets.length)
  let bytes = 0
  for (const asset of manifest.assets) {
    assert.match(asset.sourceFile, /^exec-[a-f0-9-]+\.png$/)
    assert.match(asset.sourceSha256, /^[a-f0-9]{64}$/)
    assert.ok(Math.min(asset.originalWidth, asset.originalHeight) >= 720)
    assert.equal(asset.sourceCrop.width, Math.min(asset.originalWidth, asset.originalHeight))
    assert.equal(asset.sourceCrop.height, asset.sourceCrop.width)
    assert.ok(asset.sourceCrop.width >= 720)
    assert.equal(BUSINESS_ACTIVITY_COVER_ASSETS[asset.id], 720)
    assert.equal(asset.file, `public/business-cover-photos/activity-${asset.id}-v1.webp`)
    const image = await readFile(new URL(`../${asset.file}`, import.meta.url))
    assert.equal(hash(image), asset.sha256)
    assert.equal(image.length, asset.bytes)
    const meta = await sharp(image).metadata()
    assert.deepEqual([meta.width, meta.height, meta.format, meta.exif, meta.xmp], [720, 720, 'webp', undefined, undefined])
    assert.ok(image.length < 150000)
    const small = await readFile(new URL(`../${asset.approvedServicePhoto}`, import.meta.url))
    assert.equal(hash(small), asset.approvedServicePhotoSha256)
    if (asset.sourceRecovery) {
      assert.ok(asset.sourceRecovery.mse <= 16)
      assert.ok(asset.sourceRecovery.secondMse >= Math.max(asset.sourceRecovery.mse * 8, asset.sourceRecovery.mse + 25))
      assert.equal(asset.sourceRecovery.review.status, 'accepted')
      assert.equal(asset.sourceRecovery.review.sourceSha256, asset.sourceSha256)
      assert.ok(asset.sourceRecovery.review.reviewers.includes('/root'))
    }
    bytes += image.length
  }
  assert.equal(bytes, manifest.totalNewBytes)
})

test('every approved November 15 catalogue business retains its large activity cover after later source revalidation', () => {
  let checked = 0
  const historicalNow = Date.parse('2026-11-15T00:00:00Z')
  // Preserve this original generated-cover cohort rather than fold future
  // reviews or later intakes into a historical source/derivative audit.
  for (const raw of historicalCatalogue) {
    const business = approvedCatalogueRecord(raw, historicalNow)
    if (!business) continue
    const details = catalogueDetailsWithServicePhotos(business, historicalNow)
    const key = businessActivityPhotoKey({ ...business, details })
    assert.ok(key, business.id)
    const cover = businessCoverPhoto({ category: business.category, illustrativeCoverPhotoKey: key })
    assert.equal(cover.activityPhotoKey, key, business.id)
    assert.ok(cover.src.startsWith('/business-cover-photos/'), business.id)
    checked++
  }
  assert.ok(checked >= 1693)
})

test('both genuinely revalidated November 22 businesses keep their approved large activity covers', () => {
  const currentNow = Date.parse('2026-11-22T12:00:00Z')
  for (const raw of SOFIA_CATALOGUE.filter(row => revalidatedIds.has(row.id))) {
    const business = approvedCatalogueRecord(raw, currentNow)
    assert.ok(business, raw.id)
    const details = catalogueDetailsWithServicePhotos(business, currentNow)
    const key = businessActivityPhotoKey({ ...business, details })
    assert.ok(key, raw.id)
    const cover = businessCoverPhoto({ category: business.category, illustrativeCoverPhotoKey: key })
    assert.equal(cover.activityPhotoKey, key)
    assert.ok(cover.src.startsWith('/business-cover-photos/'), raw.id)
  }
})

test('cover component preserves illustration disclosure, lazy loading and localized missing-photo feedback', async () => {
  const source = await readFile(new URL('../components/business-cover-photo.js', import.meta.url), 'utf8')
  assert.match(source, /^'use client'/)
  assert.match(source, /data-activity-cover/)
  assert.match(source, /AI illustration.*AI илюстрация/)
  assert.match(source, /loading=\{eager \? 'eager' : 'lazy'\}/)
  assert.match(source, /onError=\{event => \{ if \(event.currentTarget !== imageRef.current\) return; onDisplayedPhoto\?\.\(null\); remember\(src\)/)
  assert.match(source, /naturalWidth > 0\) onDisplayedPhoto\(src\)/)
  assert.match(source, /image\.naturalWidth === 0/)
  assert.match(source, /Photo unavailable.*Снимката не е налична/)
  assert.doesNotMatch(source, /fetch\(|iframe|<Icon|emoji|neutralService/)
})
