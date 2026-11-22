import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createCustomerBookingsHandler, readCustomerBookingPresentationContext } from '../lib/customer-account.mjs'
import { createEnglishContentResolver } from '../lib/locale/public-content-resolver.mjs'
import { serviceDisplayName } from '../lib/locale/public-content.mjs'

const user={id:'10000000-0000-4000-8000-000000000001',email:'client@example.test',email_confirmed_at:'2026-11-22T10:00:00Z'}
const id=index=>`20000000-0000-4000-8000-${String(index).padStart(12,'0')}`
const request=query=>new Request(`https://www.gorez.co/api/customer/bookings${query||''}`)
const resolver=createEnglishContentResolver({names:{'Изпиляване':'Filing'},contextual:{other:{'Изпиляване':'Tooth preparation'}}})
const historyRow=index=>({id:id(index),status:'booked',cancellation_token:id(index+100),business:{name:'Partner',slug:'partner'},
  service:{name:'Изпиляване',price:35,currency:'EUR',duration_min:30},staff:{name:'Specialist'}})

function handler(overrides={}) {
  return createCustomerBookingsHandler({authenticate:async()=>user,allowAttempt:async()=>true,authorizeEmail:async()=>true,list:async()=>[],...overrides})
}

test('actual legacy account DTO gains only exact authorized appointment category context before English presentation',async()=>{
  const rows=[historyRow(1),historyRow(2)],before=structuredClone(rows)
  const get=handler({list:async()=>rows,readPresentationContext:async visible=>{
    assert.deepEqual(visible,rows)
    return [{id:id(1),service:{category:'other',name:'DO NOT COPY',price:999},business:{industry:'other',owner_id:'PRIVATE'}},
      {id:id(2),service:{category:'nails'}}, {id:id(99),service:{category:'auto_repair'}}]
  },presentBooking:resolver.booking})
  const response=await get(request()),body=await response.json()
  assert.equal(response.status,200)
  assert.equal(serviceDisplayName(body.bookings[0].service,'en'),'Tooth preparation')
  assert.equal(serviceDisplayName(body.bookings[1].service,'en'),'Filing')
  assert.deepEqual(body.bookings.map(row=>[row.id,row.service.name,row.service.price,row.service.currency,row.cancellation_token]),
    rows.map(row=>[row.id,row.service.name,row.service.price,row.service.currency,row.cancellation_token]))
  assert.equal(body.bookings[0].business.industry,'other')
  assert.doesNotMatch(JSON.stringify(body),/PRIVATE|DO NOT COPY|999|owner_id/u)
  assert.deepEqual(rows,before,'source booking rows stay untouched')
})

test('history context is requested only after Auth, email proof, query validation, rate limit and authorized history read',async()=>{
  let reads=0
  const context=async()=>{reads++;return []}
  for(const overrides of [
    {authenticate:async()=>null},
    {authenticate:async()=>({...user,email_confirmed_at:null})},
    {allowAttempt:async()=>false},
    {authorizeEmail:async()=>false},
    {list:async()=>{throw Error('unavailable')}},
  ])await handler({readPresentationContext:context,...overrides})(request())
  await handler({readPresentationContext:context})(request('?accountId=someone-else'))
  assert.equal(reads,0)
  const order=[]
  await handler({list:async()=>{order.push('authorized-history');return [historyRow(1)]},readPresentationContext:async()=>{order.push('context');return []}})(request())
  assert.deepEqual(order,['authorized-history','context'])
})

test('public context query is one bounded read of the first 20 already-authorized appointment IDs, never full profiles or names',async()=>{
  const rows=Array.from({length:21},(_,index)=>historyRow(index+1)),calls=[]
  const query={select(fields){calls.push(['select',fields]);return this},in(field,values){calls.push(['in',field,values]);return this},limit(value){calls.push(['limit',value]);return Promise.resolve({data:[{id:id(1),service:{category:'other'}}],error:null})}}
  const db={from(table){calls.push(['from',table]);return query}}
  const result=await readCustomerBookingPresentationContext(db,rows)
  assert.equal(result[0].service.category,'other')
  assert.deepEqual(calls,[['from','appointments'],['select','id,service:services(category),business:businesses(industry)'],
    ['in','id',rows.slice(0,20).map(row=>row.id)],['limit',20]])
  calls.length=0
  assert.deepEqual(await readCustomerBookingPresentationContext(db,[{id:'invalid'}, {id:1}]),[])
  assert.equal(calls.length,0)
})

test('translation context failures do not break history, change prices or consume its pagination sentinel',async()=>{
  const rows=Array.from({length:21},(_,index)=>historyRow(index+1))
  const get=handler({list:async()=>rows,readPresentationContext:async visible=>{
    assert.equal(visible.length,20)
    assert.equal(visible.at(-1).id,id(20))
    throw Error('optional translation read unavailable')
  }})
  const response=await get(request()),body=await response.json()
  assert.equal(response.status,200)
  assert.equal(body.hasMore,true)
  assert.equal(body.bookings.length,20)
  assert.equal(body.bookings[0].service.price,35)
  assert.equal(body.bookings[0].service.name,'Изпиляване')
  assert.match(response.headers.get('cache-control'),/private, no-store/u)
  await assert.rejects(readCustomerBookingPresentationContext({from:()=>({select(){return this},in(){return this},limit:async()=>({error:Error('unavailable')})})},rows),/unavailable/u)
})

test('token appointment read retains existing service category and industry, without widening customer or write fields',async()=>{
  const source=await readFile(new URL('../app/api/public/appointments/[token]/route.js',import.meta.url),'utf8')
  assert.match(source,/service:services\(name,category,duration_min,price,currency\)/u)
  assert.match(source,/business:businesses\(name,slug,phone,address,city_ekatte,city,neighborhood,industry,timezone/u)
  assert.match(source,/customer:customers\(name,email,phone\)/u)
  assert.match(source,/\.update\(\{ status: 'cancelled', cancelled_at: cancelledAt, updated_at: cancelledAt \}\)/u)
  assert.match(source,/presentPublicBooking\(appointment\)/u)
})
