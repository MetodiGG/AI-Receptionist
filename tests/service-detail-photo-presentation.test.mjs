import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { serviceThumbnail } from '../lib/service-thumbnail.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto, publicServiceThumbnail } from '../lib/discovery-photo-presentation.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { REVIEWED_PARTNER_SERVICE_PHOTOS } from '../lib/partner-service-photos.mjs'
import { presentPublicService } from '../lib/locale/public-content-server.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { loadPublicServiceMenu } from './helpers/public-service-menu.mjs'
import { publicDetailPhotoPayload } from '../lib/public-detail-photo-payload.mjs'
import generated from '../docs/service-detail-photo-provenance-20261126.json' with { type: 'json' }

const date = Date.parse('2026-11-26T12:00:00Z')
const taxonomyImages = new Set(DISCOVERY_SUBCATEGORIES.map(category => category.photo))
const asPublicBranch = id => {
  const record = approvedCatalogueRecord(PUBLIC_CATALOGUE.find(row => row.id === id), date)
  assert.ok(record, id + ' is still a confirmed local fixture')
  const details = catalogueDetailsWithServicePhotos(record, date)
  return {
    ...record, source: 'catalogue', businessCategory: record.category,
    details: { ...details, services: details.services.map(service => presentPublicService(service, record)) },
  }
}
const distinctPhoto = (service, business, options = {}) => publicDetailServiceThumbnail(service, {
  business, coverSources: businessCoverPhotoSources(business), ...options,
})
const imageBytes = src => readFile(new URL('../public' + src, import.meta.url))

test('Abi Beauty’s same three services and prices have three distinct detail photos, without touching thumbnail navigation or the cover', async () => {
  const business = asPublicBranch('sofia-abi-beauty-serdika')
  const before = structuredClone(business)
  const expected = [['Маникюр с гел лак', 24.99], ['Маникюр с обикновен лак', 15.99], ['Сваляне на гел лак', 7.99]]
  const services = expected.map(([name, price]) => {
    const service = business.details.services.find(item => item.name === name)
    assert.equal(service?.price, price, name)
    return service
  })
  const sources = services.map((service, index) => {
    const photo = distinctPhoto(service, business)
    assert.match(photo.src || '', /^\/service-photos\/[a-z0-9-]+\.webp$/u, service.name)
    assert.equal(photo.source, 'illustrative')
    assert.equal(taxonomyImages.has(photo.src), false, service.name + ' does not borrow a subcategory tile')
    assert.equal(matchesBusinessCoverPhoto(photo.src, businessCoverPhotoSources(business)), false)
    assert.equal(distinctPhoto(service, business, { locale: 'en' }).src, photo.src)
    if (index === 1) assert.equal(photo.src, publicServiceThumbnail(service, { business }).src, 'ordinary polish keeps its existing separate photo')
    else {
      const canonical = serviceThumbnail(service, { business }).src
      assert.equal(taxonomyImages.has(canonical), true, service.name + ' has a protected taxonomy counterpart')
      assert.notEqual(photo.src, canonical)
      assert.equal(publicServiceThumbnail(service, { business }).src, null, 'compact/search resolver does not acquire the newly reviewed image')
    }
    return photo.src
  })
  assert.equal(new Set(sources).size, 3)
  const fingerprints = await Promise.all([...sources, ...businessCoverPhotoSources(business)].map(async src => fingerprintDiscoveryPhoto(await imageBytes(src))))
  for (let i = 0; i < sources.length; i++) for (let j = i + 1; j < fingerprints.length; j++) {
    assert.equal(compareDiscoveryPhotos(fingerprints[i], fingerprints[j]), null, 'distinct scenes, not just distinct filenames')
  }
  assert.deepEqual(business, before)
})

