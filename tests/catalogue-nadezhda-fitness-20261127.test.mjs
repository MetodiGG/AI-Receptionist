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
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'
import { RAW_SOFIA_CATALOGUE as liveRaw, SOFIA_CATALOGUE as live } from '../lib/discovery/sofia-catalogue.mjs'
import { matchesSubcategory } from '../lib/discovery/subcategories.mjs'
import { businessCoverPhotoSources } from '../lib/public-business-cover-photo.mjs'
import { publicDetailServiceThumbnail } from '../lib/service-detail-photo-presentation.mjs'
import { catalogueCoverageReport } from '../scripts/catalogue-coverage-report.mjs'
import { compareDiscoveryPhotos, fingerprintDiscoveryPhoto, readDiscoveryImage } from '../scripts/discovery-photo-fingerprint.mjs'
import { nadezhdaAllowsPath, nadezhdaPriorCatalogue, nadezhdaPriorSource } from './catalogue-nadezhda-fitness-20261127-scope.mjs'
import { lyulin5DentalAllowsPath, lyulin5DentalPriorCatalogue, lyulin5DentalPriorSource } from './catalogue-lyulin5-dental-20261127-scope.mjs'
import evidence from '../docs/catalogue-coverage/nadezhda1-2-fitness-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-nadezhda-fitness-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url), now = Date.parse('2026-11-27T12:00:00Z')
const sha = x => createHash('sha256').update(x).digest('hex')
const rowHash = rows => sha(JSON.stringify(rows))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const paths = bytes => bytes.toString().split('\0').filter(Boolean)
const ids = ['sofia-flais-nadezhda1-lyuborodie2','sofia-sihia-nadezhda2-velezhki49g']
const [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE] = [liveRaw, live].map(lyulin5DentalPriorCatalogue)
const [flais, sihia] = ids.map(id => SOFIA_CATALOGUE.find(x => x.id === id))
const earlier = nadezhdaPriorCatalogue(SOFIA_CATALOGUE)

test('two reviewed additions, exact bytes, and untouched previous catalogue', () => {
  assert.deepEqual(receipt.records.map(x => x.id), ids)
  assert.equal(receipt.baseline, evidence.baseCommit)
  const changed = Object.keys(receipt.changed), added = Object.keys(receipt.added)
  const reviewedPaths = new Set([...changed, ...added])
  const observed = new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...observed].filter(path => path !== 'node_modules' && !path.startsWith('tests/') &&
    (reviewedPaths.has(path) || !lyulin5DentalAllowsPath(path))).sort(), [...changed, ...added].sort())
  for (const path of changed) {
    const before = git('show', receipt.baseline + ':' + path), after = lyulin5DentalPriorSource(path, readFileSync(new URL(path, cwd)))
    assert.deepEqual([sha(before), sha(after)], [receipt.changed[path].before, receipt.changed[path].after], path)
    assert.deepEqual(nadezhdaPriorSource(path, after), before, path)
    assert.ok(nadezhdaAllowsPath(path))
    const tampered = Buffer.concat([after, Buffer.from('\n')])
    assert.equal(nadezhdaPriorSource(path, tampered), tampered, path)
  }
  for (const path of added) assert.equal(sha(readFileSync(new URL(path, cwd))), receipt.added[path], path)
  for (const rows of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    assert.equal(rowHash(rows), receipt.currentCatalogueSha256)
    assert.equal(rowHash(nadezhdaPriorCatalogue(rows)), receipt.baselineCatalogueSha256)
  }
  for (const file of ['app/page.js','lib/booking-engine.mjs','next.config.mjs','supabase/config.toml','public/logo.svg']) {
    assert.equal(nadezhdaAllowsPath(file), false)
  }
  assert.throws(() => nadezhdaPriorCatalogue([{ ...sihia, address: sihia.address.replace('вх. Г','вх. В') }]), /Unreviewed verified Nadezhda/u)
})

