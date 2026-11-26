import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { auditServiceDetailGapWave } from '../scripts/audit-service-detail-gap-wave.mjs'
import { auditPublicDetailServicePhotos } from '../scripts/audit-public-detail-service-photos.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto } from '../scripts/discovery-photo-fingerprint.mjs'
import { detailGapFollowupPhotos } from '../lib/service-detail-gap-followup.mjs'
import generated from '../lib/service-detail-gap-followup-generated.json' with { type: 'json' }
import provenance from '../docs/service-detail-gap-followup-20261126.json' with { type: 'json' }

const file = path => readFile(new URL('../' + path, import.meta.url))

test('the follow-up fills exact remaining detail slots without changing a visible image or reusing one inside a profile', async () => {
  const result = await auditServiceDetailGapWave({ verbose: true, wave: 'followup' })
  assert.deepEqual(result.retained, [])
  assert.deepEqual(result.repeats, [])
  assert.ok(result.gained >= 200)
  assert.equal(result.gained + result.withoutPhoto, 762)
  assert.equal(Object.keys(result.byCategory).length, 14)
  for (const photo of generated) assert.ok(result.bySource[photo.src] > 0, photo.src)
  assert.deepEqual(auditPublicDetailServicePhotos().unsafe, [])
})

test('generated service photographs are optimized and visually distinct', async () => {
  assert.equal(provenance.assets.length, generated.length)
  const prior = []
  for (const assignment of generated) {
    const path = 'public' + assignment.src
    const item = provenance.assets.find(record => record.file === path)
    assert.ok(item?.prompt.startsWith('Use case: photorealistic-natural.'), path)
    const bytes = await file(path)
    assert.equal(bytes.length, item.size)
    assert.ok(bytes.length <= 20_000, path)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.optimizedSha256)
    const photo = await fingerprintDiscoveryPhoto(bytes)
    assert.deepEqual([photo.width, photo.height, photo.format], [256, 256, 'webp'])
    for (const [name, old] of prior) assert.equal(compareDiscoveryPhotos(photo, old), null, path + ' / ' + name)
    prior.push([path, photo])
  }
})

test('the extra image choices do not leak into partner services or loosely matching titles', () => {
  const service = { category: 'education', name: 'Пробен урок по програмиране за деца' }
  const business = { source: 'catalogue', id: 'catalogue-test' }
  assert.ok(detailGapFollowupPhotos(service, business).length)
  assert.deepEqual(detailGapFollowupPhotos(service, { ...business, source: 'gorez' }), [])
  assert.deepEqual(detailGapFollowupPhotos({ ...service, name: 'Пробен урок по програмиране за деца · на робот' }, business), [])
  assert.deepEqual(detailGapFollowupPhotos({ ...service, category: 'fitness' }, business), [])
})
