import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { auditSpecificServicePhotoProvenance } from '../scripts/verify-specific-service-photo-provenance.mjs'

const bytes = Buffer.from('synthetic technical hash fixture, not a published image')
const hash = createHash('sha256').update(bytes).digest('hex')
const sourceHash = 'a'.repeat(64)
const fixture = () => ({ generationTool: 'built-in image_gen', rejectedSources: [], assets: [{
  id: 'sx-fixture', label: 'Technical fixture', prompt: 'A specific reviewed service scene; this is only a validation fixture.',
  sourceFile: 'exec-00000000-0000-0000-0000-000000000001.png', sourceSha256: sourceHash,
  bytes: bytes.length, sha256: hash,
  review: { status: 'accepted', finalLayoutApproved: true, sourceSha256: sourceHash, reviewers: ['test-only reviewer'], method: 'source-resolution' },
}] })
const audit = (manifest = fixture(), options = {}) => auditSpecificServicePhotoProvenance({
  ids: ['sx-fixture', 'classic-manicure'], manifest, readAsset: async () => bytes, ...options,
})

test('specific photo evidence binds a real reviewed source to exactly the optimized public asset without mutation', async () => {
  const manifest = fixture(), before = JSON.stringify(manifest), reads = []
  const report = await audit(manifest, { readAsset: async id => { reads.push(id); return bytes } })
  assert.deepEqual(report, { complete: true, checked: 1, issues: [] })
  assert.deepEqual(reads, ['sx-fixture']); assert.equal(JSON.stringify(manifest), before)
})

test('a rejected, unseen or subsequently replaced source cannot inherit visual approval', async () => {
  for (const change of [
    value => { value.rejectedSources.push({ sourceSha256: sourceHash }) },
    value => { value.assets[0].review.status = 'unreviewed' },
    value => { value.assets[0].review.finalLayoutApproved = false },
    value => { value.assets[0].review.sourceSha256 = 'b'.repeat(64) },
    value => { value.assets[0].review.reviewers = [] },
    value => { value.assets[0].review.method = '' },
  ]) { const value = fixture(); change(value); assert.equal((await audit(value)).complete, false) }
})

test('missing, duplicate, foreign, malformed and non-built-in generation records fail closed', async () => {
  for (const change of [
    value => { value.assets = [] },
    value => { value.assets.push({ ...value.assets[0] }) },
    value => { value.assets.push({ ...value.assets[0], id: 'sx-unreferenced' }) },
    value => { value.assets[0].sourceFile = '../private.png' },
    value => { value.assets[0].prompt = '' },
    value => { value.generationTool = 'unverified source' },
    value => { value.rejectedSources.push({ sourceSha256: 'bad hash' }) },
  ]) { const value = fixture(); change(value); assert.equal((await audit(value)).complete, false) }
  assert.equal((await audit(null)).complete, false)
  assert.equal((await audit(fixture(), { ids: ['sx-../private'] })).complete, false)
})

test('a missing or changed optimized file fails even when the manifest says accepted', async () => {
  assert.equal((await audit(fixture(), { readAsset: async () => Buffer.from('changed') })).complete, false)
  assert.equal((await audit(fixture(), { readAsset: async () => { throw Error('offline fixture') } })).complete, false)
})
