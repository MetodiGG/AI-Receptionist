import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CATALOGUE_REVALIDATION_BASE, CATALOGUE_REVALIDATION_HASHES, catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import { sportsMobilePhotoFitAllowsFileChange } from './sports-mobile-photo-fit-scope.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import education from '../lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const root=fileURLToPath(new URL('../',import.meta.url))
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, source))))))
const before=path=>git('show',CATALOGUE_REVALIDATION_BASE+':'+path)
const sha256=value=>createHash('sha256').update(value).digest('hex')
const priceSource='lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
const educationSource='lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'
const priceIdentities='lib/discovery/catalogue-data/pricing-booking-review-identities-20261110.json'
const educationIdentities='lib/discovery/catalogue-data/neighborhood-reviewed-identities-20261113.json'
const aliasSource='lib/catalogue-service-photo-associations-20261113.mjs'
const cacheSource='lib/locale/service-english.json'
const twoIds=['sofia-artizba-cherni-vrah33e','sofia-svetlinki-sheynovo13a']
const productionPath=path=>path!=='node_modules'&&!/^(?:tests|docs)\//u.test(path)&&!['AGENTS.md','README.md'].includes(path)
const tree=git('ls-tree','-r','-z',CATALOGUE_REVALIDATION_BASE).split('\0').filter(Boolean).map(record=>{
  const [metadata,path]=record.split('\t'),[mode,type,oid]=metadata.split(' ')
  return {mode,type,oid,path}
}).filter(record=>record.type==='blob'&&productionPath(record.path))
function section(source,start,end){
  const first=source.indexOf(start),last=source.indexOf(end,first+start.length)
  assert.ok(first>=0&&last>first,start)
  assert.equal(source.indexOf(start,first+start.length),-1,start+' is unique')
  return source.slice(first,last)
}
function replaceOnce(source,from,to){
  assert.equal(source.split(from).length,2,'exactly one reviewed occurrence: '+from.slice(0,90))
  return source.replace(from,to)
}
function arrayLiteral(source,name){
  const start=source.indexOf('const '+name+' = '),tail=source.slice(start)
  assert.ok(start>=0,name)
  const match=tail.match(new RegExp('^const '+name+' = (\\[[\\s\\S]*?\\])(?:\\n|$)'))
  assert.ok(match,name)
  return JSON.parse(match[1].replaceAll("'",'"').replace(/,\s*\]/gu,']'))
}
const basePriceSource=before(priceSource)
const locations=arrayLiteral(basePriceSource,'gpointLocations')
const gpointIds=locations.map(([slug])=>'sofia-gpoint-'+slug).sort()
const authorizedIds=[...gpointIds,...twoIds].sort()

test('bounded fresh revalidation authorizes exactly six existing source/receipt/cache paths, never new production files or old scope/baseline changes',async()=>{
  assert.deepEqual(Object.keys(CATALOGUE_REVALIDATION_HASHES),[aliasSource,educationSource,educationIdentities,priceIdentities,priceSource,cacheSource])
  for(const [path,hash] of Object.entries(CATALOGUE_REVALIDATION_HASHES)){
    assert.equal(sha256(await read(path)),hash,path+': subsequent changes require separate source review')
    assert.equal(catalogueRevalidationAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path)),true,path)
  }
  for(const path of ['tests/discovery-refinement-20261122-scope.mjs','tests/next-security-upgrade-scope.mjs','tests/stationary-discovery-scope.mjs','tests/public-action-scope.mjs','tests/public-english-scope.mjs','tests/services-price-cards-scope.mjs'])assert.equal(await read(path),before(path),path+': historical authorization remains byte-identical')
  for(const path of ['lib/discovery/catalogue-policy.mjs','scripts/check-catalogue-pricing.mjs','scripts/check-specific-service-photos.mjs','lib/discovery/sofia-catalogue.mjs','components/discovery-business-card.js','components/public-service-menu.js','lib/discovery/rail.mjs','components/discovery-search.js','app/api/public/discovery/route.js','package.json','next.config.mjs','public/category-art/sports.webp'])assert.equal(catalogueRevalidationAllowsFileChange(path),false,path)
})

