import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import sharp from 'sharp'
import receipt from './fixtures/catalogue-orlyak-banishora-20261127.json' with { type: 'json' }
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-orlyak-banishora-20261127-scope.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { RAW_SOFIA_CATALOGUE as RAW_LIVE, SOFIA_CATALOGUE as LIVE } from '../lib/discovery/sofia-catalogue.mjs'
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorCatalogue as nextPriorCatalogue, priorSource as nextPriorSource } from './catalogue-aslan-sfdent-20261127-scope.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'

const root = new URL('../', import.meta.url)
const now = Date.parse('2026-11-27T12:00:00Z')
const RAW_SOFIA_CATALOGUE = nextPriorCatalogue(RAW_LIVE), SOFIA_CATALOGUE = nextPriorCatalogue(LIVE)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = value => createHash('sha256').update(value).digest('hex')
const orlyak = SOFIA_CATALOGUE.find(x => x.id === receipt.records[0].id)

test('review receipt reconstructs the entire prior catalogue; no other business or UI can be changed', () => {
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const touched = new Set([git('diff','--name-only','--no-renames','-z',receipt.baseline,'--'),
    git('ls-files','--others','--exclude-standard','-z')].flatMap(x => x.toString().split('\0').filter(Boolean)))
  const reviewedPaths = new Set([...changed, ...added])
  assert.deepEqual([...touched].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (reviewedPaths.has(path) || !(nextChange(path) || nextNew(path)))).sort(), [...reviewedPaths].sort())
  for (const path of changed) {
    const bytes = nextPriorSource(path, readFileSync(new URL(path, root))), before = git('show', receipt.baseline+':'+path)
    assert.equal(sha(before), receipt.changed[path].before, path)
    assert.equal(allowsFileChange(path), true, path)
    assert.deepEqual(priorSource(path,bytes), before, path)
  }
  for (const path of added) assert.equal(allowsNewFile(path), true, path)
  assert.equal(allowsFileChange('app/page.tsx'), false)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(rows)), receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))), receipt.baselineCatalogueSha256)
  }
  assert.throws(() => priorCatalogue([{...orlyak,address:'София, ж.к. Банишора, ул. Орляк 24'}]), /Unreviewed verified Orlyak/u)
  assert.throws(() => priorCatalogue([orlyak,orlyak]), /Duplicate verified Orlyak/u)
})

test('Orlyak service image is a distinct compact WebP with intact provenance and English presentation', async () => {
  const business = catalogueProfileView(orlyak,{now})
  const [cover] = businessCoverPhotoSources(business), [service] = business.details.services
  const detail = publicDetailServiceThumbnail(service,{business})
  assert.equal(detail.source,'illustrative')
  assert.doesNotMatch(service.presentationEn.name+' '+service.presentationEn.description,/\p{Script=Cyrillic}/u)
  const files = [[cover,960,720],[detail.src,480,480]]
  assert.deepEqual(files.map(([p])=>'public'+p).sort(),Object.keys(receipt.added).filter(p=>p.endsWith('.webp')).sort())
  const publicDirectory = fileURLToPath(new URL('../public',import.meta.url))
  const prints = await Promise.all(files.map(async ([path,width,height]) => {
    const image = await readDiscoveryImage(publicDirectory,path)
    const meta = await sharp(image).metadata()
    assert.deepEqual([meta.format,meta.width,meta.height],['webp',width,height],path)
    assert.ok(meta.size < 120000)
    return fingerprintDiscoveryPhoto(image)
  }))
  assert.equal(compareDiscoveryPhotos(...prints),null)
})
