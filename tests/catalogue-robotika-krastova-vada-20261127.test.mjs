import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-robotika-krastova-vada-20261127-scope.mjs'
import receipt from './fixtures/catalogue-robotika-krastova-vada-20261127.json' with { type: 'json' }
import { allowsFileChange as laterChange, allowsNewFile as laterNew, priorCatalogue as earlierRows } from './catalogue-levski-karpuzitsa-20261127-scope.mjs'

const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const branch = SOFIA_CATALOGUE.find(row => row.id === receipt.records[0].id)

test('the exact Robotika approval changes one physical branch and its scoped service, images, translation and evidence', () => {
  const touched = new Set([git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--'),
    git('ls-files', '--others', '--exclude-standard', '-z')].flatMap(x => x.toString().split('\0').filter(Boolean)))
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  assert.deepEqual([...touched].filter(p => p !== 'node_modules' && !p.startsWith('tests/') &&
    (changed.includes(p) || added.includes(p) || !(laterChange(p) || laterNew(p)))).sort(), [...changed, ...added].sort())
  for (const path of changed) {
    const baselineBytes = git('show', receipt.baseline + ':' + path)
    const bytes = readFileSync(new URL(path, root))
    assert.equal(sha(baselineBytes), receipt.changed[path].before, path)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path, bytes), baselineBytes, path)
    const changedBytes = Buffer.concat([bytes, Buffer.from('\n')])
    assert.deepEqual(priorSource(path, changedBytes), changedBytes, path)
  }
  for (const path of added) assert.equal(allowsNewFile(path), true, path)
  assert.equal(allowsFileChange('app/page.tsx'), false)
  assert.equal(allowsFileChange('lib/booking-engine.mjs'), false)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE].map(earlierRows)) {
    assert.equal(sha(JSON.stringify(rows)), receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))), receipt.baselineCatalogueSha256)
    assert.equal(priorCatalogue(rows).length, rows.length - 1)
  }
  assert.throws(() => priorCatalogue([{ ...branch, coordinates: null }]), /Unreviewed verified Robotika/u)
})

test('illustrative classroom and service images are both present, distinct and use the established dimensions', async () => {
  const business = catalogueProfileView(branch, { now: Date.parse('2026-11-27T12:00:00Z') })
  const [cover] = businessCoverPhotoSources(business)
  const detail = publicDetailServiceThumbnail(business.details.services[0], { business })
  assert.equal(detail.source, 'illustrative')
  const files = [[cover, 960, 720], [detail.src, 480, 480]]
  assert.deepEqual(files.map(([file]) => 'public' + file).sort(), Object.keys(receipt.added).filter(p => p.endsWith('.webp')).sort())
  const dir = fileURLToPath(new URL('../public', import.meta.url))
  const prints = await Promise.all(files.map(async ([path, width, height]) => {
    const bytes = await readDiscoveryImage(dir, path), meta = await sharp(bytes).metadata()
    assert.deepEqual([meta.format, meta.width, meta.height], ['webp', width, height], path)
    assert.ok(bytes.length < 120_000, path)
    return fingerprintDiscoveryPhoto(bytes)
  }))
  assert.equal(compareDiscoveryPhotos(prints[0], prints[1]), null)
})
