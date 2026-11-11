import test from 'node:test'
import assert from 'node:assert/strict'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261111_REVIEWS as reviews } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { assessPricingReview } from '../lib/discovery/catalogue-pricing-review.mjs'
import { businessMapsDirectionsUrl } from '../lib/business-directions.mjs'

const now=Date.parse('2026-11-11T12:00:00Z')
const ids=[
  'sofia-tsvety-bita-stamboliyski84','sofia-studio-blondie-svetlostruy',
  'sofia-esprit-wellbeing-aleksandar-malinov','sofia-spa-maat-kostenski-vodopad',
  'sofia-the-wellness-hristo-belchev','sofia-pro-language-lyulin3',
  'sofia-forum-language-pliska','sofia-espace-druzhba2',
  'sofia-lili-muzic-louis-ayer159','sofia-lili-muzic-sharl-shampo1',
  'sofia-ability-ivan-vazov-bulgarian','sofia-poliglot-stefan-karadzha7',
  'sofia-eid-service-iliantsi94','sofia-sofia-auto-gas-star-lozenski35',
]
const get=id=>{const row=SOFIA_CATALOGUE.find(row=>row.id===id);assert.ok(row,id);return row}
const amounts=row=>row.services.map(service=>service.price.amount)

test('batch315 contains14 real premises of13 owner hosts with90 dated literal price facts',()=>{
  const rows=ids.map(get)
  assert.equal(new Set(rows.map(row=>row.id)).size,14)
  assert.equal(new Set(rows.map(row=>new URL(row.website).hostname.replace(/^www\./,''))).size,13)
  assert.equal(rows.reduce((n,row)=>n+row.services.length,0),90)
  for(const row of rows){
    assert.equal(row.locationKind,'premises')
    assert.ok(approvedCatalogueRecord(row,now),row.id)
    assert.equal(assessPricingReview(row,reviews.find(review=>review.id===row.id),now).state,'reviewed',row.id)
    assert.ok(row.services.every(service=>service.price.currency==='EUR'&&service.price.checkedOn==='2026-11-11'))
    assert.equal(new Set(row.services.map(service=>service.name)).size,row.services.length,'duration and staff variants stay distinct')
    assert.equal(SOFIA_CATALOGUE.filter(record=>record.id===row.id).length,1)
    assert.ok(!/ареол|скалп|хиропракт|лечебен|клиник/iu.test(row.services.map(service=>service.name).join(' ')))
  }
})

test('all14 directions use the exact actual postal address; only labelled owner GPS is retained',()=>{
  for(const row of ids.map(get)){
    const url=new URL(businessMapsDirectionsUrl(row))
    assert.ok(url.searchParams.get('destination').startsWith(row.address),row.id)
    assert.equal(url.searchParams.has('origin'),false)
    if(row.id!=='sofia-sofia-auto-gas-star-lozenski35')assert.equal(row.coordinates,null)
  }
  const point=get(ids[13]).coordinates
  assert.deepEqual([point.latitude,point.longitude,point.method],[42.632047,23.439613,'first_party_coordinates'])
})

test('cosmetic permanent makeup excludes medical procedures and preserves included corrections',()=>{
  const row=get(ids[0])
  assert.equal(row.category,'beauty')
  assert.deepEqual(amounts(row),[360,360,360,300,360,300,400,450,180,220,220])
  assert.ok(row.services.slice(0,3).every(service=>/корекция/.test(service.description)&&/три месеца/.test(service.description)))
  assert.ok(row.services.slice(3,8).every(service=>/не е посочено като включено/.test(service.description)))
  assert.ok(row.services.every(service=>!service.durationMin))
  assert.equal(row.booking.phone,'+359885767770')
})

test('Blondie uses the dedicated massage booking contact and six distinct duration variants',()=>{
  const row=get(ids[1])
  assert.equal(row.booking.phone,'+359879185596')
  assert.deepEqual(row.services.map(service=>[service.durationMin,service.price.amount]),[[60,50],[90,75],[30,30],[60,65],[60,60],[90,80]])
  assert.ok(row.services.every(service=>service.name.includes(`${service.durationMin} мин.`)))
})

test('Esprit full current PDF menu retains included consultation, VAT and cancellation condition',()=>{
  const row=get(ids[2])
  assert.deepEqual(amounts(row),[51,81,57,85,59,87,65,95,37,55,82,130,55,82,33,81,102])
  assert.deepEqual(row.services.map(service=>service.durationMin),[60,90,60,90,60,90,60,90,45,60,90,60,60,90,45,90,120])
  assert.ok(row.services.every(service=>/включена 5-минутна консултация/.test(service.description)&&/25 €/.test(service.description)&&/ДДС/.test(service.description)))
  assert.equal(row.booking.phone,'+35928070738')
  assert.match(row.services[11].name,/двама терапевти/)
  assert.equal(row.openingHours,undefined,'conflicting published treatment schedules are not guessed')
})

