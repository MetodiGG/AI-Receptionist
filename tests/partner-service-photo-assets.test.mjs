import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { auditPartnerServicePhotos } from '../scripts/audit-partner-service-photos.mjs'

const manifest = JSON.parse(await readFile(new URL('../docs/partner-service-photo-assets-2026-11-13.json', import.meta.url), 'utf8'))
const clone = () => structuredClone(manifest)
const readAsset = id => readFile(new URL(`../public/service-photos/${id}-v1.webp`, import.meta.url))

test('the dated native inventory has 22 specific decoded photos, nine reviewed associations and three preserved public-only exclusions', async () => {
  const before = JSON.stringify(manifest)
  const report = await auditPartnerServicePhotos({ manifest })
  assert.equal(report.complete, true); assert.deepEqual(report.issues, [])
  assert.equal(report.businesses, 6); assert.equal(report.rawServices, 25)
  assert.equal(report.visibleServices, 22); assert.equal(report.specificServices, 22)
  assert.equal(report.hiddenPlaceholders, 3); assert.equal(report.reviewedPhotos, 9)
  const supplied = manifest.assets.find(asset => asset.id === 'partner-megan-supplied')
  assert.equal(supplied.provenance.kind, 'user_supplied')
  assert.equal(supplied.width, 512); assert.equal(supplied.height, 432, 'the exact supplied frame is preserved proportionally, not stretched into a square')
  assert.equal(JSON.stringify(manifest), before)
})

test('missing, duplicate and unrelated partner image evidence fails closed', async () => {
  const missing = clone(); missing.assets.pop()
  const duplicate = clone(); duplicate.assets.push(duplicate.assets[0])
  const unrelated = clone(); unrelated.assets.push({ ...unrelated.assets[0], id: '../private' })
  for (const changed of [missing, duplicate, unrelated, null, {}]) assert.equal((await auditPartnerServicePhotos({ manifest: changed })).complete, false)
})

test('unreviewed or relabelled generated/supplied photos cannot inherit approval', async () => {
  const unseen = clone(); unseen.assets[0].review.finalDerivativeApproved = false
  const changedSource = clone(); changedSource.assets[1].review.sourceSha256 = '0'.repeat(64)
  const fakeReuse = clone(); fakeReuse.assets[1].provenance = { kind: 'existing_project' }; fakeReuse.assets[1].review.sourceSha256 = fakeReuse.assets[1].sha256
  const fakeSupplied = clone(); fakeSupplied.assets[0].provenance.kind = 'generated'
  const missingPrompt = clone(); delete missingPrompt.assets[1].provenance.prompt
  for (const changed of [unseen, changedSource, fakeReuse, fakeSupplied, missingPrompt]) assert.equal((await auditPartnerServicePhotos({ manifest: changed })).complete, false)
})

test('missing, malformed or replaced bitmap bytes fail even if the image metadata claims approval', async () => {
  const id = 'partner-car-lift-inspection'
  for (const replacement of [null, Buffer.from('not a photograph'), await readAsset('partner-hair-beard-brows-finish')]) {
    const report = await auditPartnerServicePhotos({ manifest, readAsset: async requested => {
      if (requested !== id) return readAsset(requested)
      if (replacement == null) throw Error('missing')
      return replacement
    } })
    assert.equal(report.complete, false); assert.ok(report.issues.some(issue => issue.id === id))
  }
})
