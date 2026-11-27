import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { businessActivityPhotoKey } from '../lib/business-cover-photo.mjs'
import { catalogueDetailsWithServicePhotos } from '../lib/catalogue-service-photo-keys.mjs'
import { catalogueIdPattern } from '../lib/catalogue-photo-view.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { homeCategories } from '../lib/discovery/home.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import { DISCOVERY_SUBCATEGORIES } from '../lib/discovery/subcategories.mjs'
import { staticDiscoveryPhotoPath } from '../lib/discovery-photo-identity.mjs'
import { historicalBusinessCoverPhotoSources as businessCoverPhotoSources,
  historicalPublicDetailServiceThumbnail as publicDetailServiceThumbnail,
  auditHistoricalPublicDetailServicePhotos as auditPublicDetailServicePhotos,
  auditHistoricalServiceDetailGapWave as auditServiceDetailGapWave } from './provider-role-photo-history.mjs'
import { serviceDetailFinalPhotos } from '../lib/service-detail-final.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import generated from '../lib/service-detail-final-generated.json' with { type: 'json' }
import mechanical from '../lib/service-detail-final-mechanical.json' with { type: 'json' }
import wellness from '../lib/service-detail-final-wellness.json' with { type: 'json' }
import lessons from '../lib/service-detail-final-lessons.json' with { type: 'json' }
import provenance from '../docs/service-detail-final-20261127.json' with { type: 'json' }

const now = Date.parse('2026-11-26T12:00:00Z')
const publicDirectory = fileURLToPath(new URL('../public', import.meta.url))
const allFinal = [...generated, ...mechanical, ...wellness, ...lessons]
const paths = values => new Set(values.map(staticDiscoveryPhotoPath).filter(Boolean))
const nav = paths([
  ...DISCOVERY_SUBCATEGORIES.map(({ photo }) => photo),
  ...homeCategories().flatMap(({ photo, photo2x, photoLarge }) => [photo, photo2x, photoLarge]),
])
const fingerprints = new Map()
let auditPromise

const audit = () => auditPromise ??= auditServiceDetailGapWave({ now, wave: 'final', verbose: true })

// Cache by canonical path: the same asset can be an appropriate illustration
// at different branches, and the subcategory art is common to every branch.
function fingerprint(path) {
  if (!fingerprints.has(path)) {
    fingerprints.set(path, readDiscoveryImage(publicDirectory, path).then(fingerprintDiscoveryPhoto))
  }
  return fingerprints.get(path)
}

test('the final wave starts from the 194 remaining slots without changing a visible image', async () => {
  const report = await audit()
  assert.equal(report.gained, 194)
  assert.equal(report.withoutPhoto, 0)
  assert.deepEqual(report.retained, [])
  assert.deepEqual(report.repeats, [])
  const current = auditPublicDetailServicePhotos(undefined, { now })
  assert.equal(current.missing, report.withoutPhoto)
  assert.deepEqual(current.unsafe, [])
  for (const photo of generated) assert.ok(report.bySource[photo.src] > 0, photo.src)
})

test('every effective final-wave image differs visually from that branch’s covers, other offers, and navigation', async () => {
  const { newRows, gained } = await audit()
  assert.equal(newRows.length, gained)
  const rawById = new Map(PUBLIC_CATALOGUE.map(row => [row.id, row]))
  const branchImages = new Map()
  const checked = new Set()
  for (const [businessId, category, name, source] of newRows) {
    if (!branchImages.has(businessId)) {
      const row = approvedCatalogueRecord(rawById.get(businessId), now)
      assert.ok(row, businessId)
      const business = {
        ...row, source: 'catalogue', businessCategory: row.category, details: catalogueDetailsWithServicePhotos(row, now),
      }
      business.illustrativeCoverPhotoKey = businessActivityPhotoKey(business)
      const covers = paths([
        ...businessCoverPhotoSources(business),
        ...(business.photos || []).map(({ src }) => src),
      ])
      const services = business.details.services.map(service => ({
        ...service, image: staticDiscoveryPhotoPath(publicDetailServiceThumbnail(service, { business }).src),
      }))
      branchImages.set(businessId, { covers, services })
    }
    const image = staticDiscoveryPhotoPath(source)
    const context = `${businessId} · ${name}`
    assert.ok(image, context)
    assert.ok(serviceDetailFinalPhotos({ category, name }, { id: businessId, source: 'catalogue' })
      .some(photo => photo.src === image), context)
    const { covers, services } = branchImages.get(businessId)
    const matches = services.filter(service => service.name === name && service.category === category && service.image === image)
    assert.equal(matches.length, 1, context)
    const siblings = services.filter(service => service !== matches[0])
      .map(({ image }) => image).filter(Boolean)
    const visual = await fingerprint(image)
    for (const other of new Set([...covers, ...siblings, ...nav])) {
      assert.notEqual(image, other, context + ': duplicate photo ' + image)
      const pair = [image, other].sort().join('\0')
      if (checked.has(pair)) continue
      checked.add(pair)
      assert.equal(compareDiscoveryPhotos(visual, await fingerprint(other)), null,
        context + ': similar photo ' + image + ' / ' + other)
    }
  }
  assert.ok(checked.size >= gained)
})

test('new artwork matches its receipt and the 256-square, 20 KB WebP delivery limits', async () => {
  const receipts = new Map(provenance.assets.map(record => [record.file, record]))
  assert.equal(receipts.size, provenance.assets.length)
  assert.equal(receipts.size, generated.length)
  const prior = []
  for (const { src } of generated) {
    const file = 'public' + src
    const record = receipts.get(file)
    assert.ok(record?.prompt.startsWith('Use case: photorealistic-natural.'), file)
    assert.match(record.sourceSha256, /^[a-f0-9]{64}$/u, file)
    assert.deepEqual([record.width, record.height], [256, 256], file)
    const bytes = await readDiscoveryImage(publicDirectory, src)
    assert.equal(bytes.length, record.size, file)
    assert.ok(bytes.length <= 20_000, file)
    const photo = await fingerprint(src)
    assert.equal(photo.sha256, record.optimizedSha256, file)
    assert.deepEqual([photo.width, photo.height, photo.format], [256, 256, 'webp'], file)
    for (const [other, covered] of prior) {
      assert.equal(compareDiscoveryPhotos(photo, covered), null, file + ' / ' + other)
    }
    prior.push([file, photo])
  }
})

test('all final-wave bindings are exact and scoped to individual catalogue branches', () => {
  for (const photo of allFinal) {
    assert.ok(photo.services.length)
    assert.ok(photo.alt.bg && photo.alt.en)
    for (const [category, name, businessId] of photo.services) {
      const service = { category, name }
      const branch = { source: 'catalogue', id: businessId }
      const context = `${businessId} · ${category} · ${name}`
      assert.ok(typeof businessId === 'string' && catalogueIdPattern.test(businessId), context)
      assert.ok(serviceDetailFinalPhotos(service, branch).some(({ src }) => src === photo.src), context)
      assert.deepEqual(serviceDetailFinalPhotos(service, { ...branch, source: 'gorez' }), [], context)
      assert.deepEqual(serviceDetailFinalPhotos(service, { ...branch, id: 'sofia-no-final-photo-binding' }), [], context)
      assert.deepEqual(serviceDetailFinalPhotos({ ...service, name: name + ' (друга услуга)' }, branch), [], context)
    }
  }
})
