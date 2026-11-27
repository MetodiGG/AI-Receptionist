import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { auditHistoricalServiceDetailGapWave as auditServiceDetailGapWave,
  auditHistoricalPublicDetailServicePhotos as auditPublicDetailServicePhotos } from './provider-role-photo-history.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { serviceDetailTailPhotos } from '../lib/service-detail-tail.mjs'
import generated from '../lib/service-detail-tail-generated.json' with { type: 'json' }
import provenance from '../docs/service-detail-tail-20261126.json' with { type: 'json' }

const contents = path => readFile(new URL('../' + path, import.meta.url))
const now = Date.parse('2026-11-26T12:00:00Z')

test('the latest exact mappings fill only existing image gaps without creating repeats inside a business', async () => {
  const report = await auditServiceDetailGapWave({ now, wave: 'tail', verbose: true })
  assert.deepEqual(report.retained, [])
  assert.deepEqual(report.repeats, [])
  assert.equal(report.gained + report.withoutPhoto, 412)
  assert.ok(report.gained >= 218)
  for (const image of generated) assert.ok(report.bySource[image.src] > 0, image.src)
  assert.deepEqual(auditPublicDetailServicePhotos(undefined, { now }).unsafe, [])
})

test('project-ready new images have reviewed provenance, optimized bytes and distinct visual content', async () => {
  assert.equal(provenance.assets.length, generated.length)
  const prior = []
  for (const image of generated) {
    const path = 'public' + image.src
    const record = provenance.assets.find(item => item.file === path)
    assert.ok(record?.prompt.startsWith('Use case: photorealistic-natural.'), path)
    const bytes = await contents(path)
    assert.equal(bytes.length, record.size)
    assert.ok(bytes.length <= 20_000, path)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.optimizedSha256)
    const photo = await fingerprintDiscoveryPhoto(bytes)
    assert.deepEqual([photo.width, photo.height, photo.format], [256, 256, 'webp'])
    for (const [other, fingerprint] of prior) assert.equal(compareDiscoveryPhotos(photo, fingerprint), null, path + ' vs ' + other)
    prior.push([path, photo])
  }
})

test('tail bindings do not affect unrelated offers or first-party partner catalogues', () => {
  const service = { category: 'home_services', name: 'Пране на детски матрак' }
  const catalogue = { source: 'catalogue', id: 'sofia-prane-na-matraci' }
  assert.ok(serviceDetailTailPhotos(service, catalogue).length)
  assert.deepEqual(serviceDetailTailPhotos(service, { ...catalogue, source: 'gorez' }), [])
  assert.deepEqual(serviceDetailTailPhotos({ ...service, name: 'Пране на детски матрак и канапе' }, catalogue), [])
  assert.deepEqual(serviceDetailTailPhotos({ ...service, category: 'fitness' }, catalogue), [])
  const trial = { category: 'education', name: 'Пробен урок' }
  assert.ok(serviceDetailTailPhotos(trial, { ...catalogue, id: 'sofia-drum-action' }).some(photo => photo.src.includes('drums-lesson-three')))
  assert.deepEqual(serviceDetailTailPhotos(trial, { ...catalogue, id: 'different-provider' }), [])
})