test('Alyoga gets a separate one-to-one scene even when the cover is wrapped in responsive or optimized URLs', async () => {
  const business = asPublicBranch('sofia-alyoga-benkovski')
  const service = business.details.services[0]
  const [hero, fallback] = businessCoverPhotoSources(business)
  assert.equal(serviceThumbnail(service, { business }).src, fallback)
  const formattedCovers = [
    hero + '?w=640#preview',
    '/_next/image?url=' + encodeURIComponent(fallback + '?portrait=1') + '&w=640&q=85',
  ]
  const photo = distinctPhoto(service, business, { coverSources: formattedCovers })
  assert.match(photo.src || '', /^\/service-photos\/[a-z0-9-]+\.webp$/u)
  assert.notEqual(publicServiceThumbnail(service, { business }).src, photo.src, 'discovery previews keep their original resolver')
  assert.equal(photo.source, 'illustrative')
  assert.equal(taxonomyImages.has(photo.src), false)
  assert.equal(matchesBusinessCoverPhoto(photo.src, formattedCovers), false)
  const [fresh, coverImage, fallbackImage] = await Promise.all([photo.src, hero, fallback].map(async src => fingerprintDiscoveryPhoto(await imageBytes(src))))
  assert.equal(compareDiscoveryPhotos(fresh, coverImage), null)
  assert.equal(compareDiscoveryPhotos(fresh, fallbackImage), null)
  const unavailable = distinctPhoto(service, business, { coverSources: formattedCovers, unavailableSources: [photo.src] })
  assert.notEqual(unavailable.src, photo.src)
  assert.equal(matchesBusinessCoverPhoto(unavailable.src, formattedCovers), false, 'failing alternate must never bring back the hero')
})

test('provided exact-service image wins only for its own business and never repeats the hero or gets an AI label', () => {
  const business = { id: 'fixture-native-business', source: 'gorez', category: 'nails' }
  const service = { id: 'fixture-detail-service', name: 'Неуточнена услуга за полагане на специално покритие', category: 'nails' }
  const src = '/businesses/fixture-native-business/exact-service.webp'
  const trustedServiceImage = {
    src, serviceId: service.id, businessId: business.id, businessProvided: true, rightsCleared: true,
    alt: { bg: 'Авторски кадър от студиото', en: 'A photograph by the studio' },
  }
  const shown = distinctPhoto(service, business, { locale: 'en', trustedServiceImage })
  assert.equal(shown.src, src)
  assert.equal(shown.alt, trustedServiceImage.alt.en)
  assert.notEqual(shown.source, 'illustrative')
  assert.equal(distinctPhoto(service, business, { trustedServiceImage, coverSources: [src + '?w=640'] }).src, null)
  assert.equal(distinctPhoto(service, business, {
    trustedServiceImage, coverSources: ['/_next/image?url=' + encodeURIComponent(src) + '&w=640&q=80'],
  }).src, null)
  assert.equal(distinctPhoto(service, {
    ...business, photos: [{ src: '/businesses/fixture-native-business/first.webp' }, { src }],
  }, { trustedServiceImage }).src, null, 'do not reuse an image that already appears later in the gallery')
  for (const patches of [{ businessId: 'not-this-branch' }, { serviceId: 'not-this-service' }, { rightsCleared: false }]) {
    assert.equal(distinctPhoto(service, business, { trustedServiceImage: { ...trustedServiceImage, ...patches } }).src, null)
  }
  const apiSrc = '/api/business-media/450c5c2f-db41-476b-a21e-98cf5ee29194'
  const media = { ...trustedServiceImage, src: apiSrc }
  assert.equal(distinctPhoto(service, business, { trustedServiceImage: media }).src, apiSrc)
  assert.equal(distinctPhoto(service, business, {
    trustedServiceImage: media, coverSources: ['/_next/image?url=' + encodeURIComponent(apiSrc + '?v=2') + '&w=640&q=80'],
  }).src, null)
})

test('new detail-only artwork is small, source-bound and never a disguised duplicate', async () => {
  assert.equal(generated.assets.length, 9)
  const seen = new Set()
  for (const entry of generated.assets) {
    assert.match(entry.file, /^public\/service-photos\/go-detail-[a-z0-9-]+-20261126-v1\.webp$/u)
    assert.match(entry.sourceSha256, /^[\da-f]{64}$/u)
    assert.match(entry.prompt, /Use case: photorealistic-natural/u)
    assert.ok(entry.visualReview.length > 30)
    const image = await imageBytes(entry.file.slice('public'.length))
    assert.equal(createHash('sha256').update(image).digest('hex'), entry.optimizedSha256)
    assert.equal(image.length, entry.bytes)
    assert.ok(image.length < 24_000, entry.file)
    const fingerprint = await fingerprintDiscoveryPhoto(image)
    assert.deepEqual([fingerprint.width, fingerprint.height, fingerprint.format], [256, 256, 'webp'])
    for (const earlier of seen) assert.equal(compareDiscoveryPhotos(fingerprint, earlier), null, entry.file)
    seen.add(fingerprint)
  }
})

