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
import { detailPriceLabel } from '../lib/discovery/business-details.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyLyulinCommercialBranchPoints20261127 } from '../lib/discovery/catalogue-data/lyulin-commercial-branch-points-20261127.mjs'
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
import pointsProof from '../docs/catalogue-coverage/lyulin9-10-verified-points-20261127.json' with { type:'json' }
import schoolProof from '../docs/catalogue-coverage/ramirus-levski-v-20261127.json' with { type:'json' }
import receipt from './fixtures/catalogue-levski-lyulin-20261127.json' with { type:'json' }
import { levskiLyulinAllowsPath, levskiLyulinPriorCatalogue, levskiLyulinPriorSource } from './catalogue-levski-lyulin-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url), now = Date.parse('2026-11-27T12:00:00Z')
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = row => sha(JSON.stringify(row))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString().split('\0').filter(Boolean)
const find = (id, rows = SOFIA_CATALOGUE) => rows.find(row => row.id === id)
const before = levskiLyulinPriorCatalogue(SOFIA_CATALOGUE)
const points = pointsProof.records.map(proof => [proof, find(proof.id), find(proof.id,before)])
const school = find(schoolProof.recordId)
const forbidden = () => assert.fail('Public catalogue reads must not access external providers or live bookings')
const getCell = (report, neighborhood, categoryId) => [...report.neighborhoods,...report.additionalNamedAreas]
  .find(area => area.name === neighborhood).cells.find(cell => cell.categoryId === categoryId)

test('independently pinned changes do not replace any other source bytes or earlier catalogue row', () => {
  assert.equal(receipt.baseline,pointsProof.baseCommit)
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const observed = [...new Set([...paths(git('diff','--name-only','--no-renames','-z',receipt.baseline,'--')),
    ...paths(git('ls-files','--others','--exclude-standard','-z'))])]
  assert.deepEqual(observed.filter(path=>path!=='node_modules' && !path.startsWith('tests/')).sort(),[...changed,...added].sort())
  for (const path of changed) {
    const oldBytes = git('show', receipt.baseline + ':' + path), newBytes = readFileSync(new URL(path, cwd))
    assert.deepEqual([sha(oldBytes),sha(newBytes)], [receipt.changed[path].before,receipt.changed[path].after],path)
    assert.deepEqual(levskiLyulinPriorSource(path,newBytes),oldBytes)
    assert.ok(levskiLyulinAllowsPath(path))
  }
  for (const path of added) assert.equal(sha(readFileSync(new URL(path,cwd))),receipt.added[path],path)
  for (const rows of [RAW_SOFIA_CATALOGUE,SOFIA_CATALOGUE]) {
    assert.equal(digest(rows),receipt.currentCatalogueSha256)
    assert.equal(digest(levskiLyulinPriorCatalogue(rows)),receipt.baselineCatalogueSha256)
  }
})

test('verified points recover two first GPS matches, with original offers and booking untouched', () => {
  const reports = [before,SOFIA_CATALOGUE].map(rows=>catalogueCoverageReport(rows,{now,target:30}))
  for (const [proof,row,old] of points) {
    const cells = reports.map(report=>getCell(report,proof.neighborhood,proof.categoryId))
    assert.deepEqual(cells.map(cell=>({physical:cell.count,gps:cell.locatedCount})),[proof.cellBefore,proof.cellAfter])
    assert.deepEqual(cells[1].locatedBusinessIds,[row.id])
    assert.deepEqual(row,{...old,coordinates:{ ...proof.after,source:proof.ownerContact,method:'first_party_coordinates',sourceAddress:proof.address }})
    assert.equal(pricingIdentity(row),proof.unchangedPricingIdentitySha256)
    assert.equal(pricingIdentity(row),pricingIdentity(old))
    assert.equal(applyLyulinCommercialBranchPoints20261127([row])[0],row)
    const moved = { ...old,address:old.address+' · нов вход' }
    assert.equal(applyLyulinCommercialBranchPoints20261127([moved])[0],moved)
    assert.equal(catalogueBoundCoordinates({...row,address:moved.address}),null)
    assert.throws(()=>levskiLyulinPriorCatalogue([{...row,phone:'+359883392011'}]),/Unreviewed Lyulin branch/u)
  }
})

