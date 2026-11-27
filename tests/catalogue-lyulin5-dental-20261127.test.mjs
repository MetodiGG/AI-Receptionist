import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { publishedBaselineMatches } from './catalogue-only-release-scope.mjs'
import { DateTime } from 'luxon'
import { businessDirectionsUrl } from '../lib/business-profile.mjs'
import { catalogueProfileView } from '../lib/catalogue-profile.mjs'
import { catalogueBoundCoordinates } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { applyDentalBranchPointsNov27 } from '../lib/discovery/catalogue-data/sofia-dental-branch-points-nov27.mjs'
import { assessPricingReview, pricingIdentity } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { createPublicBusinessDetailsHandler } from '../lib/discovery/public-details.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import studioProof from '../docs/catalogue-coverage/sedemchakri-lyulin5-20261127.json' with { type: 'json' }
import dentalProof from '../docs/catalogue-coverage/sofia-dental-verified-points-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-lyulin5-dental-20261127.json' with { type: 'json' }
import { lyulin5DentalAllowsPath, lyulin5DentalPriorCatalogue, lyulin5DentalPriorSource } from './catalogue-lyulin5-dental-20261127-scope.mjs'
import { levskiLyulinAllowsPath, levskiLyulinPriorCatalogue, levskiLyulinPriorSource } from './catalogue-levski-lyulin-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url), now = Date.parse('2026-11-27T12:00:00Z')
const sha = x => createHash('sha256').update(x).digest('hex')
const digest = x => sha(JSON.stringify(x))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString().split('\0').filter(Boolean)
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(levskiLyulinPriorCatalogue)
const find = (id, rows = SOFIA_CATALOGUE) => rows.find(row => row.id === id)
const studio = find(studioProof.recordId)
const dental = dentalProof.branches.map(branch => find(branch.id))
const before = lyulin5DentalPriorCatalogue(SOFIA_CATALOGUE)
const forbidden = () => assert.fail('No browse, profile or detail lookup should call a provider or native booking')

test('the Studio intake and three coordinate-only corrections are the only approved local changes', () => {
  assert.equal(receipt.baseline, dentalProof.baseCommit)
  assert.deepEqual(receipt.records.map(row => row.id), [studio.id])
  assert.deepEqual(receipt.rebound.map(row => row.id), dental.map(row => row.id))
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const reviewedPaths = new Set([...changed, ...added])
  const observed = new Set([...paths(git('diff','--name-only','--no-renames','-z',receipt.baseline,'--')),
    ...paths(git('ls-files','--others','--exclude-standard','-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !publishedBaselineMatches(path) &&
    (reviewedPaths.has(path) || !levskiLyulinAllowsPath(path))).sort(), [...changed,...added].sort())
  for (const path of changed) {
    const oldBytes = git('show', receipt.baseline + ':' + path)
    const newBytes = levskiLyulinPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(oldBytes),sha(newBytes)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.deepEqual(lyulin5DentalPriorSource(path, newBytes), oldBytes)
    assert.ok(lyulin5DentalAllowsPath(path))
  }
  for (const path of added) assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(digest(rows), receipt.currentCatalogueSha256)
    assert.equal(digest(lyulin5DentalPriorCatalogue(rows)), receipt.baselineCatalogueSha256)
  }
  assert.throws(() => lyulin5DentalPriorCatalogue([{ ...dental[0], category:'beauty' }]), /Unreviewed dental branch/u)
  assert.throws(() => lyulin5DentalPriorCatalogue([{ ...studio, phone:'+359988878666' }]), /Unreviewed verified Lyulin 5/u)
})

test('three existing dentist cells gain their first GPS result; Lyulin 5 gains one independent sports venue', () => {
  const reports = [before,SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows,{now,target:30}))
  const measure = r => [r.counts.approvedBusinesses,r.counts.premisesWithBoundCoordinates,
    [...r.neighborhoods,...r.additionalNamedAreas].flatMap(x=>x.cells).filter(c=>!c.locatedCount).length]
  assert.deepEqual(reports.map(measure), [[1791,1050,1316],[1792,1054,1313]])
  const cells = (area,category) => reports.map(r => [...r.neighborhoods,...r.additionalNamedAreas]
    .find(x=>x.name===area).cells.find(x=>x.categoryId===category))
  for (const [area, original, row] of [['Обеля 2',2,dental[0]],['Зона Б-19',1,dental[1]],['Левски В',1,dental[2]]]) {
    const relevant = cells(area,'other')
    assert.deepEqual(relevant.map(c=>[c.count,c.locatedCount]),[[original,0],[original,1]])
    assert.deepEqual(relevant[1].locatedBusinessIds,[row.id])
  }
  const fitness = cells('Люлин 5','fitness')
  assert.deepEqual(fitness.map(c=>[c.count,c.locatedCount]),[[1,1],[2,2]])
  assert.ok(fitness[1].locatedBusinessIds.includes(studio.id))
})

