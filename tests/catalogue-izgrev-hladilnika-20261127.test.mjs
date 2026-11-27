import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyMetroCityAndLeaLocations20261127 } from '../lib/discovery/catalogue-data/metro-city-and-lea-locations-20261127.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import images from '../docs/catalogue-coverage/izgrev-hladilnika-images-20261127.json' with {type:'json'}
import locations from '../docs/catalogue-coverage/metro-city-and-lea-locations-20261127.json' with {type:'json'}
import schoolEvidence from '../docs/catalogue-coverage/avtostart-izgrev-20261127.json' with {type:'json'}
import receipt from './fixtures/catalogue-izgrev-hladilnika-20261127.json' with {type:'json'}
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-izgrev-hladilnika-20261127-scope.mjs'

const cwd=new URL('../',import.meta.url), now=Date.parse('2026-11-27T12:00:00Z')
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
const git=(...args)=>execFileSync('git',args,{cwd,maxBuffer:8*1024*1024})
const paths=bytes=>bytes.toString().split('\0').filter(Boolean)
const find=(id,rows=SOFIA_CATALOGUE)=>rows.find(x=>x.id===id)
const before=priorCatalogue(SOFIA_CATALOGUE)
const [school,dentist]=receipt.records.map(proof=>find(proof.id))
const forbidden=()=>assert.fail('Read-only catalogue must not use provider availability, analytics or booking writes')
const cells=report=>[...report.neighborhoods,...report.additionalNamedAreas].flatMap(area=>area.cells)
const cell=(report,quarter,category)=>[...report.neighborhoods,...report.additionalNamedAreas].find(x=>x.name===quarter).cells.find(x=>x.categoryId===category)

test('the intake is exactly additive except reviewed location paths, and old inventory is reconstructable',()=>{
  const changed=Object.keys(receipt.changed), added=Object.keys(receipt.added)
  const touched=[...new Set([...paths(git('diff','--name-only','--no-renames','-z',receipt.baseline,'--')),
    ...paths(git('ls-files','--others','--exclude-standard','-z'))])]
  assert.deepEqual(touched.filter(p=>p!=='node_modules'&&!p.startsWith('tests/')).sort(),[...changed,...added].sort())
  for(const path of changed){
    const original=git('show',receipt.baseline+':'+path), current=readFileSync(new URL(path,cwd))
    assert.deepEqual([sha(original),sha(current)],[receipt.changed[path].before,receipt.changed[path].after],path)
    assert.deepEqual(priorSource(path,current),original,path)
    assert.equal(allowsFileChange(path),true,path)
  }
  for(const path of added)assert.equal(allowsNewFile(path),true,path)
  for(const rows of [SOFIA_CATALOGUE,RAW_SOFIA_CATALOGUE]){
    assert.equal(sha(JSON.stringify(rows)),receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))),receipt.baselineCatalogueSha256)
  }
  assert.throws(()=>priorCatalogue([{...school,phone:'+359881234567'}]),/Unreviewed/u)
})

test('two empty sectors receive one new address each, with distinct counting for six existing profiles',()=>{
  const reports=[before,SOFIA_CATALOGUE].map(rows=>catalogueCoverageReport(rows,{now,target:30}))
  assert.deepEqual(reports.map(r=>[r.counts.approvedBusinesses,r.counts.premisesWithBoundCoordinates,
    r.counts.zeroCells,cells(r).filter(c=>!c.locatedCount).length]),[[1796,1060,1233,1307],[1798,1066,1231,1304]])
  for(const [quarter,category,expected] of [
    ['Изгрев','education',[[0,0],[1,1]]], ['Хладилника','other',[[0,0],[1,1]]],
    ['Младост 3','education',[[5,2],[8,5]]], ['Младост 3','barber',[[1,0],[2,1]]],
    ['Люлин 10','other',[[3,2],[3,3]]],
  ])assert.deepEqual(reports.map(r=>{const c=cell(r,quarter,category);return [c.count,c.locatedCount]}),expected)
  for(const proof of locations.records){
    const old=find(proof.id,before), current=find(proof.id)
    assert.deepEqual(current,{...old,neighborhood:proof.afterNeighborhood,coordinates:current.coordinates})
    assert.deepEqual(current.coordinates?[current.coordinates.latitude,current.coordinates.longitude]:null,proof.point)
    assert.equal(pricingIdentity(current),pricingIdentity(old))
    assert.equal(applyMetroCityAndLeaLocations20261127([current])[0],current)
    const moved={...old,address:old.address+' · друг обект'}
    assert.equal(applyMetroCityAndLeaLocations20261127([moved])[0],moved)
    assert.equal(catalogueBoundCoordinates({...current,address:moved.address}),null)
  }
})

