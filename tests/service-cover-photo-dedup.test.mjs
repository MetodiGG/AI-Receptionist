import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { photoAssetIdentity, samePhotoAsset } from '../lib/photo-asset-identity.mjs'
import { businessCoverPhoto } from '../lib/business-cover-photo.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { businessDetailServices } from '../lib/discovery/business-details.mjs'
import publicYogaRecords from '../lib/discovery/catalogue-data/neighborhood-auto-sport-more-20261113.mjs'
import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'

const readJson = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))
const yogaPhoto = '/service-photos/one-to-one-yoga-v1.webp'
const yogaCover = '/business-cover-photos/activity-one-to-one-yoga-v1.webp'
const provided = '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194'

test('only recorded service/cover derivatives share image identity, not their subject or category', async () => {
  const legacy = await readJson('docs/business-cover-photo-sources.json')
  const activities = await readJson('docs/business-activity-cover-sources-2026-11-15.json')
  for (const cover of legacy.covers) assert.ok(samePhotoAsset(cover.file.replace(/^public/u, ''), cover.servicePhoto.replace(/^public/u, '')), cover.file)
  for (const cover of activities.assets) assert.ok(samePhotoAsset(cover.file.replace(/^public/u, ''), cover.approvedServicePhoto.replace(/^public/u, '')), cover.file)
  assert.ok(samePhotoAsset(yogaCover, yogaPhoto))
  assert.ok(samePhotoAsset('/business-cover-photos/barber-v1.webp', '/service-photos/mens-haircut-v1.webp'))
  assert.equal(samePhotoAsset(yogaCover, '/service-photos/yoga-v1.webp'), false, 'different yoga scenes remain distinct')
  assert.equal(samePhotoAsset(yogaPhoto, '/business-cover-photos/fitness-v1.webp'), false, 'a category is not a photo identity')
  assert.equal(samePhotoAsset('/category-photos/fitness-v2.webp', '/category-photos/fitness-v2.webp'), false)
  assert.equal(samePhotoAsset('/subcategory-photos/hair-children-v1.webp', '/service-photos/kids-haircut-v1.webp'), false, 'dedicated navigation art is not service art')
  assert.equal(samePhotoAsset('/business-cover-photos/activity-unknown-future-v1.webp', '/service-photos/unknown-future-v1.webp'), false)
})

test('safe same-site references and the known Next image wrapper preserve exact provided image identity', () => {
  for (const path of [provided, '/api/catalogue-media/450c5c2f-db41-476b-a21e-98cf5ee29194', '/businesses/studio/approved-photo.webp', '/catalogue-media/approved-photo.webp']) {
    assert.ok(samePhotoAsset(path, { src: path }))
    assert.ok(samePhotoAsset(path, `https://www.gorez.co${path}`))
    assert.ok(samePhotoAsset(path, `https://gorez.co${path}`))
    assert.ok(samePhotoAsset(path, `/_next/image?url=${encodeURIComponent(path)}&w=640&q=75`))
    assert.ok(samePhotoAsset(path, `https://www.gorez.co/_next/image?q=75&w=640&url=${encodeURIComponent(path)}`))
  }
  assert.equal(samePhotoAsset(provided, '/api/catalogue-media/450c5c2f-db41-476b-a21e-98cf5ee29194'), false, 'media namespaces never alias')
  assert.equal(samePhotoAsset(provided, '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29195'), false, 'different uploaded photos never alias')
})

test('unknown, external, malformed, transformed and revision-bearing references cannot suppress a photo', () => {
  const bad = [null, undefined, {}, 12, '', ' ' + yogaPhoto, yogaPhoto + ' ', '//www.gorez.co' + yogaPhoto,
    'https://example.com' + yogaPhoto, 'https://www.gorez.co.example.com' + yogaPhoto,
    'https://gorez.co@evil.test' + yogaPhoto, 'https://user@gorez.co' + yogaPhoto,
    'http://www.gorez.co' + yogaPhoto, 'https://www.gorez.co:8443' + yogaPhoto,
    yogaPhoto + '?v=2', yogaPhoto + '#different', '/service-photos/../service-photos/one-to-one-yoga-v1.webp',
    '/service-photos/%2e%2e/service-photos/one-to-one-yoga-v1.webp', '/service-photos\\one-to-one-yoga-v1.webp',
    '/private/photo.webp', '/businesses/studio/photo.webp?url=https://example.com',
    'data:image/webp;base64,a', 'blob:https://www.gorez.co/photo', 'javascript:alert(1)',
    '/_next/image?url=' + encodeURIComponent(yogaPhoto) + '&w=640&q=75&url=' + encodeURIComponent(yogaPhoto),
    '/_next/image?url=' + encodeURIComponent(yogaPhoto) + '&w=640&q=75&crop=other',
    '/_next/image?url=' + encodeURIComponent(yogaPhoto) + '&w=640&q=0',
    '/_next/image?url=' + encodeURIComponent('https://example.com' + yogaPhoto) + '&w=640&q=75',
    '/_next/image?url=' + encodeURIComponent('/_next/image?url=' + encodeURIComponent(yogaPhoto) + '&w=640&q=75') + '&w=640&q=75',
  ]
  for (const value of bad) {
    assert.equal(photoAssetIdentity(value), null, String(value))
    assert.equal(samePhotoAsset(value, value), false, 'unknown is not evidence of equality: ' + String(value))
    assert.equal(samePhotoAsset(yogaPhoto, value), false, String(value))
  }
  assert.equal(samePhotoAsset(yogaPhoto, { src: provided, activityPhotoKey: 'one-to-one-yoga' }), false, 'metadata cannot override the actual shown source')
})