test('every other production byte and path stays frozen, including images, UI, search, booking, analytics, security and config',async()=>{
  const frozen=tree.filter(record=>!catalogueRevalidationAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path)&&!sportsMobilePhotoFitAllowsFileChange(record.path))
  for(let offset=0;offset<frozen.length;offset+=32)await Promise.all(frozen.slice(offset,offset+32).map(async record=>{
    const path=new URL('../'+record.path,import.meta.url),bytes=record.mode==='120000'?Buffer.from(await readlink(path)):await readFile(path)
    assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),record.oid,record.path+' remains unchanged from '+CATALOGUE_REVALIDATION_BASE)
  }))
  const actual=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(path=>path&&!nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path)&&!priority30ReportAllowsNewFile(path)&&!regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path))&&productionPath(path))
  assert.deepEqual([...new Set(actual)].sort(),tree.map(record=>record.path).sort(),'no source, image, integration or runtime path is added')
  for(const line of git('ls-tree','-r','--name-only',CATALOGUE_REVALIDATION_BASE,'--','docs/catalogue-pricing').trim().split('\n').filter(Boolean))assert.equal(await read(line),before(line),line+': no historic report or price baseline is refreshed')
})

test('G Point canonicalization permits only its dated review narration and seven-day price metadata; every other chain and literal array is exact',async()=>{
  const source=await read(priceSource)
  const currentComment=section(source,'// Revalidated on 2026-11-22:','const gpointBooking')
  const oldComment=section(basePriceSource,'// Each of these 43 Sofia locations','const gpointBooking')
  let canonical=replaceOnce(source,currentComment,oldComment)
  canonical=replaceOnce(canonical,"const gpointCheckedOn = '2026-11-22', gpointValidUntil = '2026-11-29'\n",'')
  canonical=replaceOnce(canonical,"price: { unit: 'процедура', checkedOn: gpointCheckedOn, validUntil: gpointValidUntil }","price: { unit: 'процедура', validUntil: '2026-11-17' }")
  canonical=replaceOnce(canonical,'проверена на 22.11.2026.','проверена на 10.11.2026.')
  canonical=replaceOnce(canonical,"id: `sofia-gpoint-\${slug}`, checkedOn: gpointCheckedOn, website: 'https://gpoint.bg/'","id: `sofia-gpoint-\${slug}`, checkedOn, website: 'https://gpoint.bg/'")
  const currentNotes=section(canonical,'    notes: `Rendered owner booking menu version6.10.111','    services: [...gpointWomen')
  const oldNotes=section(basePriceSource,'    notes: `Rendered booking menu version6.10.91','    services: [...gpointWomen')
  canonical=replaceOnce(canonical,currentNotes,oldNotes)
  assert.equal(canonical,basePriceSource,'all other dates, helpers, chain tariffs and service inventories are frozen')
  for(const name of ['gpointLocations','gpointWomen','gpointMen'])assert.deepEqual(arrayLiteral(source,name),arrayLiteral(basePriceSource,name),name)
  assert.equal(source.match(/const gpointMaleIntimate = new Set\([^\n]+/u)[0],basePriceSource.match(/const gpointMaleIntimate = new Set\([^\n]+/u)[0])
})

test('the 43 selected G Point menus preserve all 1772 exact current EUR amounts, genders, units, branch-specific zones and absence of imported durations',()=>{
  assert.equal(gpointIds.length,43)
  const women=arrayLiteral(basePriceSource,'gpointWomen'),men=arrayLiteral(basePriceSource,'gpointMen')
  const maleSlugs=JSON.parse(basePriceSource.match(/const gpointMaleIntimate = new Set\((\[[^\n]+\])\)/u)[1].replaceAll("'",'"'))
  assert.equal(maleSlugs.length,9)
  const reviews=BOOKING_PRICE_REVIEWS.filter(row=>gpointIds.includes(row.id))
  assert.deepEqual(reviews.map(row=>row.id).sort(),gpointIds)
  let facts=0
  for(const review of reviews){
    const expected=[...women.map(([name,amount])=>['Лазерна епилация · '+name+' · жени',amount]),...men.map(([name,amount])=>['Лазерна епилация · '+name+' · мъже',amount]),...(maleSlugs.some(slug=>review.id==='sofia-gpoint-'+slug)?[['Лазерна епилация · Интим · мъже',30]]:[])]
    assert.equal(review.checkedOn,'2026-11-22')
    assert.match(review.notes,/version6\.10\.111[\s\S]*online booking/u)
    assert.deepEqual(review.services.map(service=>[service.name,service.price.amount]),expected,review.id)
    for(const service of review.services){
      assert.equal(service.price.currency,'EUR');assert.equal(service.price.kind,'fixed');assert.equal(service.price.unit,'процедура')
      assert.equal(service.price.checkedOn,'2026-11-22');assert.equal(service.price.validUntil,'2026-11-29')
      assert.equal(service.price.sourceUrl,'https://gpoint.bg/запазване-час')
      assert.match(service.description,/валидна САМО при онлайн записване/u)
      assert.equal(service.durationMin,undefined);assert.equal(service.durationCheckedOn,undefined)
    }
    facts+=expected.length
  }
  assert.equal(facts,1772)
})

test('the education intake changes only Svetlinki and ART Izba; its other 13 source records and receipts remain deeply identical',async()=>{
  const source=await read(educationSource),original=before(educationSource)
  let canonical=source
  for(const [start,end] of [['const svetlinki =','const ibl ='],['const artIzba =','const paintMe =']])canonical=replaceOnce(canonical,section(canonical,start,end),section(original,start,end))
  assert.equal(canonical,original)
  const old=(await import('data:text/javascript;base64,'+Buffer.from(original).toString('base64'))).default
  assert.equal(old.records.length,15);assert.equal(education.records.length,15)
  assert.deepEqual(education.records.filter(row=>!twoIds.includes(row.id)),old.records.filter(row=>!twoIds.includes(row.id)))
  assert.deepEqual(education.reviews.filter(row=>!twoIds.includes(row.id)),old.reviews.filter(row=>!twoIds.includes(row.id)))
  const art=education.records.find(row=>row.id===twoIds[0]),svet=education.records.find(row=>row.id===twoIds[1])
  for(const row of [art,svet]){
    const previous=old.records.find(item=>item.id===row.id)
    for(const field of ['id','name','category','cityCode','neighborhood','address','phone','website','coordinates','locationKind'])assert.deepEqual(row[field],previous[field],row.id+':'+field)
    assert.equal(row.verification.checkedOn,'2026-11-22')
  }
  assert.equal(svet.verification.validUntil,'2026-11-29')
  assert.deepEqual(svet.services.map(row=>[row.name,row.price.amount,row.price.unit,row.durationMin]),old.records.find(row=>row.id===svet.id).services.map(row=>[row.name,row.price.amount,row.price.unit,row.durationMin]))
  for(const service of svet.services){assert.equal(service.price.checkedOn,'2026-11-22');assert.equal(service.price.validUntil,'2026-11-29');assert.equal(service.durationCheckedOn,'2026-11-22')}
  assert.equal(art.services.length,1);assert.equal(art.services[0].name,'Рисуване и вино „Планинско езеро“ · 26.11.2026')
  assert.equal(art.services[0].price.amount,28);assert.equal(art.services[0].price.currency,'EUR');assert.equal(art.services[0].price.kind,'fixed')
  assert.equal(art.services[0].price.checkedOn,'2026-11-22');assert.equal(art.services[0].price.validUntil,'2026-11-26');assert.equal(art.verification.validUntil,'2026-11-26')
  assert.equal(art.booking.url,'https://artizba.bg/produkt/016/')
  assert.match(art.services[0].price.unit,/участник.*26\.11\.2026.*18:45/u)
  assert.match(art.services[0].description,/15%[\s\S]*не е приспадната[\s\S]*6 души[\s\S]*48 ч/u)
  assert.equal(art.services[0].durationMin,undefined)
  assert.equal(SOFIA_CATALOGUE.length,1732)
  assert.equal(authorizedIds.length,45);assert.equal(SOFIA_CATALOGUE.filter(row=>authorizedIds.includes(row.id)).length,45)
  assert.equal(SOFIA_CATALOGUE.filter(row=>!authorizedIds.includes(row.id)).length,1687)
})

test('review fingerprints change only the 45 already-existing reviewed identities; keys cannot be added, removed or rebaselined',async()=>{
  for(const [path,expected] of [[priceIdentities,gpointIds],[educationIdentities,twoIds]]){
    const original=JSON.parse(before(path)),current=JSON.parse(await read(path))
    assert.deepEqual(Object.keys(current).sort(),Object.keys(original).sort(),path)
    const changed=Object.keys(current).filter(key=>current[key]!==original[key]).sort()
    assert.deepEqual(changed,[...expected].sort(),path)
    for(const key of changed)assert.match(current[key],/^[a-f0-9]{64}$/u)
  }
})

test('only one new exact ART service-name alias reuses the already-approved photograph; original media bytes and all other mappings stay frozen',async()=>{
  const line='  ["sofia-artizba-cherni-vrah33e","education","Рисуване и вино „Планинско езеро“ · 26.11.2026","sx-adult-acrylic-painting-wine"],\n'
  assert.equal(replaceOnce(await read(aliasSource),line,''),before(aliasSource))
  assert.match(before(aliasSource),/sofia-artizba-cherni-vrah33e.*Есенна кошница.*sx-adult-acrylic-painting-wine/u)
})

test('English presentation adds exactly one manually reviewed ART name, description and unit; original translations and snapshot/editorial metadata stay exact',async()=>{
  const original=JSON.parse(before(cacheSource)),current=JSON.parse(await read(cacheSource)),art=education.records.find(row=>row.id===twoIds[0]),service=art.services[0]
  const keys={names:service.name,descriptions:service.description,units:service.price.unit}
  for(const [field,key] of Object.entries(keys)){
    assert.deepEqual(Object.keys(current[field]).filter(name=>!Object.hasOwn(original[field],name)),[key],field)
    assert.ok(current[field][key].trim());assert.doesNotMatch(current[field][key],/[а-яѝ]|translation pending/iu)
    const copy={...current[field]};delete copy[key];assert.deepEqual(copy,original[field],field+': no old translation is overwritten or removed')
  }
  assert.equal(current.names[service.name],'Painting and wine “Mountain Lake” · 26.11.2026')
  assert.equal(current.units[service.price.unit],'participant · event on 26.11.2026 at 18:45')
  assert.match(current.descriptions[service.description],/15%[\s\S]*not deducted[\s\S]*6 people[\s\S]*48 hours/u)
  assert.deepEqual(current.contextual,original.contextual)
  const metadata=structuredClone(current.metadata),supplement=metadata.manualRevalidations
  delete metadata.manualRevalidations
  for(const field of ['names','descriptions','units'])metadata.counts[field]--
  assert.deepEqual(metadata,original.metadata,'original source fingerprints, review counts, provenance and snapshot claim are untouched')
  assert.equal(supplement.length,1);assert.equal(supplement[0].businessId,art.id);assert.equal(supplement[0].checkedOn,'2026-11-22')
  assert.equal(supplement[0].recordIdentity,JSON.parse(await read(educationIdentities))[art.id])
  assert.deepEqual(supplement[0].entriesAdded,{names:1,descriptions:1,units:1})
  assert.equal(supplement[0].certifiedHumanTranslation,false)
  const top={...current};for(const key of ['metadata','names','descriptions','units'])delete top[key]
  const oldTop={...original};for(const key of ['metadata','names','descriptions','units'])delete oldTop[key]
  assert.deepEqual(top,oldTop)
})