test('SPA Maat uses its current actual studio, not the old PDF filename address; Wellness keeps FROM',()=>{
  const maat=get(ids[3]),wellness=get(ids[4])
  assert.match(maat.address,/Костенски Водопад 59/)
  assert.equal(maat.neighborhood,'Гоце Делчев')
  assert.deepEqual(maat.services.map(service=>[service.price.amount,service.price.maximum]),[[45,47],[65,67],[88,undefined]])
  assert.ok(maat.services.every(service=>/2 часа/.test(service.description)))
  assert.equal(wellness.services[0].price.kind,'from')
  assert.deepEqual(wellness.services.map(service=>[service.durationMin,service.price.amount]),[[60,60],[30,40],[30,40]])
  assert.equal(new URL(wellness.booking.url).pathname,'/baliyski-masazhi-sofia','business action opens actual chooser, not one wrong service calendar')
})

test('education packages are whole paid courses with explicit units and owner confirmation',()=>{
  const pro=get(ids[5]),forum=get(ids[6]),espace=get(ids[7])
  assert.deepEqual(amounts(pro),[225,425,625])
  assert.ok(pro.services.every(service=>!service.durationMin&&/пакет/.test(service.price.unit)&&/8 урока/.test(service.description)))
  assert.deepEqual(amounts(forum),[180])
  assert.match(forum.services[0].price.unit,/10 учебни часа.*отделно/)
  assert.deepEqual(amounts(espace),[600,700,500])
  assert.ok(espace.services.every(service=>/след началото|Късно записване/iu.test(service.description)))
  assert.ok(espace.services.every(service=>/събеседване/.test(service.description)&&/тест/.test(service.description)&&!service.durationMin))
})

test('two actual Lili studios share only a tariff explicitly naming both and preserve module/staff conditions',()=>{
  const first=get(ids[8]),second=get(ids[9])
  assert.notEqual(first.address,second.address)
  assert.equal(first.neighborhood,'Манастирски ливади')
  assert.equal(second.neighborhood,'Манастирски ливади')
  assert.equal(first.phone,second.phone)
  assert.deepEqual(first.services,second.services)
  assert.deepEqual(amounts(first),[31,30,29,43,25,24,34,18,17,26])
  assert.deepEqual(first.services.map(service=>service.durationMin),[50,50,50,50,40,40,40,30,30,30])
  assert.ok(first.services.every(service=>/един урок/.test(service.price.unit)&&/без пакетна/.test(service.price.unit)&&/1 ден/.test(service.description)))
  assert.equal(first.services.filter(service=>/с Лили Ватева/.test(service.name)).length,3)
})

test('Ability and Poliglot do not convert academic-hour courses into visit prices',()=>{
  const ability=get(ids[10]),poliglot=get(ids[11])
  assert.deepEqual(amounts(ability),[15,280,330,330])
  assert.equal(ability.services[0].durationMin,60)
  assert.ok(ability.services.slice(1).every(service=>!service.durationMin&&/цял курс/.test(service.price.unit)))
  assert.deepEqual(amounts(poliglot),[152.87,168.72,184.06,199.4,230.08,281.21,255.13])
  assert.ok(poliglot.services.every(service=>!service.durationMin&&/с ДДС/.test(service.price.unit)&&/половината/.test(service.description)))
})

test('repair tariff conflicts are omitted and labour-only/from/VAT/parts qualifications retained',()=>{
  const eid=get(ids[12]),gas=get(ids[13])
  assert.deepEqual(amounts(eid),[25.56,25.56])
  assert.ok(eid.services.every(service=>service.price.kind==='from'))
  assert.equal(eid.booking.url,'https://www.eidservice2025.com/services-1-1')
  assert.deepEqual(amounts(gas),[25,25,30,20,40,40,40,200,250,500])
  assert.ok(gas.services.every(service=>/ДДС/.test(service.description)&&/отделно|допълнително/.test(service.description)&&/15%/.test(service.description)))
  assert.deepEqual(gas.services.slice(-2).map(service=>service.price.kind),['from','from'])
  assert.equal(gas.services.some(service=>/фреон|съединител/iu.test(service.name)),false)
})
