import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { auditPublicDetailServicePhotos } from '../scripts/audit-public-detail-service-photos.mjs'
import exact from '../lib/service-detail-photo-exact-gaps.json' with { type: 'json' }
import receipt from '../docs/service-detail-photo-exact-gaps-20261126.json' with { type: 'json' }
import nativeSamples from './fixtures/native-partner-services-20261113.json' with { type: 'json' }
import { visiblePublicServices } from '../lib/public-service-eligibility.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'

const now = Date.parse('2026-11-26T12:00:00Z')

test('all 34 Studio 99 service cards get a real asset, including the three exact omissions in its detail menu', async () => {
  const business = catalogueProfileView(findPublicCatalogueEntry('sofia-beauty-studio-99'), { now })
  const covers = businessCoverPhotoSources(business)
  assert.equal(business.details.services.length, 34)
  for (const service of business.details.services) {
    const photo = publicDetailServiceThumbnail(service, { business })
    assert.ok(photo.src, service.name)
    assert.ok(!covers.includes(photo.src), service.name)
    assert.ok((await readFile(new URL('../public' + photo.src, import.meta.url))).length, service.name)
  }
  const facial = business.details.services.find(service => service.name === 'Масаж на лице')
  assert.equal(facial.price, 51.13)
  assert.equal(facial.durationMin, 70)
  for (const asset of exact.filter(item => item.services)) {
    const service = business.details.services.find(item => asset.services.some(([category, name]) => item.category === category && item.name === name))
    assert.ok(service)
    assert.equal(publicDetailServiceThumbnail(service, { business, locale: 'en' }).src, asset.src)
    assert.notEqual(publicDetailServiceThumbnail(service, { business, unavailableSources: [asset.src] }).src, asset.src)
  }
})

test('known partner preview photos are exact and do not introduce a generic fallback for an unrelated partner', () => {
  const services = nativeSamples.businesses.flatMap(row => visiblePublicServices(row).map(service => ({ service, business: { ...row, source: 'gorez' } })))
  assert.equal(services.length, 22)
  for (const { service, business } of services) assert.ok(publicDetailServiceThumbnail(service, { business }).src, service.name)
  for (const asset of exact.filter(item => item.partnerServices)) for (const [businessId, serviceId, name] of asset.partnerServices) {
    const found = services.find(item => item.business.id === businessId && item.service.id === serviceId)
    assert.equal(found?.service.name, name)
    assert.equal(publicDetailServiceThumbnail(found.service, { business: found.business }).src, asset.src)
    assert.notEqual(publicDetailServiceThumbnail({ ...found.service, name: name + ' и още' }, { business: found.business }).src, asset.src)
    assert.notEqual(publicDetailServiceThumbnail(found.service, { business: { ...found.business, id: 'another-salon' } }).src, asset.src)
  }
})

test('the five new photos have checked build-size provenance and are not duplicate images', async () => {
  assert.equal(exact.length, 5)
  const seen = []
  for (const asset of exact) {
    const entry = receipt.assets.find(item => item.file === 'public' + asset.src)
    const bytes = await readFile(new URL('../public' + asset.src, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.optimizedSha256)
    assert.equal(bytes.length, entry.size)
    assert.ok(bytes.length < 12_000)
    const identity = await fingerprintDiscoveryPhoto(bytes)
    assert.deepEqual([identity.width, identity.height, identity.format], [256, 256, 'webp'])
    for (const earlier of seen) assert.equal(compareDiscoveryPhotos(identity, earlier), null, asset.src)
    seen.push(identity)
  }
})

test('an inventory-wide check covers final static detail output, never the business covers or subcategory tiles', () => {
  const result = auditPublicDetailServicePhotos(undefined, { now })
  assert.ok(result.services >= 10_284)
  assert.ok(result.withPhoto >= 9_169, 'keep the new audited coverage of actual service details')
  assert.deepEqual(result.unsafe, [])
})
