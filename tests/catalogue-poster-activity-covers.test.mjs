import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import test from 'node:test'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { businessCoverPhotoSources, matchesBusinessCoverPhoto, publicBusinessCoverPhoto, publicServiceThumbnail } from '../lib/discovery-photo-presentation.mjs'
import { crossQuarterPriorCatalogue } from './catalogue-verified-sofia-cross-quarter-20261127-scope.mjs'
import { appointmentGrowthPriorCatalogue } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'

const now = Date.parse('2026-11-26T12:00:00Z')
const posterExamples = [
  ['sofia-alyoga-benkovski', 'one-to-one-yoga'],
  ['sofia-yoga-district-mandala', 'yoga-class'],
  ['sofia-studio7-6-septemvri', 'reformer-pilates'],
  ['sofia-quickfit-otets-paisiy3', 'sx-mat-pilates-individual'],
]

test('the public search card and the details of each reported business recover the same approved artwork', async () => {
  const records = posterExamples.map(([id]) => PUBLIC_CATALOGUE.find(row => row.id === id))
  const results = normalizeCatalogueBusinesses(records, { browse: true, category: 'fitness', cityCode: '68134', requirements: [] }, { now })
  assert.equal(results.length, posterExamples.length)
  for (const [id, key] of posterExamples) {
    const business = results.find(row => row.id === id)
    const img = publicBusinessCoverPhoto(business)
    assert.equal(img.src, `/business-cover-photos/activity-${key}-v1.webp`, id)
    assert.equal(img.fallbackSrc, `/service-photos/${key}-v1.webp`, id)
    assert.equal(img.representativeActivity, true)
    assert.equal(publicBusinessCoverPhoto(business, { unavailableSources: [img.src] }).src, img.fallbackSrc)
    assert.equal(publicBusinessCoverPhoto(business, { unavailableSources: [img.src, img.fallbackSrc] }).src, null)
    const details = { ...business, illustrativeCoverPhotoKey: undefined, services: undefined, publicServiceNames: undefined }
    assert.equal(publicBusinessCoverPhoto(details).src, img.src, id)
    assert.deepEqual(businessCoverPhotoSources(business), [img.src, img.fallbackSrc])
    assert.equal(matchesBusinessCoverPhoto(`${img.fallbackSrc}?w=150`, businessCoverPhotoSources(business)), true)
  }
})

test('activity covers recover the current catalogue without overriding authentic pictures or inventing unknown activity', async () => {
  const catalogue = PUBLIC_CATALOGUE.map(row => approvedCatalogueRecord(row, now)).filter(Boolean)
  assert.equal(crossQuarterPriorCatalogue(appointmentGrowthPriorCatalogue(PUBLIC_CATALOGUE)).map(row => approvedCatalogueRecord(row, now)).filter(Boolean).length, 1776)
  const art = catalogue.map(row => publicBusinessCoverPhoto({ ...row, source: 'catalogue', details: catalogueDetailsWithServicePhotos(row, now) }))
  assert.equal(art.filter(cover => cover.src).length, catalogue.length)
  const sources = [...new Set(art.flatMap(cover => [cover.src, cover.fallbackSrc]).filter(Boolean))]
  await Promise.all(sources.map(src => access(new URL(`../public${src}`, import.meta.url))))
  const unknown = { id: 'sofia-unknown-activity', name: 'Unknown', source: 'catalogue', category: 'fitness', services: [{ name: 'Непозната дейност' }] }
  assert.equal(publicBusinessCoverPhoto(unknown).src, null)
  assert.equal(publicBusinessCoverPhoto({ ...unknown, services: [] }).src, null)
  const different = { id: 'sofia-other-fitness-activity', source: 'catalogue', category: 'fitness', services: [{ name: 'Народни танци за възрастни', category: 'fitness' }] }
  assert.notEqual(publicBusinessCoverPhoto(different).src, '/business-cover-photos/activity-reformer-pilates-v1.webp')
  const genuine = '/api/catalogue-media/a79b0bac-3bd5-4e3f-a71d-ad1fe635f1ea'
  const existing = { ...catalogue.find(row => row.id === posterExamples[0][0]), source: 'catalogue', photo: { src: genuine } }
  assert.deepEqual(businessCoverPhotoSources(existing), [genuine])
  assert.equal(matchesBusinessCoverPhoto('/service-photos/one-to-one-yoga-v1.webp', businessCoverPhotoSources(existing)), false)
  assert.equal(publicBusinessCoverPhoto({ ...existing, source: 'gorez' }).src, null, 'catalogue representative cover does not leak to a native partner')
})

test('showing a reviewed representative cover never changes exact service and taxonomy ownership', () => {
  const business = { id: 'sofia-alyoga-benkovski', source: 'catalogue', category: 'fitness', illustrativeCoverPhotoKey: 'one-to-one-yoga' }
  assert.equal(publicBusinessCoverPhoto(business).src, '/business-cover-photos/activity-one-to-one-yoga-v1.webp')
  const original = { name: 'Индивидуална йога · един човек', category: 'fitness', illustrativePhotoKey: 'one-to-one-yoga' }
  const adjacent = { ...original, name: 'Йога за всички — резервирана групова практика' }
  assert.equal(publicServiceThumbnail(original, { business }).src, '/service-photos/one-to-one-yoga-v1.webp')
  assert.notEqual(publicServiceThumbnail(adjacent, { business }).src, '/service-photos/one-to-one-yoga-v1.webp')
  assert.equal(matchesBusinessCoverPhoto(publicServiceThumbnail(original, { business }).src, businessCoverPhotoSources(business)), true)
  assert.equal(matchesBusinessCoverPhoto('/service-photos/yoga-class-v1.webp', businessCoverPhotoSources(business)), false)
})
