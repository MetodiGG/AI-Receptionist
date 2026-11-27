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
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import assets from '../docs/catalogue-coverage/verified-smirnenski-karadzha-mladost-images-20261127.json' with { type:'json' }
import receipt from './fixtures/catalogue-smirnenski-karadzha-mladost-20261127.json' with { type:'json' }
import { allowsFileChange, allowsNewFile, priorCatalogue, priorSource } from './catalogue-smirnenski-karadzha-mladost-20261127-scope.mjs'

const now = Date.parse('2026-11-27T12:00:00Z')
const cwd = new URL('../', import.meta.url)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString().split('\0').filter(Boolean)
const records = receipt.records.map(proof => SOFIA_CATALOGUE.find(row => row.id===proof.id))
const before = priorCatalogue(SOFIA_CATALOGUE)
const counts = result => [...result.neighborhoods,...result.additionalNamedAreas].flatMap(area=>area.cells)
const cell = (r,row) => [...r.neighborhoods,...r.additionalNamedAreas].find(area=>area.name===row.neighborhood)
  .cells.find(c=>c.categoryId===row.category)
const forbidden = () => assert.fail('Sofia catalogue must not access provider, analytics or native bookings in public reads')

test('intake preserves all previous non-test bytes and listings except the signposted additive changes', () => {
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const touched = [...new Set([...paths(git('diff','--name-only','--no-renames','-z',receipt.baseline,'--')),
    ...paths(git('ls-files','--others','--exclude-standard','-z'))])]
  assert.deepEqual(touched.filter(p=>p!=='node_modules'&&!p.startsWith('tests/')).sort(),[...changed,...added].sort())
  for (const path of changed) {
    const original = git('show',receipt.baseline+':'+path), current = readFileSync(new URL(path,cwd))
    assert.deepEqual([sha(original),sha(current)],[receipt.changed[path].before,receipt.changed[path].after],path)
    assert.deepEqual(priorSource(path,current),original,path)
    assert.equal(allowsFileChange(path),true,path)
  }
  for (const path of added) assert.equal(allowsNewFile(path),true,path)
  for (const rows of [RAW_SOFIA_CATALOGUE,SOFIA_CATALOGUE]) {
    assert.equal(sha(JSON.stringify(rows)),receipt.currentCatalogueSha256)
    assert.equal(sha(JSON.stringify(priorCatalogue(rows))),receipt.baselineCatalogueSha256)
  }
  assert.throws(()=>priorCatalogue([{...records[0],phone:'+359881234567'}]),/Unreviewed/u)
})

test('three formerly empty neighborhood-category cells gain one exact physical and geolocated match each', () => {
  const reports = [before,SOFIA_CATALOGUE].map(rows=>catalogueCoverageReport(rows,{now,target:30}))
  assert.deepEqual(reports.map(r=>[r.counts.approvedBusinesses,r.counts.premisesWithBoundCoordinates,r.counts.zeroCells,
    counts(r).filter(c=>!c.locatedCount).length]),[[1793,1057,1236,1310],[1796,1060,1233,1307]])
  for (const row of records) {
    assert.deepEqual(reports.map(r=>{const c=cell(r,row);return [c.count,c.locatedCount,c.gap]}),[[0,0,30],[1,1,29]])
    assert.deepEqual(cell(reports[1],row).locatedBusinessIds,[row.id])
    assert.equal(catalogueBoundCoordinates({...row,address:row.address+' · нов адрес'}),null)
    assert.ok(catalogueBoundCoordinates(row))
    const review = BOOKING_PRICE_REVIEWS.find(x=>x.id===row.id)
    const assessed = assessPricingReview(row,review,now)
    if (row.category==='home_services') {
      assert.equal(assessed.state,'reviewed')
      assert.equal(assessed.reviewedPriceCount,1)
      assert.equal(row.services[0].appointmentModel,'home_visit')
      assert.deepEqual(row.services.map(s=>[s.price.amount,s.price.currency,s.price.unit]),[[3.99,'EUR','кв.м']])
      assert.match(row.services[0].description,/Транспортът е включен/u)
      assert.match(row.services[0].description,/2 € на кв\.м/u)
    } else {
      assert.equal(assessed.state,'service_reviewed')
      assert.equal(assessed.pricingState,'not_publicly_listed')
      assert.ok(row.services.every(service=>service.price===undefined&&service.durationMin===undefined))
    }
  }
})

test('mobile discovery and detail payloads show the same exact route and telephone handoff, without availability calls', async () => {
  const handler = createDiscoveryHandler({config:discoveryConfig({DISCOVERY_ENABLED:'true'}),sofiaOnly:true,now:DateTime.fromMillis(now),
    allowAttempt:()=>true,readInternal:async()=>[],readCatalogue:async()=>records,fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden})
  const detail = createPublicBusinessDetailsHandler({config:{enabled:true},findCatalogue:id=>records.find(row=>row.id===id),now:()=>now,allowAttempt:()=>true})
  for (const row of records) {
    const {latitude,longitude} = catalogueBoundCoordinates(row)
    for (const locale of ['bg','en']) {
      const results = await handler(new Request('https://gorez.test/api/public/discovery',{method:'POST',
        headers:{'content-type':'application/json','sec-fetch-site':'same-origin'},
        body:JSON.stringify({locale,category:row.category,browse:true,coordinates:{latitude,longitude,consent:true},radiusKm:1})}))
      assert.equal(results.status,200)
      const card = (await results.json()).results.find(x=>x.id===row.id)
      assert.deepEqual(card.availability,{status:'external',slots:[]})
      const opened = await detail(new Request('https://gorez.test/api/public/discovery/business/'+row.id),row.id)
      assert.equal(opened.status,200)
      for (const view of [card,(await opened.json()).business,catalogueProfileView(row,{now})]) {
        assert.deepEqual(railExternalAction(view,now),{kind:'phone',href:'tel:'+row.phone})
        const route = new URL(businessDirectionsUrl(view))
        assert.equal(route.searchParams.get('api'),'1')
        assert.equal(route.searchParams.get('destination'),latitude+','+longitude)
        assert.equal(route.searchParams.get('destination_place_id'),null)
      }
    }
  }
})

test('each new service has its own English presentation and optimized illustrative image distinct from every new cover', async () => {
  const tracked = new Set(assets.assets.map(a=>a.path.slice('public'.length)))
  const used = []
  for (const row of records) {
    const business = catalogueProfileView(row,{now}), [cover] = businessCoverPhotoSources(business)
    assert.ok(tracked.has(cover),cover)
    used.push(cover)
    for (const service of business.details.services) {
      assert.doesNotMatch(service.presentationEn.name+service.presentationEn.description,/\p{Script=Cyrillic}/u)
      const photo = publicDetailServiceThumbnail(service,{business})
      assert.equal(photo.source,'illustrative')
      assert.ok(tracked.has(photo.src),photo.src)
      used.push(photo.src)
    }
  }
  assert.equal(new Set(used).size,7)
  const directory = fileURLToPath(new URL('../public',import.meta.url))
  const prints = await Promise.all(used.map(async src=>fingerprintDiscoveryPhoto(await readDiscoveryImage(directory,src))))
  for (const [i,a] of prints.entries()) for (const b of prints.slice(i+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
})
