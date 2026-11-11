import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { BOOKING_PRICE_REVIEWS } from '../lib/discovery/catalogue-data/pricing-booking-review-v1.mjs'
import { PRICING_EXPANSION_RECORDS, PRICING_EXPANSION_REVIEWS } from '../lib/discovery/catalogue-data/pricing-expansion-20261110.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'

const now=Date.parse('2026-11-10T12:00:00Z')
const record=id=>SOFIA_CATALOGUE.find(row=>row.id===id)
const menu=(id,name)=>record(id).services.find(row=>row.name===name)

test('every new local business has priced appointment evidence and an inventory-bound review',()=>{
 const ids=new Set()
 for(const raw of PRICING_EXPANSION_RECORDS){
  assert.ok(!ids.has(raw.id),raw.id); ids.add(raw.id)
  const row=record(raw.id),receipt=BOOKING_PRICE_REVIEWS.find(item=>item.id===raw.id)
  assert.ok(row,raw.id)
  assert.ok(row.services.some(item=>item.price),raw.id)
  assert.equal(assessPricingReview(row,receipt,now).state,'reviewed',raw.id)
  assert.equal(row.verification.checkedOn,'2026-11-10',raw.id)
  assert.equal(row.gorezBusinessId,undefined,'A catalogue addition is not a claimed GoRez partner')
  if(row.locationKind==='service_area') assert.equal(row.coordinates,null)
 }
 assert.ok(PRICING_EXPANSION_REVIEWS.length>=PRICING_EXPANSION_RECORDS.length)
})

test('Inspire prices stay branch-specific, including from and fixed distinctions',()=>{
 const haircut=id=>menu(`sofia-inspire-${id}`,'Мъжко подстригване и стайлинг')
 assert.equal(haircut('manastirski-livadi').price.amount,30)
 assert.equal(haircut('manastirski-livadi').price.kind,'from')
 assert.equal(haircut('studentski-grad').price.amount,5)
 assert.equal(haircut('paradise').price.amount,18)
 assert.equal(menu('sofia-inspire-business-park','Маникюр с гел лак със сваляне').price.amount,36)
 assert.equal(menu('sofia-inspire-mladost-1','Маникюр с гел лак със сваляне').price.amount,24)
 assert.equal(menu('sofia-inspire-mladost-1','Маникюр с гел лак със сваляне').price.kind,'fixed')
})

test('The One prices identify the reviewed specialist rather than advertising a chain-wide minimum',()=>{
 const hair=menu('sofia-the-one-deluxe','Подстригване · Алекс')
 assert.equal(hair.price.amount,13)
 assert.match(hair.description,/само при Алекс/)
 assert.equal(menu('sofia-the-one-private','Подстригване · Teodor').price.amount,25)
 assert.equal(menu('sofia-the-one-nails-hair','Изграждане · Adelina').price.maximum,80)
 assert.equal(menu('sofia-the-one-private','Оформяне на вежди · Teodor').durationMin,undefined)
})

test('new sport locations keep total packages and do not copy group yoga into a reformer-only studio',()=>{
 const fit=record('sofia-yoga-vibe-fit-lozenets')
 assert.ok(fit.services.every(item=>/реформър/iu.test(item.name)))
 assert.equal(menu(fit.id,'Пилатес реформър за двама').price.unit,'двама')
 assert.equal(menu(fit.id,'Пилатес реформър · карта 24 посещения').price.amount,615)
 assert.equal(menu('sofia-yoga-aradhana','Абонамент за курс · 8 занимания').price.amount,70)
 assert.equal(menu('sofia-yoga-aradhana','Абонамент за курс · 8 занимания').price.unit,'курс')
 assert.equal(menu('sofia-salt-art-centre','Йога · еднократно посещение').price.amount,12)
 assert.equal(menu('sofia-salt-art-centre','Индивидуална йога · двама').price.unit,'двама')
})

test('excluded general clinics retain sourced markers and fees without appearing in nearby discovery',()=>{
 const row=record('sofia-medconvex-lavski-rid')
 const results=normalizeCatalogueBusinesses([row],{cityCode:'68134',category:'health',browse:true,searchV2:true,coordinates:row.coordinates,radiusKm:2},{now})
 assert.deepEqual(results,[])
 assert.equal(menu(row.id,'Кардиолог · първичен преглед').price.amount,40)
 assert.equal(menu(row.id,'Кардиолог доцент · първичен преглед').price.amount,70)
 assert.equal(menu('sofia-lyves-clinic-flora','Специализиран лимфологичен преглед · без боди-анализ').price.amount,95)
 assert.equal(menu('sofia-lyves-clinic-flora','Специализиран лимфологичен преглед · с боди-анализ').price.amount,120)
 assert.equal(menu('sofia-mg-art-beauty','Мъжко подстригване').price.currency,'BGN')
})

test('CUT branch menus keep actual amounts and durations and preserve safe phone fallback',()=>{
 const ml='sofia-cut-barber-manastirski-livadi',south='sofia-cut-barber-yuzhen-park'
 assert.equal(menu(ml,'Подстригване и оформяне на вежди').price.amount,23)
 assert.equal(menu(south,'Подстригване и оформяне на вежди').price.amount,20)
 assert.equal(menu(ml,'Мъжко подстригване').durationMin,40)
 assert.equal(menu(south,'Мъжко подстригване').durationMin,30)
 assert.equal(record(ml).booking.kind,'phone','Hash-routed forms do not relax the direct-URL security policy')
 assert.equal(record(ml).coordinates,null,'An address-search link is not an exact marker')
})

test('Belami branch-only treatments never inherit a generic chain teaser price',()=>{
 assert.equal(menu('sofia-belami-westmall','Оформяне на вежди').price.amount,9.71)
 assert.equal(menu('sofia-belami-park-center','Оформяне на вежди').price,undefined)
 assert.equal(menu('sofia-belami-park-center','Сешоар · къса коса').price.amount,11.5)
 assert.equal(menu('sofia-belami-westmall','Гел върху естествени нокти').durationMin,119)
 const receipts=BOOKING_PRICE_REVIEWS.map(row=>row.id)
 assert.equal(new Set(receipts).size,receipts.length,'A later review replaces an earlier receipt rather than doubling imports')
})