test('the detail resolver never decorates unknown or mismatched services with taxonomy photos and keeps native matches safe', () => {
  const cases = [
    [{ name: 'Общ час, договори вида на услугата със салона', category: 'nails' }, asPublicBranch('sofia-abi-beauty-serdika')],
    [{ name: 'Маникюр с гел лак и терапевтичен педикюр', category: 'nails' }, asPublicBranch('sofia-abi-beauty-serdika')],
    [{ name: 'Маникюр с гел лак', category: 'nails' }, { id: 'unknown', source: 'gorez', category: 'nails' }],
  ]
  for (const [service, business] of cases) assert.equal(distinctPhoto(service, business).src, null, service.name)
})

test('the rendered service menu keeps illustrative provenance in accessible image text without a visible label', async () => {
  const { PublicServiceMenu } = await loadPublicServiceMenu()
  const business = asPublicBranch('sofia-abi-beauty-serdika')
  const services = business.details.services.filter(service => service.category === 'nails')
  assert.equal(services.length, 3)
  const photoCandidates = publicDetailPhotoPayload(business, services)
  for (const locale of ['bg', 'en']) {
    const html = renderToStaticMarkup(createElement(PublicServiceMenu, { services, photoCandidates, locale }))
    assert.equal((html.match(/class="service-thumbnail-image"/gu) || []).length, 3)
    assert.equal((html.match(/data-image-kind="ai-illustration"/gu) || []).length, 3)
    const labels = locale === 'en' ? /<img[^>]*alt="AI illustration · [^"]+"/gu : /<img[^>]*alt="AI илюстрация · [^"]+"/gu
    assert.equal((html.match(labels) || []).length, 3, 'the image carries one localized accessible disclosure')
    assert.doesNotMatch(html, /service-thumbnail-ai-label|data-compact-disclosure|title="AI|>AI(?: илюстрация| illustration)?</u)
    assert.doesNotMatch(html, /(?:gel-manicure|nail-gel-removal)-v1\.webp/u, 'do not print the taxonomy photos')
  }
  const authentic = REVIEWED_PARTNER_SERVICE_PHOTOS.find(item => item.source === 'provided')
  assert.ok(authentic)
  const partner = { id: authentic.businessId, source: 'gorez' }
  const service = { id: authentic.serviceId, name: authentic.name, category: authentic.category }
  const partnerHtml = renderToStaticMarkup(createElement(PublicServiceMenu, {
    services: [service], photoCandidates: publicDetailPhotoPayload(partner, [service]), locale: 'bg',
  }))
  assert.ok(partnerHtml.includes(`/service-photos/${authentic.photoId}-v1.webp`))
  assert.doesNotMatch(partnerHtml, /service-thumbnail-ai-label|data-image-kind="ai-illustration"/u)
})

test('only the compact service-photo marker is small, white and transparent in the top-left corner', async () => {
  const css = await readFile(new URL('../app/service-thumbnail.css', import.meta.url), 'utf8')
  const marker = css.match(/\.service-thumbnail-ai-label\[data-compact-disclosure\] \{([^}]+)\}/u)?.[1]
  assert.ok(marker)
  assert.match(marker, /inset: 7px auto auto 7px;/u)
  assert.match(marker, /color: #fff;[\s\S]*-webkit-text-stroke: 1px #2b1e17;/u)
  assert.match(marker, /background: transparent;/u)
  assert.match(marker, /font-size: max\(10px,\.625rem\);/u)
  assert.match(css, /\.service-thumbnail-ai-label \{[^}]*inset:auto auto 2px 2px/u, 'the appearance for unrelated thumbnail views stays unchanged')
})
