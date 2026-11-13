import test from 'node:test'
import assert from 'node:assert/strict'
import approvedLocations from '../public/catalogue-official-address-points-20261113.json' with { type: 'json' }
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261111_RECORDS as sourceRecords, NEIGHBORHOOD_20261111_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now=Date.parse('2026-11-11T12:00:00Z')
const ids=[
  'sofia-musicroom-hristo-botev129','sofia-dreamers-balgarska-morava94a',
  'sofia-lingua-lux-pirotska20','sofia-educenter-marin-drinov1',
  'sofia-be-alarm-systems-ovcha-kupel','sofia-smart-repair-samokovsko151',
  'sofia-lash-vegas-bulgaria53',
]
const get=id=>{const row=SOFIA_CATALOGUE.find(row=>row.id===id);assert.ok(row,id);return row}
const amounts=row=>row.services.map(service=>service.price.amount)
const sources=new Map(sourceRecords.map(row=>[row.id,row]))
const approvedPoints=new Map(approvedLocations.points.map(row=>[row.id,row]))
const officialRns=Object.freeze({
  'sofia-musicroom-hristo-botev129':'50038',
  'sofia-dreamers-balgarska-morava94a':'108403',
  'sofia-lingua-lux-pirotska20':'46889',
  'sofia-educenter-marin-drinov1':'43795',
  'sofia-be-alarm-systems-ovcha-kupel':'38926',
  'sofia-lash-vegas-bulgaria53':'97874',
})
const assertReviewedCoordinates=row=>{
  const original=sources.get(row.id),expected=approvedPoints.get(row.id),rn=officialRns[row.id]
  assert.ok(original,row.id)
  assert.equal(original.coordinates,null,'raw owner records must not acquire inferred points')
  assert.equal(Boolean(expected),rn!==undefined,'only the explicitly reviewed batch subset may become located')
  if(rn===undefined)assert.equal(row.coordinates,null,row.id)
  else{
    assert.deepEqual(row.coordinates,expected.coordinates,row.id)
    assert.equal(expected.officialAddress.rn,rn,row.id)
    assert.deepEqual(row.coordinates,{...expected.coordinates,method:'verified_official_address',source:OFFICIAL_SOFIA_SOURCE_URL,
      sourceAddress:row.address,sourceCityCode:row.cityCode,sourceNeighborhood:row.neighborhood,sourceWebsite:row.website,
      addressId:rn,checkedOn:'2026-11-13',licence:'CC-BY-4.0',attribution:OFFICIAL_SOFIA_ATTRIBUTION},row.id)
    assert.equal(expected.previousCoordinates,null,row.id)
  }
  assert.deepEqual(row.services,original.services,'location review must not change literal service or price facts')
  assert.deepEqual(row.booking,original.booking,'location review must not change booking destinations')
}

test('batch322 adds seven independently reviewed actual premises of seven operators and63 literal fees',()=>{
  const rows=ids.map(get)
  assert.equal(new Set(rows.map(row=>new URL(row.website).hostname.replace(/^www\./,''))).size,7)
  assert.deepEqual(rows.map(row=>row.services.length),[6,25,2,1,2,8,19])
  assert.equal(rows.reduce((n,row)=>n+row.services.length,0),63)
  for(const row of rows){
    assert.equal(SOFIA_CATALOGUE.filter(other=>other.id===row.id).length,1)
    assert.equal(row.locationKind,'premises')
    assert.ok(approvedCatalogueRecord(row,now))
    assert.equal(assessPricingReview(row,reviews.find(review=>review.id===row.id),now).state,'reviewed')
    assert.equal(new Set(row.services.map(service=>service.name)).size,row.services.length)
    assert.ok(row.services.every(service=>service.price.currency==='EUR'&&service.price.checkedOn==='2026-11-11'))
  }
})

test('only exact approved municipal points replace raw unknowns; directions retain each actual postal address',()=>{
  assert.deepEqual(ids.filter(id=>approvedPoints.has(id)).sort(),Object.keys(officialRns).sort())
  for(const row of ids.map(get)){
    assertReviewedCoordinates(row)
    const url=new URL(businessMapsDirectionsUrl(row))
    assert.ok(url.searchParams.get('destination').startsWith(row.address))
    assert.equal(url.searchParams.has('origin'),false)
  }
  assert.equal(get(ids[1]).neighborhood,'Зона Б-18')
  assert.equal(get(ids[4]).neighborhood,'Овча купел')
  for(const id of [ids[0],ids[2],ids[3],ids[5],ids[6]])assert.equal(get(id).neighborhood,null)
})

test('MusicRoom keeps live30EUR singles distinct from whole110/210EUR four/eight-lesson monthly packages',()=>{
  const row=get(ids[0])
  assert.deepEqual(amounts(row),[30,30,110,210,110,210])
  assert.deepEqual(row.services.slice(0,2).map(service=>service.durationMin),[50,50])
  assert.ok(row.services.slice(2).every(service=>!service.durationMin&&/30 дни/.test(service.price.unit)&&/не за едно посещение/.test(service.description)))
  assert.ok(!amounts(row).some(amount=>[22,27.5,26.25].includes(amount)))
  assert.equal(row.booking.phone,'+359884214849')
})

