import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { findPublicCatalogueEntry } from '../lib/discovery/public-catalogue.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { auditHistoricalServiceDetailGapWave as auditServiceDetailGapWave,
  auditHistoricalPublicDetailServicePhotos as auditPublicDetailServicePhotos } from './provider-role-photo-history.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import generated from '../lib/service-detail-gap-generated.json' with { type: 'json' }
import receipt from '../docs/service-detail-gap-wave-20261126.json' with { type: 'json' }

const now = Date.parse('2026-11-26T12:00:00Z')
const local = file => readFile(new URL('../' + file, import.meta.url))

test('the next service detail wave preserves current photos, fills real gaps across the catalogue and adds no same-profile repeats', async () => {
  const result = await auditServiceDetailGapWave({ now, verbose: true })
  assert.deepEqual(result.retained, [])
  assert.deepEqual(result.repeats, [])
  assert.ok(result.gained >= 325)
  assert.ok(result.gainedFromGenerated >= 135)
  assert.equal(Object.keys(result.byCategory).length, 14)
  for (const photo of generated) assert.ok(result.bySource[photo.src] > 0, photo.src)
  assert.deepEqual(auditPublicDetailServicePhotos(undefined, { now }).unsafe, [])
})

test('generated thumbnails are lightweight, match the checked-in provenance and do not duplicate each other', async () => {
  const seen = []
  const navigation = new Set(DISCOVERY_SUBCATEGORIES.map(item => item.photo))
  assert.equal(receipt.assets.length, generated.length)
  for (const photo of generated) {
    const file = 'public' + photo.src
    const meta = receipt.assets.find(item => item.file === file)
    assert.ok(meta.prompt.startsWith('Use case: photorealistic-natural.'), file)
    assert.ok(!navigation.has(photo.src), file)
    const bytes = await local(file)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), meta.optimizedSha256, file)
    assert.equal(bytes.length, meta.size)
    assert.ok(bytes.length <= 20_000, file)
    const img = await fingerprintDiscoveryPhoto(bytes)
    assert.deepEqual([img.width, img.height, img.format], [256, 256, 'webp'])
    for (const [earlier, name] of seen) assert.equal(compareDiscoveryPhotos(img, earlier), null, file + ' vs. ' + name)
    seen.push([img, file])
  }
})

test('new driving-school thumbnails use the exact service, not business covers, other activities or partner sources', () => {
  const business = catalogueProfileView(findPublicCatalogueEntry('sofia-vasilena-drive-zheko-voyvoda'), { now })
  const service = business.details.services.find(item => item.name === 'Опреснителен шофьорски урок')
  assert.ok(service)
  const one = publicDetailServiceThumbnail(service, { business, locale: 'bg' })
  const english = publicDetailServiceThumbnail(service, { business, locale: 'en' })
  assert.match(one.src, /go-detail-refresher-driving-20261126/u)
  assert.match(one.alt, /инструктор/u)
  assert.match(english.alt, /instructor/u)
  assert.equal(one.source, 'illustrative')
  for (const options of [
    { business, unavailableSources: [one.src] },
    { business, coverSources: [one.src] },
    { business: { ...business, source: 'gorez' } },
  ]) assert.notEqual(publicDetailServiceThumbnail(service, options).src, one.src)
  for (const change of [{ category: 'auto_repair' }, { name: service.name + ' · симулатор' }]) {
    assert.notEqual(publicDetailServiceThumbnail({ ...service, ...change }, { business }).src, one.src)
  }
})
