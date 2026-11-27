import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'
import receipt from './fixtures/catalogue-aslan-sfdent-20261127.json' with { type: 'json' }
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-aslan-sfdent-20261127-scope.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { classifyExpiredCatalogueOffers } from '../lib/discovery/catalogue-expired-offer-holds.mjs'
import { auditCataloguePricing } from '../lib/discovery/catalogue-pricing-review.mjs'
import { RAW_SOFIA_CATALOGUE as RAW_LIVE, SOFIA_CATALOGUE as LIVE } from '../lib/discovery/sofia-catalogue.mjs'
import { allowsFileChange as nextChange, allowsNewFile as nextNew, priorSource as nextPriorSource,
  priorCatalogue as nextPriorCatalogue } from './catalogue-atues-visit-points-20261127-scope.mjs'
import { ASLAN_POLIGONA_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-aslan-poligona-20261127.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'

const root = new URL('../', import.meta.url)
const day = iso => Date.parse(iso + 'T12:00:00Z')
const now = day('2026-11-27')
const RAW_SOFIA_CATALOGUE = nextPriorCatalogue(RAW_LIVE), SOFIA_CATALOGUE = nextPriorCatalogue(LIVE)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const sha = value => createHash('sha256').update(value).digest('hex')
const aslan = SOFIA_CATALOGUE.find(x => x.id === receipt.records[0].id)
const sfDent = SOFIA_CATALOGUE.find(x => x.id === receipt.location.id)

test('exact scope permits one new school and a coordinate-only fix without other catalogue changes', () => {
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const touched = new Set([git('diff','--name-only','--no-renames','-z',receipt.baseline,'--'),
    git('ls-files','--others','--exclude-standard','-z')].flatMap(x=>x.toString().split('\0').filter(Boolean)))
  const reviewedPaths = new Set([...changed,...added])
  assert.deepEqual([...touched].filter(path=>path!=='node_modules'&&!path.startsWith('tests/') &&
    (reviewedPaths.has(path)||!(nextChange(path)||nextNew(path)))).sort(),[...reviewedPaths].sort())
  for (const path of changed) {
    const before = git('show',receipt.baseline+':'+path), bytes=nextPriorSource(path,readFileSync(new URL(path,root)))
    assert.equal(sha(before),receipt.changed[path].before,path)
    assert.equal(allowsFileChange(path),true,path)
    assert.deepEqual(priorSource(path,bytes),before,path)
  }
  for (const path of added) assert.equal(allowsNewFile(path),true,path)
  assert.equal(allowsFileChange('app/page.tsx'),false)
  for (const rows of [RAW_SOFIA_CATALOGUE,SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(rows)),receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))),receipt.baselineCatalogueSha256)
  }
  assert.deepEqual(priorCatalogue([sfDent]),[{...sfDent,coordinates:null}])
  assert.throws(()=>priorCatalogue([{...sfDent,phone:null}]),/Unreviewed SF Dent/u)
  assert.throws(()=>priorCatalogue([{...aslan,coordinates:sfDent.coordinates}]),/Unreviewed verified Aslan/u)
})

test('each offer expires without a free fallback; all exact expired offers can then archive without weakening the evidence gate', () => {
  const review = ASLAN_POLIGONA_20261127_REVIEWS
  const report = (row,t) => classifyExpiredCatalogueOffers(auditCataloguePricing([row],[],review,t),[row],review,t)
  const archive = day('2027-01-03'), onlySingle = day('2026-12-30')
  assert.deepEqual(report(aslan,now).blocking,[])
  assert.deepEqual(catalogueProfileView(aslan,{now:onlySingle}).details.services.map(x=>x.price),[50])
  assert.equal(catalogueProfileView(aslan,{now:archive}),null)
  assert.deepEqual(report(aslan,archive).withheldExpiredOffers,
    [{id:aslan.id,validThrough:'2027-01-02',reason:'dated_grade_seven_mock_exam_offers_expired'}])
  assert.deepEqual(report(aslan,archive).blocking,[])
  assert.deepEqual(report(aslan,day('2027-04-03')).blocking,[])
  const changed = {...aslan,services:aslan.services.map(x=>({...x,price:{...x.price,amount:x.price.amount+5}}))}
  assert.deepEqual(report(changed,archive).withheldExpiredOffers,[])
  assert.equal(report(changed,archive).blocking[0].id,aslan.id)
})

test('school cover and two service images are source-distinct optimized illustrations and the price conditions are localized', async () => {
  const profile = catalogueProfileView(aslan,{now})
  const [cover] = businessCoverPhotoSources(profile)
  const files = [[cover,960,720]]
  for (const service of profile.details.services) {
    const thumbnail=publicDetailServiceThumbnail(service,{business:profile})
    assert.equal(thumbnail.source,'illustrative')
    assert.doesNotMatch([service.presentationEn.name,service.presentationEn.description,service.presentationEn.unit].join(' '),/\p{Script=Cyrillic}/u)
    files.push([thumbnail.src,480,480])
  }
  assert.deepEqual(profile.details.services.map(s=>[s.price,s.presentationEn.unit]),[[50,'one exam'],[90,'total for two exams']])
  assert.deepEqual(files.map(([f])=>'public'+f).sort(),Object.keys(receipt.added).filter(p=>p.endsWith('.webp')).sort())
  const dir=fileURLToPath(new URL('../public',import.meta.url))
  const prints=await Promise.all(files.map(async([path,w,h])=>{
    const image=await readDiscoveryImage(dir,path), meta=await sharp(image).metadata()
    assert.deepEqual([meta.format,meta.width,meta.height],['webp',w,h],path)
    assert.ok(meta.size<120000,path)
    return fingerprintDiscoveryPhoto(image)
  }))
  for (const [i,a] of prints.entries()) for (const b of prints.slice(i+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
})