test('the priced manual course preserves exactly one checked total; dental consultation has no invented tariff',()=>{
  const [lesson]=school.services, [visit]=dentist.services
  assert.deepEqual(school.services.map(x=>[x.price.amount,x.price.currency,x.price.kind,x.price.unit]),[[1270,'EUR','fixed','целия курс']])
  assert.match(lesson.description,/Държавният изпит по практика.*са отделно/u)
  assert.match(lesson.description,/договорената цена важи 3 месеца/u)
  assert.equal(school.coordinates.addressId,'22859')
  assert.equal(school.booking.url,schoolEvidence.bookingReview.url)
  assert.ok(!school.booking.url.includes('date_id'))
  assert.ok(matchesSubcategory(lesson,'education-driving'))
  assert.ok(matchesSubcategory(visit,'other-dental',dentist))
  assert.ok(!matchesSubcategory(visit,'other-psychology',dentist))
  assert.ok(visit.price===undefined&&visit.durationMin===undefined)
  assert.deepEqual([school,dentist].map(r=>{
    const review=assessPricingReview(r,BOOKING_PRICE_REVIEWS.find(x=>x.id===r.id),now)
    return [review.state,review.reviewedPriceCount]
  }),[['reviewed',1],['service_reviewed',0]])
})

test('discovery, details and standalone profile use the same sourced route and offsite action without reading slots',async()=>{
  const rows=[school,dentist], handler=createDiscoveryHandler({
    config:discoveryConfig({DISCOVERY_ENABLED:'true'}),sofiaOnly:true,now:DateTime.fromMillis(now),allowAttempt:()=>true,readInternal:async()=>[],
    readCatalogue:async()=>rows,fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden,
  }), detail=createPublicBusinessDetailsHandler({config:{enabled:true},findCatalogue:id=>find(id,rows),now:()=>now,allowAttempt:()=>true})
  for(const [row,sub] of [[school,'education-driving'],[dentist,'other-dental']]){
    const {latitude,longitude}=catalogueBoundCoordinates(row)
    for(const locale of ['bg','en']){
      const res=await handler(new Request('https://gorez.test/api/public/discovery',{method:'POST',
        headers:{'content-type':'application/json','sec-fetch-site':'same-origin'},body:JSON.stringify({
          locale,category:row.category,subcategory:sub,browse:true,coordinates:{latitude,longitude,consent:true},radiusKm:1,
        })}))
      assert.equal(res.status,200)
      const card=(await res.json()).results.find(x=>x.id===row.id)
      assert.deepEqual(card.availability,{status:'external',slots:[]})
      const opened=await detail(new Request('https://gorez.test/api/public/discovery/business/'+row.id),row.id)
      assert.equal(opened.status,200)
      for(const view of [card,(await opened.json()).business,catalogueProfileView(row,{now})]){
        const route=new URL(businessDirectionsUrl(view))
        assert.equal(route.searchParams.get('destination'),latitude+','+longitude)
        assert.equal(route.searchParams.get('destination_place_id'),null)
        assert.deepEqual(railExternalAction(view,now),row===school?{kind:'form',href:school.booking.url}:{kind:'phone',href:'tel:'+dentist.phone})
      }
    }
  }
})

test('cover and service illustrations are distinct, optimized and use translated exact price conditions',async()=>{
  const tracked=images.assets.map(a=>a.path.slice('public'.length)), used=[]
  for(const row of [school,dentist]){
    const business=catalogueProfileView(row,{now}), [cover]=businessCoverPhotoSources(business)
    const [service]=business.details.services, image=publicDetailServiceThumbnail(service,{business})
    used.push(cover,image.src)
    assert.equal(image.source,'illustrative')
    assert.doesNotMatch(service.presentationEn.name+service.presentationEn.description,/\p{Script=Cyrillic}/u)
    if(row===school){
      assert.equal(service.presentationEn.unit,'whole course')
      assert.match(service.presentationEn.description,/state practical exam, extra lessons and theory retakes cost extra/u)
    }
  }
  assert.deepEqual(used.sort(),tracked.sort())
  const directory=fileURLToPath(new URL('../public',import.meta.url))
  const prints=await Promise.all(used.map(async path=>fingerprintDiscoveryPhoto(await readDiscoveryImage(directory,path))))
  for(const [i,a] of prints.entries())for(const b of prints.slice(i+1))assert.equal(compareDiscoveryPhotos(a,b),null)
})