test('the 7-day and 3-month amounts are totals; Reformer is a single group visit with precise conditions', () => {
  assert.deepEqual(flais.services.map(s => [s.price.amount,s.price.currency,s.price.unit]), [[25,'EUR','пакет за 7 дни'],[153,'EUR','пакет за 3 месеца']])
  assert.match(flais.services[0].description, /7 дни.*до 1 групово занимание на ден/u)
  assert.match(flais.services[1].description, /3 месеца.*до 1 групово занимание на ден.*Не включва фитнес.*не се замразява/u)
  assert.equal(sihia.services.length, 1)
  assert.deepEqual([sihia.services[0].price.amount,sihia.services[0].price.unit], [21,'едно посещение'])
  assert.match(sihia.services[0].description, /1 групово посещение без МултиСпорт.*4 часа.*При късен отказ или неявяване.*21 €/u)
  assert.equal(catalogueBoundCoordinates(sihia).addressId, '99282')
  assert.equal(catalogueBoundCoordinates({...sihia,address:sihia.address.replace('вх. Г','вх. В')}), null)
  assert.ok(flais.services.every(s => matchesSubcategory(s,'fitness-group-training') && !matchesSubcategory(s,'fitness-yoga')))
  assert.ok(matchesSubcategory(sihia.services[0],'fitness-pilates'))
  for (const row of [flais,sihia]) {
    const review = BOOKING_PRICE_REVIEWS.find(record => record.id === row.id)
    assert.deepEqual(assessPricingReview(row, review, now), { id:row.id,state:'reviewed',checkedOn:'2026-11-27',reviewedPriceCount:row.services.length })
    assert.ok(row.services.every(s => s.durationMin === undefined))
  }
})

test('both previously empty cells now show a precise nearby business with external booking only', async () => {
  const audits = [earlier,SOFIA_CATALOGUE].map(rows => catalogueCoverageReport(rows,{now,target:30}))
  assert.deepEqual(audits.map(c => [c.counts.approvedBusinesses,c.counts.premisesWithBoundCoordinates]), [[1789,1048],[1791,1050]])
  const forbidden = () => assert.fail('Browse must not call provider or native booking')
  const handler = createDiscoveryHandler({ config:discoveryConfig({DISCOVERY_ENABLED:'true'}),sofiaOnly:true,now:DateTime.fromMillis(now),
    allowAttempt:()=>true,readInternal:async()=>[],readCatalogue:async()=>[flais,sihia],fetcher:forbidden,claimBudget:forbidden,getBusiness:forbidden,getSlots:forbidden })
  const pairs = [[flais,'fitness-group-training',evidence.sources.flais.booking],[sihia,'fitness-pilates',evidence.sources.sihia.booking]]
  for (const [row,subcategory,href] of pairs) {
    const cell = a => a.neighborhoods.find(x=>x.name===row.neighborhood).cells.find(x=>x.categoryId==='fitness')
    assert.deepEqual(audits.map(a=>[cell(a).count,cell(a).locatedCount]),[[0,0],[1,1]])
    const {latitude,longitude} = catalogueBoundCoordinates(row)
    const response = await handler(new Request('https://gorez.test/api/public/discovery',{method:'POST',
      headers:{'content-type':'application/json','sec-fetch-site':'same-origin'},
      body:JSON.stringify({locale:'bg',category:'fitness',subcategory,browse:true,coordinates:{latitude,longitude,consent:true},radiusKm:1}),
    }))
    assert.equal(response.status,200)
    const card = (await response.json()).results.find(x=>x.id===row.id)
    assert.deepEqual(card.availability,{status:'external',slots:[]})
    for (const view of [card,catalogueProfileView(row,{now})]) {
      assert.deepEqual(railExternalAction(view,now),{kind:'form',href})
      const route = new URL(businessDirectionsUrl(view))
      assert.equal(route.searchParams.get('destination'),latitude+','+longitude)
      assert.equal(route.searchParams.get('destination_place_id'),null)
    }
  }
})

test('rendered service images are genuinely distinct from each business cover', async () => {
  const publicDirectory = fileURLToPath(new URL('../public', import.meta.url))
  for (const [row,choice] of [[flais,evidence.photos.flais],[sihia,evidence.photos.sihia]]) {
    const business = catalogueProfileView(row,{now})
    const [cover] = businessCoverPhotoSources(business)
    const detail = business.details.services.map(service=>publicDetailServiceThumbnail(service,{business,coverSources:[cover]})?.src)
    assert.deepEqual([cover,...detail],[choice.cover,...choice.services])
    const prints = await Promise.all([cover,...detail].map(async src=>fingerprintDiscoveryPhoto(await readDiscoveryImage(publicDirectory,src))))
    for (const [index,a] of prints.entries()) for (const b of prints.slice(index+1)) assert.equal(compareDiscoveryPhotos(a,b),null)
  }
})
