import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import sharp from 'sharp'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { neutralServiceThumbnail, NEUTRAL_SERVICE_PHOTO_SRC, INLINE_NEUTRAL_SERVICE_PHOTO_SRC } from '../lib/service-photo-fallback.mjs'

test('neutral static and inline fallbacks are real compressed square photos with identical recorded inline bytes', async () => {
  const neutral = await readFile(new URL(`../public${NEUTRAL_SERVICE_PHOTO_SRC}`, import.meta.url))
  const inline = await readFile(new URL('../public/service-photos/appointment-workspace-inline-v1.webp', import.meta.url))
  assert.ok(neutral.length < 256 * 1024); assert.ok(inline.length < 8192)
  assert.ok(Buffer.from(INLINE_NEUTRAL_SERVICE_PHOTO_SRC.split(',')[1], 'base64').equals(inline))
  for (const bytes of [neutral, inline]) {
    const image = sharp(bytes, { failOn: 'error' }), metadata = await image.metadata()
    assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, metadata.height)
    assert.ok(metadata.width > 0 && metadata.width <= 1200)
    await image.raw().toBuffer()
  }
})

test('neutral descriptions explain that the pictured appointment workspace is not the service or business work', () => {
  const bg = neutralServiceThumbnail(), en = neutralServiceThumbnail({ locale: 'en' })
  assert.equal(bg.src, NEUTRAL_SERVICE_PHOTO_SRC)
  assert.equal(bg.type, 'photo'); assert.equal(bg.source, 'illustrative'); assert.equal(bg.photoMatch, 'neutral')
  assert.match(bg.alt, /Неутрална.*не изобразява услугата.*работа на бизнеса/u)
  assert.match(en.alt, /Neutral appointment photo, not a depiction of this service.*business's work/)
  assert.equal(neutralServiceThumbnail({ locale: 'other' }).alt, bg.alt)
  assert.equal(neutralServiceThumbnail({ unavailableSources: [NEUTRAL_SERVICE_PHOTO_SRC, INLINE_NEUTRAL_SERVICE_PHOTO_SRC] }).src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC, 'inline fallback does not retry a network source')
})

test('exact trusted business photo, precise approved photo, neutral photo and inline fallback form one safe failure chain', () => {
  const business = { id: 'local-studio', industry: 'beauty' }, service = { id: 'local-service', name: 'Маникюр', category: 'nails' }
  const trustedServiceImage = { businessId: business.id, serviceId: service.id, rightsCleared: true, businessProvided: true, src: '/businesses/local-studio/owner-service.webp' }
  const unavailableSources = [], seen = []
  for (let step = 0; step < 4; step++) {
    const image = serviceThumbnail(service, { business, trustedServiceImage, unavailableSources })
    assert.equal(image.type, 'photo'); assert.ok(image.src); assert.equal(image.srcSet, null)
    seen.push(image); unavailableSources.push(image.src)
  }
  assert.deepEqual(seen.map(image => image.src), [trustedServiceImage.src, '/service-photos/classic-manicure-v1.webp', NEUTRAL_SERVICE_PHOTO_SRC, INLINE_NEUTRAL_SERVICE_PHOTO_SRC])
  assert.deepEqual(seen.map(image => image.photoMatch), ['exact', 'exact', 'neutral', 'neutral'])
  assert.equal(serviceThumbnail(service, { business, trustedServiceImage, unavailableSources }).src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC)
})

test('supplemental matches are activity photos and cannot outrank existing precise matches', () => {
  const exact = serviceThumbnail({ name: 'Маникюр', category: 'nails' })
  assert.equal(exact.src, '/service-photos/classic-manicure-v1.webp'); assert.equal(exact.photoMatch, 'exact')
  const activity = serviceThumbnail({ name: 'Боядисване DIA · 1 боя', category: 'hair' })
  assert.equal(activity.src, '/service-photos/full-hair-color-v1.webp'); assert.equal(activity.photoMatch, 'activity')
  const neutral = serviceThumbnail({ name: 'Неописана бъдеща услуга', category: 'beauty' })
  assert.equal(neutral.src, NEUTRAL_SERVICE_PHOTO_SRC); assert.equal(neutral.photoMatch, 'neutral')
})

test('unknown, incomplete and mismatched activities never acquire category art, icons or arbitrary image URLs', () => {
  for (const [service, business] of [[null], [undefined], [{}], [{ name: '__proto__', category: 'constructor' }],
    [{ name: 'Операция на стъпалото', category: 'health' }], [{ name: 'Маникюр', category: 'pets' }, { industry: 'pets' }],
    [{ name: 'Груминг на куче и котка', category: 'pets' }]]) {
    const image = serviceThumbnail(service, { business })
    assert.equal(image.type, 'photo'); assert.equal(image.photoMatch, 'neutral'); assert.equal(image.src, NEUTRAL_SERVICE_PHOTO_SRC)
  }
  const service = { id: 'local-service', name: 'Неописана бъдеща услуга', category: 'other' }, business = { id: 'local-business' }
  for (const src of ['https://untrusted.invalid/a.webp', 'javascript:alert(1)', 'data:image/png;base64,AAAA', '/businesses/../a.webp']) {
    const image = serviceThumbnail(service, { business, trustedServiceImage: { serviceId: service.id, businessId: business.id, rightsCleared: true, businessProvided: true, src } })
    assert.equal(image.src, NEUTRAL_SERVICE_PHOTO_SRC)
  }
})

test('every current catalogue service resolves to a photo without changing any names, prices or catalogue facts', () => {
  const before = JSON.stringify(SOFIA_CATALOGUE)
  let checked = 0
  for (const business of SOFIA_CATALOGUE) for (const service of business.services) {
    const image = serviceThumbnail(service, { business })
    assert.equal(image.type, 'photo', `${business.id}: ${service.name}`)
    assert.match(image.src, /^\/service-photos\/[a-z0-9-]+-v1\.webp$/)
    assert.ok(['exact', 'activity', 'neutral'].includes(image.photoMatch))
    assert.equal(image.source, 'illustrative'); checked++
  }
  assert.ok(checked >= 8936); assert.equal(JSON.stringify(SOFIA_CATALOGUE), before)
})

async function componentHarness(initialProps = {}) {
  const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
  await loadBindings()
  const source = await readFile(new URL('../components/service-thumbnail.js', import.meta.url), 'utf8')
  const { code } = await transform(source, { filename: 'service-thumbnail.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  let unavailable = [], dependencies
  const ref = { current: null }, effects = []
  const hooks = { ...React,
    useState: () => [unavailable, next => { unavailable = typeof next === 'function' ? next(unavailable) : next }],
    useRef: () => ref,
    useEffect: (effect, next) => {
      if (!dependencies || next.some((value, index) => !Object.is(value, dependencies[index]))) effects.push(effect)
      dependencies = next
    },
  }
  const stubs = { react: hooks, '../lib/service-thumbnail.mjs': { serviceThumbnail } }, module = { exports: {} }
  new Function('require', 'module', 'exports', code)(key => Object.hasOwn(stubs, key) ? stubs[key] : require(key), module, module.exports)
  const props = { service: { name: 'Неописана бъдеща услуга' }, size: 64, locale: 'en', ...initialProps }
  return { source, module, props, render: () => module.exports.ServiceThumbnail(props),
    attach: node => { ref.current = node },
    flush: () => { while (effects.length) effects.shift()() },
    failures: () => unavailable,
  }
}

test('the actual compiled component renders only image elements and stops onError updates at the terminal inline photo', async () => {
  const h = await componentHarness()
  let wrapper = h.render(), image = wrapper.props.children
  assert.equal(image.type, 'img'); assert.equal(image.props.src, NEUTRAL_SERVICE_PHOTO_SRC)
  assert.equal(image.props.width, 64); assert.equal(image.props.height, 64)
  assert.equal(image.props.loading, 'lazy'); assert.equal(image.props.decoding, 'async')
  assert.equal(wrapper.props['data-photo-match'], 'neutral')
  const originalError = image.props.onError
  originalError(); const once = h.failures(); originalError()
  assert.equal(h.failures(), once, 'repeated stale load errors do not keep changing state')
  wrapper = h.render(); image = wrapper.props.children
  assert.equal(image.type, 'img'); assert.equal(image.props.src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC)
  assert.equal(image.props.onError, undefined, 'no error/re-render loop or network request from the inline fallback')
  assert.match(image.props.alt, /Neutral appointment photo/)
  assert.equal(typeof h.module.exports.IllustrativeServicePhotoNote, 'function', 'existing export remains compatible')
  assert.doesNotMatch(h.source, /<Icon|service-thumbnail-icon|fetch\(|dangerouslySetInnerHTML/)
})

test('hydration detects a cached 404 that failed before onError and advances through cached neutral failure to inline once', async () => {
  const business = { id: 'local-business', industry: 'other' }, service = { id: 'local-service', name: 'Неописана бъдеща услуга' }
  const trustedServiceImage = { businessId: business.id, serviceId: service.id, rightsCleared: true, businessProvided: true, src: '/businesses/local-business/cached-missing.webp' }
  const h = await componentHarness({ business, service, trustedServiceImage })
  let image = h.render().props.children
  assert.equal(image.props.src, trustedServiceImage.src)
  assert.equal(typeof image.props.onError, 'function')
  h.attach({ complete: true, naturalWidth: 0, currentSrc: `https://local.invalid${trustedServiceImage.src}` })
  h.flush() // The browser already emitted its failure before React hydration.
  assert.deepEqual(h.failures(), [trustedServiceImage.src])
  image = h.render().props.children
  assert.equal(image.props.src, NEUTRAL_SERVICE_PHOTO_SRC)
  h.attach({ complete: true, naturalWidth: 0, currentSrc: `https://local.invalid${NEUTRAL_SERVICE_PHOTO_SRC}` }); h.flush()
  assert.deepEqual(h.failures(), [trustedServiceImage.src, NEUTRAL_SERVICE_PHOTO_SRC])
  image = h.render().props.children
  assert.equal(image.props.src, INLINE_NEUTRAL_SERVICE_PHOTO_SRC); assert.equal(image.props.onError, undefined)
  const terminal = h.failures()
  h.attach({ complete: true, naturalWidth: 0, currentSrc: INLINE_NEUTRAL_SERVICE_PHOTO_SRC }); h.flush(); h.render(); h.flush()
  assert.equal(h.failures(), terminal, 'inline is terminal even if a browser reports a failed decode')
})

test('hydration never mistakes an unresolved lazy image, an empty currentSrc or a successful image for a cached failure', async () => {
  for (const node of [
    { complete: true, naturalWidth: 0, currentSrc: '' },
    { complete: true, naturalWidth: 0, currentSrc: '  ' },
    { complete: false, naturalWidth: 0, currentSrc: 'https://local.invalid/pending.webp' },
    { complete: true, naturalWidth: 64, currentSrc: 'https://local.invalid/loaded.webp' },
  ]) {
    const h = await componentHarness(); h.render(); h.attach(node); h.flush()
    assert.deepEqual(h.failures(), [], JSON.stringify(node))
    assert.equal(h.render().props.children.props.src, NEUTRAL_SERVICE_PHOTO_SRC)
  }
})

test('image-error memory stays bounded when a thumbnail instance receives many different services', async () => {
  const business = { id: 'local-business', industry: 'other' }, service = { id: 'local-service', name: 'Неописана бъдеща услуга' }
  const h = await componentHarness({ business, service })
  for (let index = 0; index < 16; index++) {
    const src = `/businesses/local-business/missing-${index}.webp`
    h.props.trustedServiceImage = { businessId: business.id, serviceId: service.id, rightsCleared: true, businessProvided: true, src }
    const image = h.render().props.children
    assert.equal(image.props.src, src); image.props.onError()
    assert.ok(h.failures().length <= 8)
    assert.ok(h.failures().includes(src), 'a new failure must not get stuck just because the cache is full')
  }
})
