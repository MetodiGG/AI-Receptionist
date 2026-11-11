import test from 'node:test'
import assert from 'node:assert/strict'
import education from '../lib/discovery/catalogue-data/neighborhood-education-owned34-20261111.mjs'
import auto from '../lib/discovery/catalogue-data/neighborhood-auto-owned35-20261111.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261111_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'

const now=Date.parse('2026-11-11T12:00:00Z')
const rows=[...education.records,...auto.records]
const amounts=row=>row.services.map(service=>service.price.amount)

test('batch327 imports only five approved distinct premises and28 source-qualified fees, not held drafts',()=>{
  assert.deepEqual(rows.map(row=>row.id),[
    'sofia-guitarzone-general-gurko27','sofia-flying-fingers-pirotska45',
    'sofia-risuvateli-oborishte73','sofia-grade-up-neofit-rilski60',
    'sofia-alpha-detailing-batareya55b',
  ])
  assert.deepEqual(rows.map(row=>row.services.length),[3,6,2,15,2])
  assert.equal(rows.reduce((n,row)=>n+row.services.length,0),28)
  assert.equal(new Set(rows.map(row=>new URL(row.website).hostname.replace(/^www\./,''))).size,5)
  for(const row of rows){
    assert.equal(SOFIA_CATALOGUE.filter(other=>other.id===row.id).length,1)
    assert.ok(approvedCatalogueRecord(row,now))
    assert.equal(assessPricingReview(row,reviews.find(review=>review.id===row.id),now).state,'reviewed')
    assert.ok(row.services.every(service=>service.price.currency==='EUR'&&service.price.checkedOn==='2026-11-11'))
    assert.equal(new Set(row.services.map(service=>service.name)).size,row.services.length)
  }
})

test('actual full postal addresses are used without guessed GPS, neighborhood labels or live schedules',()=>{
  for(const row of rows){
    assert.equal(row.locationKind,'premises')
    assert.equal(row.coordinates,null)
    assert.equal(row.neighborhood,null)
    assert.equal(row.openingHours,undefined)
    const url=new URL(businessMapsDirectionsUrl(row))
    assert.ok(url.searchParams.get('destination').startsWith(row.address))
    assert.equal(url.searchParams.has('origin'),false)
  }
})

test('GuitarZone literalEUR totals and50minute single lesson are not inferred from inconsistent BGN side amounts',()=>{
  const row=rows[0]
  assert.deepEqual(amounts(row),[30,150,300])
  assert.equal(row.services[0].durationMin,50)
  assert.ok(row.services.slice(1).every(service=>!service.durationMin&&/пакет/.test(service.price.unit)))
  assert.match(row.services[0].description,/пълно или авансово плащане.*един ден/)
  assert.equal(row.booking.phone,'+359898918664')
})

test('FlyingFingers regular, firsttrial and wholefiveweek packages remain distinct and use the actualguitar/solfege phone',()=>{
  const row=rows[1]
  assert.deepEqual(amounts(row),[20,20,80,80,10,10])
  assert.deepEqual(row.services.filter(service=>service.durationMin).map(service=>service.durationMin),[60,60,60,60])
  assert.ok(row.services.slice(2,4).every(service=>!service.durationMin&&/5 седмици/.test(service.price.unit)))
  assert.ok(row.services.slice(4).every(service=>/само първи пробен/.test(service.price.unit)&&/не за редовните/.test(service.description)))
  assert.match(row.services[0].description,/2,50 € на урок/)
  assert.ok(row.services.every(service=>/24 часа/.test(service.description)))
  assert.ok(row.services.every(service=>!/цигулка|виола/.test(service.name)))
  assert.equal(row.booking.phone,'+359884969494')
})

test('Risuvateli children lessons preserve group size, owned materials, exact duration and wholemonthlypackage',()=>{
  const row=rows[2]
  assert.deepEqual(amounts(row),[20,55])
  assert.ok(row.services.every(service=>service.appointmentModel==='group_reservation'))
  assert.ok(row.services.every(service=>/6–12 деца/.test(service.description)&&/скицник и акварелни бои/.test(service.description)))
  assert.equal(row.services[0].durationMin,120)
  assert.equal(row.services[1].durationMin,undefined)
  assert.match(row.services[1].price.unit,/4 × 2 астрономически часа/)
  assert.equal(row.booking.phone,'+359889324301')
})

test('GradeUp15fees preserve individualmonthlyminimum and distinguish perpersontwo-student tuition from wholepackage',()=>{
  const row=rows[3]
  assert.deepEqual(amounts(row),[40,55,144,280,200,380,25,90,170,35,130,240,45,170,320])
  assert.ok(row.services.slice(0,2).every(service=>/поне 1 месец/.test(service.price.unit)&&/24 часа/.test(service.description)))
  assert.ok(row.services.slice(2,6).every(service=>!service.durationMin&&/за 1 месец.*един ученик/.test(service.price.unit)))
  assert.ok(row.services.slice(6).every(service=>/на човек при двама/.test(service.price.unit)))
  assert.deepEqual([6,9,12].map(i=>row.services[i].durationMin),[60,90,120])
  assert.ok([7,8,10,11,13,14].every(i=>!row.services[i].durationMin&&/за 1 месец/.test(row.services[i].price.unit)))
  assert.ok(!row.services.some(service=>[70,260,500].includes(service.price.amount)),'ambiguous3academic=120min individual row is held, not normalized')
  assert.deepEqual(row.booking,{kind:'form',url:'https://gradeup.bg/zapisvane/'})
})

test('Alpha paid detailing remains quote-firstphonebooking, FROM30/180, with no fakefreecalendar or conflictingopeninghours',()=>{
  const row=rows[4]
  assert.deepEqual(amounts(row),[30,180])
  assert.ok(row.services.every(service=>service.price.kind==='from'&&!service.durationMin))
  assert.ok(row.services.every(service=>/размера и състоянието/.test(service.description)&&/безплатен оглед/.test(service.description)&&/10%/.test(service.description)))
  assert.equal(row.booking.kind,'phone')
  assert.equal(row.booking.phone,'+359883413538')
  assert.equal(row.openingHours,undefined)
  assert.equal(row.address,'София, ул. Батарея 55Б')
})