test('address edits do not inherit a pin; all three original service inventories, booking and dates stay intact', () => {
  for (const [i,row] of dental.entries()) {
    const old = find(row.id,before), proof = dentalProof.branches[i]
    assert.equal(old.coordinates, null)
    assert.deepEqual(row, { ...old, coordinates: row.coordinates })
    assert.deepEqual(catalogueBoundCoordinates(row), { ...proof.after, source: proof.ownerLocationUrl, method:'first_party_coordinates', sourceAddress:proof.address })
    assert.deepEqual(row.booking, proof.unchangedBooking)
    assert.equal(pricingIdentity(row), pricingIdentity(old))
    assert.equal(pricingIdentity(row), proof.unchangedPricingIdentitySha256)
    assert.equal(applyDentalBranchPointsNov27([row])[0],row)
    const moved = { ...old, address: old.address + ' · нов вход' }
    assert.equal(applyDentalBranchPointsNov27([moved])[0],moved)
    assert.equal(catalogueBoundCoordinates({ ...row, address: moved.address }),null)
  }
})

test('BG/EN catalogue nearby results, details and profile generate identical precise directions and an external booking action', async () => {
  const rows = [studio,...dental]
  const handle = createDiscoveryHandler({config:discoveryConfig({DISCOVERY_ENABLED:'true'}),sofiaOnly:true,
    now:DateTime.fromMillis(now),allowAttempt:()=>true,readInternal:async()=>[],readCatalogue:async()=>rows,
    fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden})
  const details = createPublicBusinessDetailsHandler({config:{enabled:true},
    findCatalogue:id=>find(id,rows),now:()=>now,allowAttempt:()=>true})
  for (const row of rows) {
    const { latitude, longitude } = catalogueBoundCoordinates(row)
    for (const locale of ['bg','en']) {
      const req = new Request('https://gorez.test/api/public/discovery',{method:'POST',
        headers:{'content-type':'application/json','sec-fetch-site':'same-origin'},
        body:JSON.stringify({locale,category:row.category,subcategory:row===studio?'fitness-yoga':'other-dental',
          browse:true,coordinates:{latitude,longitude,consent:true},radiusKm:1})})
      const throughSearch = await handle(req)
      assert.equal(throughSearch.status,200)
      const view = (await throughSearch.json()).results.find(item=>item.id===row.id)
      assert.deepEqual(view.availability,{status:'external',slots:[]})
      const throughDetails = await details(new Request('https://gorez.test/api/public/discovery/business/' + row.id),row.id)
      assert.equal(throughDetails.status,200)
      const href = row.booking.kind === 'form' ? row.booking.url : 'tel:' + row.booking.phone
      for (const business of [view,(await throughDetails.json()).business,catalogueProfileView(row,{now})]) {
        assert.deepEqual(railExternalAction(business,now),{kind:row.booking.kind,href})
        const url = new URL(businessDirectionsUrl(business))
        assert.equal(url.searchParams.get('api'),'1')
        assert.equal(url.searchParams.get('destination'),latitude + ',' + longitude)
        assert.equal(url.searchParams.get('destination_place_id'),null)
      }
    }
  }
})

test('the studio shows verified single visits, complete English labels and three distinct service illustrations', async () => {
  assert.equal(catalogueBoundCoordinates(studio).addressId,'122659')
  const checks = studioProof.verifiedServices
  assert.deepEqual(studio.services.map(s=>[s.name,s.price.amount,s.price.currency,s.price.unit,s.durationMin]),
    checks.map(p=>[p.name,p.price,p.currency,'едно посещение',undefined]))
  assert.ok(studio.services.every(s=>/22:00.*90 минути.*трима записани/u.test(s.description)))
  assert.deepEqual(studio.services.map(s=>['fitness-yoga','fitness-latin-dance'].map(sc=>matchesSubcategory(s,sc))),
    [[true,false],[true,false],[false,true]])
  const review = BOOKING_PRICE_REVIEWS.find(r=>r.id===studio.id)
  assert.deepEqual(assessPricingReview(studio,review,now), {id:studio.id,state:'reviewed',checkedOn:'2026-11-27',reviewedPriceCount:3})
  const business = catalogueProfileView(studio,{now})
  const [cover] = businessCoverPhotoSources(business)
  assert.equal(cover,studioProof.illustrations.cover)
  assert.deepEqual(business.details.services.map(s=>s.presentationEn.name), checks.map(p=>p.englishName))
  assert.ok(business.details.services.every(s=>/22:00.*90 minutes.*three participants/u.test(s.presentationEn.description)))
  const images = business.details.services.map(s=>publicDetailServiceThumbnail(s,{business}))
  assert.ok(images.every(p=>p.source==='illustrative'))
  assert.deepEqual(images.map(p=>p.src),studioProof.illustrations.services)
  const directory = fileURLToPath(new URL('../public',import.meta.url))
  const fingerprints = await Promise.all([cover,...images.map(p=>p.src)].map(async src=>fingerprintDiscoveryPhoto(await readDiscoveryImage(directory,src))))
  for (const [i,a] of fingerprints.entries()) for (const b of fingerprints.slice(i+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
})