test('the actual Alyoga catalogue record resolves one approved source in two sizes and keeps all service text', async () => {
  const raw = publicYogaRecords.records.find(row => row.id === 'sofia-alyoga-benkovski')
  const [business] = normalizeCatalogueBusinesses([raw], { category: 'fitness', cityCode: '68134', browse: true }, { now: Date.parse('2026-11-26T12:00:00Z') })
  const services = businessDetailServices(business), cover = businessCoverPhoto(business)
  assert.equal(services.length, 1)
  assert.equal(services[0].name, 'Индивидуална йога практика — 60 минути')
  assert.equal(cover.src, yogaCover)
  assert.equal(serviceThumbnail(services[0], { business }).src, yogaPhoto)
  const { PublicServiceMenu } = await loadPublicServiceMenu()
  const render = shownBusinessPhoto => renderToStaticMarkup(React.createElement(PublicServiceMenu, { services, business, shownBusinessPhoto }))
  const duplicate = render(cover)
  assert.doesNotMatch(duplicate, /<img|data-service-gallery-photo|data-service-gallery-ai/u)
  assert.match(duplicate, /Индивидуална йога практика — 60 минути/u)
  assert.match(duplicate, /35,79/u)
  assert.match(duplicate, /data-service-more/u, 'description and its disclosure remain intact')
  for (const shown of [null, { src: provided }, { src: '/service-photos/reformer-pilates-v1.webp' }, { src: '' }]) {
    assert.match(render(shown), /data-service-gallery-photo="illustration"/u, 'missing or different displayed source restores the service image')
  }
})

// Execute the real component, not a surrogate image matcher. React SSR gives
// the same initial props behavior without touching browser or network APIs.
const runtimeRequire = createRequire(new URL('../components/service-thumbnail.js', import.meta.url))
async function actualThumbnail() {
  const { loadBindings, transform } = runtimeRequire('next/dist/build/swc')
  await loadBindings()
  const { code } = await transform(await readFile(new URL('../components/service-thumbnail.js', import.meta.url), 'utf8'), {
    filename: 'components/service-thumbnail.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(runtimeRequire, module, module.exports)
  return module.exports.ServiceThumbnail
}

test('dedup is gallery-only and applies to exact trusted provided photos without adding misleading AI labels', async () => {
  const ServiceThumbnail = await actualThumbnail()
  const business = { id: '450c5c2f-db41-476b-a21e-98cf5ee29194', category: 'nails', illustrativeCoverPhotoKey: 'classic-manicure' }
  const service = { id: '600c5c2f-db41-476b-a21e-98cf5ee29194', name: 'Маникюр' }
  const trustedServiceImage = { src: provided, businessId: business.id, serviceId: service.id, rightsCleared: true, businessProvided: true }
  const render = props => renderToStaticMarkup(React.createElement(ServiceThumbnail, { service, business, trustedServiceImage, ...props }))
  assert.equal(render({ gallery: true, shownBusinessPhoto: { src: provided } }), '')
  assert.match(render({ gallery: false, shownBusinessPhoto: { src: provided } }), /<img/u, 'homepage/compact thumbnails are untouched')
  const real = render({ gallery: true, shownBusinessPhoto: { src: '/business-cover-photos/nails-v1.webp' } })
  assert.match(real, /data-service-gallery-photo="provided"/u)
  assert.doesNotMatch(real, /data-service-gallery-ai|AI илюстрация/u)
  assert.match(render({ gallery: true, shownBusinessPhoto: null }), /<img/u)
  assert.match(render({ gallery: true, shownBusinessPhoto: { src: '/businesses/studio/other.webp' } }), /<img/u)
})
