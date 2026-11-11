import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import { BUSINESS_COVER_PHOTOS, BUSINESS_SPECIALTY_COVERS, businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { APPROVED_SERVICE_PHOTO_IDS } from '../lib/service-photos.mjs'

test('all categories use their own lightweight versioned cover derived from an approved service photo', async () => {
  assert.deepEqual(Object.keys(BUSINESS_COVER_PHOTOS).sort(), [...CATEGORY_IDS].sort())
  const manifest = JSON.parse(await readFile(new URL('../docs/business-cover-photo-sources.json', import.meta.url), 'utf8'))
  const assets = { ...BUSINESS_COVER_PHOTOS, ...BUSINESS_SPECIALTY_COVERS }
  assert.equal(manifest.covers.length, Object.keys(assets).length)
  for (const [category, id] of Object.entries(assets)) {
    const cover = manifest.covers.find(row => row.category === category)
    assert.equal(cover.file, `public/business-cover-photos/${category}-v1.webp`)
    assert.equal(cover.servicePhoto, `public/service-photos/${id}-v1.webp`)
    assert.ok(APPROVED_SERVICE_PHOTO_IDS.includes(id), category)
    const path = new URL(`../${cover.file}`, import.meta.url)
    const { width, height, format, exif, xmp } = await sharp(await readFile(path)).metadata()
    assert.deepEqual([width, height, format, exif, xmp], [720, 720, 'webp', undefined, undefined])
    const { size } = await stat(path)
    assert.equal(size, cover.bytes)
    assert.ok(size < 110000)
    if (Object.hasOwn(BUSINESS_COVER_PHOTOS, category)) assert.equal(businessCoverPhoto({ category }).src, `/${cover.file.replace(/^public\//u, '')}`)
  }
})

test('new and existing businesses use the actual category, not the current search category', () => {
  assert.equal(businessCoverPhoto({ source: 'gorez', category: 'beauty', businessCategory: 'barber' }).category, 'barber')
  assert.equal(businessCoverPhoto({ industry: 'beauty', name: 'New Barber' }).category, 'barber')
  assert.equal(businessCoverPhoto({ industry: 'beauty', name: 'New Salon', services: [{ name: 'Педикюр' }] }).category, 'nails')
  assert.equal(businessCoverPhoto({ source: 'catalogue', category: 'detailing' }).category, 'detailing')
  assert.equal(businessCoverPhoto({ source: 'google', category: 'beauty', primaryType: 'barber_shop' }).category, 'barber')
  for (const category of [undefined, '', 'constructor', '__proto__', 'https://example.com']) {
    assert.equal(businessCoverPhoto({ category }).src, '/business-cover-photos/other-v1.webp')
  }
})

test('known specialties in Other services use recognizable covers; unknown types remain generic', () => {
  for (const [business, file] of [
    [{ category: 'other', name: 'Дентална клиника' }, '/business-cover-photos/dental-v1.webp'],
    [{ category: 'other', name: 'Д-р Ванина Атанасова · ортодонт' }, '/business-cover-photos/dental-v1.webp'],
    [{ category: 'other', name: 'Мария · психолог' }, '/business-cover-photos/consulting-v1.webp'],
    [{ category: 'other', name: 'Private psychiatrist' }, '/business-cover-photos/consulting-v1.webp'],
    [{ category: 'other', primaryType: 'psychologist', name: 'Private practice' }, '/business-cover-photos/consulting-v1.webp'],
    [{ category: 'other', name: 'Студио Надежда', services: [{ name: 'Психотерапевтична сесия' }] }, '/business-cover-photos/consulting-v1.webp'],
    [{ category: 'other', name: 'Ветеринарен кабинет' }, '/business-cover-photos/veterinary-v1.webp'],
    [{ category: 'other', name: 'Лаборатория' }, '/service-photos/lab-tests-v1.webp'],
    [{ category: 'other', name: 'Ново студио' }, '/business-cover-photos/other-v1.webp'],
  ]) assert.equal(businessCoverPhoto(business).src, file)
})