test('Dreamers retains25 current individual hourly fees, prepayment and24hour cancellation, not expired group cohorts',()=>{
  const row=get(ids[1])
  assert.deepEqual(amounts(row),[19,22,22,27,22,27,27,27,27,30,27,42,30,30,27,25,25,25,25,27,27,25,25,27,25])
  assert.ok(row.services.every(service=>!service.durationMin&&/24 часа/.test(service.description)&&/предварително заплащане/.test(service.price.unit)))
  assert.ok(!row.services.some(service=>/Свят и личност|групов|720|500|2025/.test(JSON.stringify(service))))
  assert.ok(row.services.find(service=>service.name.includes('Психология')).name.includes('учебен предмет'),'not a mental-health practitioner listing')
  assert.deepEqual(row.booking,{kind:'form',url:'https://privateschooldreamers.com/contact-us/'})
  assert.ok(!SOFIA_CATALOGUE.some(other=>other.id==='sofia-dreamers-balgarska-morava115'))
})

test('LinguaLux17EUR academic units preserve both minimums and do not advertise a45minute standalone appointment',()=>{
  const row=get(ids[2])
  assert.deepEqual(amounts(row),[17,17])
  for(const service of row.services){
    assert.equal(service.durationMin,undefined)
    assert.match(service.price.unit,/45 мин.*минимум 2.*10 предплатени/)
    assert.match(service.description,/два учебни часа.*10 предплатени.*един месец/)
    assert.match(service.description,/12 часа/)
  }
  assert.equal(row.booking.phone,'+359887704479')
})

test('Educenter paid33EUR individual course request is not a free assessment, animated counter or started group course',()=>{
  const row=get(ids[3])
  assert.deepEqual(amounts(row),[33])
  assert.equal(row.services[0].durationMin,undefined)
  assert.match(row.services[0].price.unit,/учебен час.*график по запитване/)
  assert.match(row.address,/Марин Дринов 1, партер, ап. 1/)
  assert.deepEqual(row.booking,{kind:'form',url:'https://educenter.bg/kontakti'})
})

test('alarm installations retainFROM47/62EUR and only the explicitly fixed DRL duration',()=>{
  const row=get(ids[4])
  assert.deepEqual(amounts(row),[47,62])
  assert.ok(row.services.every(service=>service.price.kind==='from'))
  assert.equal(row.services[0].durationMin,60)
  assert.equal(row.services[1].durationMin,undefined)
  assert.match(row.services[1].description,/1–2 часа/)
  assert.equal(row.booking.phone,'+359876114470')
})

test('SmartRepair wheel-face rates are FROM per one wheel EXVAT with inspection, deductible deposit and no-show conditions',()=>{
  const row=get(ids[5])
  assert.deepEqual(amounts(row),[102,120,140,160,180,200,225,255])
  for(const service of row.services){
    assert.equal(service.price.kind,'from')
    assert.equal(service.price.unit,'на джанта · лице · без ДДС')
    assert.match(service.description,/оглед.*индивидуална оферта.*депозит 50 € на джанта.*приспадан.*неявяване не се възстановява/)
    assert.equal(service.durationMin,undefined)
  }
  assert.ok(!row.services.some(service=>/TPMS|смяна на гуми|Versante/i.test(service.name)))
  assert.match(row.address,/Самоковско шосе 151/)
  assert.equal(row.booking.kind,'phone','unreviewed external calendar does not become fabricated native availability')
})

test('LashVegas actual placement/maintenance prices are literal, duplicated brown style is collapsed and accent is an addon',()=>{
  const row=get(ids[6])
  assert.equal(row.services.length,19)
  assert.deepEqual(amounts(row).slice(0,18),Array.from({length:9},()=>[61.36,35.75]).flat())
  const placement=row.services.filter(service=>service.name.endsWith('· поставяне'))
  const maintenance=row.services.filter(service=>service.name.endsWith('· поддръжка'))
  assert.equal(placement.length,9);assert.equal(maintenance.length,9)
  assert.ok(placement.every(service=>/10%/.test(service.description)))
  assert.ok(maintenance.every(service=>/не първоначално/.test(service.description)))
  assert.equal(row.services.at(-1).price.amount,5.11)
  assert.match(row.services.at(-1).price.unit,/добавка.*не самостоятелно/)
  assert.ok(row.services.every(service=>!service.durationMin&&!/лазер|EMS|микроигл|инжекц/iu.test(service.name)))
  assert.equal(row.booking.phone,'+359877878185')
})

test('only source-stated contact opening hours are added; they are not staff availability or unproven schedules',()=>{
  const smart=get(ids[5]),lash=get(ids[6])
  assert.deepEqual(smart.openingHours.days.map(day=>day.periods.length),[1,1,1,1,1,0,0])
  assert.deepEqual(lash.openingHours.days.map(day=>day.periods.length),[1,1,1,1,1,1,0])
  assert.deepEqual(smart.openingHours.days[0].periods,[{open:'09:00',close:'18:00'}])
  assert.deepEqual(lash.openingHours.days[0].periods,[{open:'09:00',close:'20:00'}])
  for(const id of ids.slice(0,5))assert.equal(get(id).openingHours,undefined)
})
