import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'
import receipt from './fixtures/catalogue-kriva-reka-darvenitsa-20261127.json' with { type: 'json' }
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-kriva-reka-darvenitsa-20261127-scope.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { RAW_SOFIA_CATALOGUE as RAW_LIVE, SOFIA_CATALOGUE as LIVE } from '../lib/discovery/sofia-catalogue.mjs'
import { allowsNewFile as nextNew, priorSource as nextPriorSource, priorCatalogue as nextPriorCatalogue } from './catalogue-orlyak-banishora-20261127-scope.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const root = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const now = Date.parse('2026-11-27T12:00:00Z')
const RAW_SOFIA_CATALOGUE = nextPriorCatalogue(RAW_LIVE), SOFIA_CATALOGUE = nextPriorCatalogue(LIVE)

test('exact receipt permits only two new businesses and one guarded, coordinate-free location correction', () => {
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const touched = new Set([git('diff','--name-only','--no-renames','-z',receipt.baseline,'--'),
    git('ls-files','--others','--exclude-standard','-z')].flatMap(bytes => bytes.toString().split('\0').filter(Boolean)))
  assert.deepEqual([...touched].filter(p => p !== 'node_modules' && !p.startsWith('tests/') && !nextNew(p)).sort(), [...changed,...added].sort())
  for (const path of changed) {
    const bytes = nextPriorSource(path, readFileSync(new URL(path, root))), before = git('show', receipt.baseline+':'+path)
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path, bytes), before, path)
  }
  for (const path of added) assert.equal(allowsNewFile(path), true, path)
  assert.equal(allowsFileChange('app/page.tsx'), false)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(rows)), receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))), receipt.baselineCatalogueSha256)
  }
  const sama = SOFIA_CATALOGUE.find(r => r.id === receipt.location.id)
  assert.throws(() => priorCatalogue([{...sama, address:sama.address+'А'}]), /Unreviewed SAMA/u)
})

test('new mobile assets are unique, purpose-specific and labelled as illustrations by the data layer', async () => {
  const publicDirectory = fileURLToPath(new URL('../public', import.meta.url)), used = []
  for (const {id} of receipt.records) {
    const row = SOFIA_CATALOGUE.find(r => r.id === id), view = catalogueProfileView(row,{now})
    const [cover] = businessCoverPhotoSources(view)
    const [service] = view.details.services
    const image = publicDetailServiceThumbnail(service,{business:view})
    assert.equal(image.source,'illustrative')
    assert.doesNotMatch(service.presentationEn.name+' '+service.presentationEn.description,/\p{Script=Cyrillic}/u)
    used.push([cover,960,720], [image.src,480,480])
  }
  assert.deepEqual(used.map(([p])=>'public'+p).sort(), Object.keys(receipt.added).filter(p=>p.endsWith('.webp')).sort())
  const prints = await Promise.all(used.map(async ([path,width,height]) => {
    const img = await readDiscoveryImage(publicDirectory,path)
    const meta = await sharp(img).metadata()
    assert.deepEqual([meta.format,meta.width,meta.height],['webp',width,height],path)
    assert.ok(meta.size < 120000, path)
    return fingerprintDiscoveryPhoto(img)
  }))
  for(const [i,a] of prints.entries()) for(const b of prints.slice(i+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
})