test('the licensed school is the first verified education result in Levski V; unpublished prices stay absent', () => {
  const reports = [before,SOFIA_CATALOGUE].map(rows=>catalogueCoverageReport(rows,{now,target:30}))
  const coverage = reports.map(x=>[x.counts.approvedBusinesses,x.counts.premisesWithBoundCoordinates,x.counts.zeroCells,
    [...x.neighborhoods,...x.additionalNamedAreas].flatMap(a=>a.cells).filter(c=>!c.locatedCount).length])
  assert.deepEqual(coverage,[[1792,1054,1237,1313],[1793,1057,1236,1310]])
  const cells = reports.map(report=>getCell(report,'Левски В','education'))
  assert.deepEqual(cells.map(c=>[c.count,c.locatedCount]),[[0,0],[1,1]])
  assert.deepEqual(cells[1].locatedBusinessIds,[school.id])
  assert.equal(catalogueBoundCoordinates(school).addressId,'28282')
  assert.equal(pricingIdentity(school),schoolProof.inventoryIdentity)
  assert.ok(school.services.every(s=>s.price===undefined && s.durationMin===undefined && matchesSubcategory(s,'education-driving')))
  assert.deepEqual(school.services.map(s=>s.name),schoolProof.selectedOffers.map(offer=>offer.name))
  const review = BOOKING_PRICE_REVIEWS.find(row=>row.id===school.id)
  assert.deepEqual(assessPricingReview(school,review,now),
    {id:school.id,state:'service_reviewed',pricingState:'not_publicly_listed',checkedOn:'2026-11-27',reviewedPriceCount:0})
})

test('nearby search, details and standalone views retain routes and external handoffs without touching native calendars', async () => {
  const rows = [...points.map(([,row])=>row),school]
  const handler = createDiscoveryHandler({config:discoveryConfig({DISCOVERY_ENABLED:'true'}),sofiaOnly:true,now:DateTime.fromMillis(now),
    allowAttempt:()=>true,readInternal:async()=>[],readCatalogue:async()=>rows,fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden})
  const detail = createPublicBusinessDetailsHandler({config:{enabled:true},findCatalogue:id=>find(id,rows),now:()=>now,allowAttempt:()=>true})
  for (const row of rows) {
    const {latitude,longitude} = catalogueBoundCoordinates(row)
    const booking = row===school ? {kind:'form',href:schoolProof.bookingReview.url} : {kind:'phone',href:'tel:'+row.phone}
    for (const locale of ['bg','en']) {
      const res = await handler(new Request('https://gorez.test/api/public/discovery',{method:'POST',
        headers:{'content-type':'application/json','sec-fetch-site':'same-origin'},
        body:JSON.stringify({locale,category:row.category,...(row===school?{subcategory:'education-driving'}:{}),
          browse:true,coordinates:{latitude,longitude,consent:true},radiusKm:1})}))
      assert.equal(res.status,200)
      const card = (await res.json()).results.find(x=>x.id===row.id)
      assert.deepEqual(card.availability,{status:'external',slots:[]})
      const opened = await detail(new Request('https://gorez.test/api/public/discovery/business/'+row.id),row.id)
      assert.equal(opened.status,200)
      for (const view of [card,(await opened.json()).business,catalogueProfileView(row,{now})]) {
        assert.deepEqual(railExternalAction(view,now),booking)
        const route = new URL(businessDirectionsUrl(view))
        assert.equal(route.searchParams.get('api'),'1')
        assert.equal(route.searchParams.get('destination'),latitude+','+longitude)
        assert.equal(route.searchParams.get('destination_place_id'),null)
      }
    }
  }
})

test('the driving options render with English terms and three genuinely different photos, no invented price or duration', async () => {
  const business = catalogueProfileView(school,{now})
  const [cover] = businessCoverPhotoSources(business)
  assert.equal(cover,schoolProof.illustrations.cover)
  assert.deepEqual(business.details.services.map(s=>s.presentationEn.name),schoolProof.selectedOffers.map(x=>x.englishName))
  assert.ok(business.details.services.every(s=>detailPriceLabel(s)===null && /contact you about the schedule and the price/u.test(s.presentationEn.description)))
  const photos = business.details.services.map(s=>publicDetailServiceThumbnail(s,{business}))
  assert.ok(photos.every(photo=>photo.source==='illustrative'))
  assert.deepEqual(photos.map(p=>p.src),schoolProof.illustrations.services)
  const directory = fileURLToPath(new URL('../public',import.meta.url))
  const prints = await Promise.all([cover,...photos.map(p=>p.src)].map(async src=>fingerprintDiscoveryPhoto(await readDiscoveryImage(directory,src))))
  for (const [i,a] of prints.entries()) for (const b of prints.slice(i+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
})
