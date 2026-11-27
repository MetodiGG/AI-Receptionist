import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import sharp from 'sharp'
import receipt from './fixtures/catalogue-atues-visit-points-20261127.json' with { type: 'json' }
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-atues-visit-points-20261127-scope.mjs'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { applyGotseMladostVisitPoints20261127 } from '../lib/discovery/catalogue-data/gotse-mladost-visit-points-20261127.mjs'
import { ATUES_LYULIN3_20261127_REVIEWS } from '../lib/discovery/catalogue-data/neighborhood-verified-atues-lyulin3-20261127.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'

const root=new URL('../',import.meta.url), now=Date.parse('2026-11-27T12:00:00Z')
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:8*1024*1024})
const sha=x=>createHash('sha256').update(x).digest('hex')
const current=SOFIA_CATALOGUE, original=priorCatalogue(current)
const get=(id,rows=current)=>rows.find(x=>x.id===id)
const atues=get(receipt.records[0].id), mall=get('sofia-thai-spa-the-mall')

test('only one business and three independently reviewed locations are changed',()=>{
  const changed=Object.keys(receipt.changed),added=Object.keys(receipt.added)
  const touched=new Set([git('diff','--name-only','--no-renames','-z',receipt.baseline,'--'),
    git('ls-files','--others','--exclude-standard','-z')].flatMap(x=>x.toString().split('\0').filter(Boolean)))
  assert.deepEqual([...touched].filter(p=>p!=='node_modules'&&!p.startsWith('tests/')).sort(),[...changed,...added].sort())
  for(const path of changed){
    const before=git('show',receipt.baseline+':'+path),now=readFileSync(new URL(path,root))
    assert.equal(sha(before),receipt.changed[path].before,path)
    assert.ok(allowsFileChange(path),path)
    assert.deepEqual(priorSource(path,now),before,path)
  }
  for(const path of added)assert.ok(allowsNewFile(path),path)
  assert.equal(allowsFileChange('app/page.tsx'),false)
  for(const rows of [RAW_SOFIA_CATALOGUE,SOFIA_CATALOGUE]){
    assert.equal(sha(JSON.stringify(rows)),receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))),receipt.baselineCatalogueSha256)
  }
  for(const f of receipt.locations){
    const old=get(f.id,original), updated=get(f.id)
    assert.deepEqual({...updated,...f.original},old)
    assert.equal(pricingIdentity(updated),pricingIdentity(old))
    assert.equal(applyGotseMladostVisitPoints20261127([updated])[0],updated)
    assert.throws(()=>priorCatalogue([{...updated,phone:null}]),/Unreviewed visit-point or inventory/u)
  }
})

test('Poligona receives the first located therapy listing and the old plain-number map point is permanently blocked',()=>{
  const old=get(mall.id,original)
  assert.deepEqual(applyGotseMladostVisitPoints20261127([old]),[mall])
  const stale={...mall,coordinates:{...mall.coordinates,latitude:old.coordinates.latitude,longitude:old.coordinates.longitude}}
  assert.deepEqual(applyGotseMladostVisitPoints20261127([stale]),[{...stale,coordinates:null}])
  assert.equal(mall.coordinates.addressId,'100187')
  assert.equal(mall.coordinates.sourceNeighborhood,'Полигона')
  assert.match(mall.address,/115З, The Mall, ет\. -2, ляв вход/u)
  const profile=catalogueProfileView(mall,{now})
  assert.equal(new URL(businessDirectionsUrl(profile)).searchParams.get('destination'),'42.66023,23.382686')
  assert.deepEqual(railExternalAction(profile,now),{kind:'form',href:old.booking.url})
  const [before,after]=[original,current].map(rows=>catalogueCoverageReport(rows,{now,target:30}))
  const cell=(report,area,cat)=>[...report.neighborhoods,...report.additionalNamedAreas].find(r=>r.name===area).cells.find(c=>c.categoryId===cat)
  for(const [area,cat,x,y] of [
    ['Полигона','health',[0,0],[1,1]], ['Гоце Делчев','barber',[1,0],[1,1]],
    ['Младост 2','detailing',[1,0],[1,1]], ['Люлин 3','barber',[2,1],[3,1]],
  ])assert.deepEqual([before,after].map(r=>{const c=cell(r,area,cat);return [c.count,c.locatedCount]}),[x,y])
  assert.equal(after.counts.approvedBusinesses-before.counts.approvedBusinesses,1)
  assert.equal(after.counts.premisesWithBoundCoordinates-before.counts.premisesWithBoundCoordinates,2)
})

test('A Tu Estilo is distinct from Ecru, its form is external and its unique assets illustrate exact €20/€30 offers',async()=>{
  const ecru=get('sofia-ecru-lyulin386')
  assert.notEqual(ecru.phone,atues.phone)
  assert.notEqual(ecru.website,atues.website)
  assert.equal(catalogueBoundCoordinates(atues),null)
  assert.deepEqual(assessPricingReview(atues,ATUES_LYULIN3_20261127_REVIEWS[0],now),{
    id:atues.id,state:'reviewed',checkedOn:'2026-11-27',reviewedPriceCount:2,
  })
  const profile=catalogueProfileView(atues,{now}), [cover]=businessCoverPhotoSources(profile)
  assert.equal(businessDirectionsUrl(profile),null)
  assert.deepEqual(railExternalAction(profile,now),{kind:'form',href:atues.website})
  assert.deepEqual(profile.details.services.map(s=>[s.price,s.priceKind,s.currency]),[[20,'fixed','EUR'],[30,'fixed','EUR']])
  const files=[[cover,960,720]]
  for(const service of profile.details.services){
    const p=publicDetailServiceThumbnail(service,{business:profile})
    assert.equal(p.source,'illustrative')
    assert.doesNotMatch([service.presentationEn.name,service.presentationEn.description,service.presentationEn.unit].join(' '),/\p{Script=Cyrillic}/u)
    files.push([p.src,480,480])
  }
  assert.deepEqual(files.map(([f])=>'public'+f).sort(),Object.keys(receipt.added).filter(p=>p.endsWith('.webp')).sort())
  const dir=fileURLToPath(new URL('../public',import.meta.url))
  const prints=await Promise.all(files.map(async([path,w,h])=>{
    const image=await readDiscoveryImage(dir,path),meta=await sharp(image).metadata()
    assert.deepEqual([meta.format,meta.width,meta.height],['webp',w,h],path)
    assert.ok(meta.size<120000,path)
    return fingerprintDiscoveryPhoto(image)
  }))
  for(const [i,a] of prints.entries())for(const b of prints.slice(i+1))assert.equal(compareDiscoveryPhotos(a,b),null)
})
