import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as bookingMode from '../lib/booking-mode.mjs'
import { businessApplicationSchema,applicationRecord } from '../lib/business-application.mjs'
import { createBookingSettingsHandler } from '../lib/booking-settings.mjs'
import { verifyDiscoveryAvailability, normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { profileServicePrice } from '../lib/business-profile-ui.mjs'
import { DateTime } from 'luxon'
import * as bookingButtonContent from './helpers/booking-button-content.mjs'
const { safeBookingPhone,bookingAction,assertInternalBooking,isPhoneBooking,isOffsiteBooking,emptyOpeningHours }=bookingMode
const require=createRequire(import.meta.url),{loadBindings,transform}=require('next/dist/build/swc')
await loadBindings()
async function component(path,stubs={}) {
 const {code}=await transform(await readFile(new URL('../'+path,import.meta.url),'utf8'),{filename:path,jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}})
 const module={exports:{}};new Function('require','module','exports',code)(name=>name in stubs?stubs[name]:require(name),module,module.exports);return module.exports
}
const business={id:'phone-business',slug:'actual-phone-business',booking_mode:'phone',name:'Local fictional phone business',phone:'+359 (888) 123-456',services:[{id:'actual-service',name:'Published service',price:25,currency:'EUR',duration_min:30}],staff:[],workingHours:[]}
const input=()=>({business:{name:business.name,slug:business.slug,booking_mode:'phone',phone:business.phone,contact_email:'owner@example.com',address:'Local QA address 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',neighborhood:'',location_confirmed:true,public_profile:{latitude:42.665,longitude:23.286}},services:[{name:'Actual published price',price:20,currency:'BGN',price_details:{kind:'range',maximum:40},description:'Actual conditions'}],account:{email:'owner@example.com',password:'offline-example-only'},locale:'bg',consent:true,company:''})
const render=(Component,props)=>renderToStaticMarkup(React.createElement(Component,props))
const {OutboundBookingButton}=await component('components/outbound-booking-button.js',{'../lib/booking-mode.mjs':bookingMode,'./booking-button-content':bookingButtonContent})
const {BookingModeFields}=await component('components/booking-mode-fields.js',{'../lib/booking-mode.mjs':bookingMode})
test('safe phone links normalize permitted formatting only and never accept dial controls or arbitrary navigation',()=>{
 assert.equal(safeBookingPhone(business.phone),'tel:+359888123456');assert.equal(safeBookingPhone('0888 123 456'),'tel:0888123456')
 for(const value of ['+359888123456;ext=1','+359888123456,12','*1234567#','tel:0888123456','javascript:alert(1)','https://example.com','12345','+1234567890123456','1234567\n','12+34567',undefined,123456789])assert.equal(safeBookingPhone(value),null)
 assert.equal(isPhoneBooking(business),true);assert.equal(isOffsiteBooking(business),true);assert.equal(bookingAction(business).href,'tel:+359888123456');assert.equal(bookingAction({...business,phone:'*1234567#'}).href,null)
 assert.equal(bookingAction({slug:'old'}).href,'/book/old?lang=bg');assert.throws(()=>assertInternalBooking(business),e=>e.code==='PHONE_BOOKING');assert.throws(()=>assertInternalBooking({...business,booking_mode:'external'}),e=>e.code==='EXTERNAL_BOOKING');assert.doesNotThrow(()=>assertInternalBooking({}))
})
test('phone application preserves known prices/conditions and needs no invented staff, duration, internal hours or external destination',()=>{
 const parsed=businessApplicationSchema.parse(input()),record=applicationRecord(parsed)
 assert.deepEqual(record.staff,[]);assert.deepEqual(record.hours,[]);assert.deepEqual(record.business.opening_hours,emptyOpeningHours());assert.equal(record.services[0].price,20);assert.equal(record.services[0].currency,'BGN');assert.equal(record.services[0].duration_min,null);assert.deepEqual(record.services[0].price_details,{kind:'range',maximum:40});assert.equal(record.services[0].description,'Actual conditions')
 for(const patch of [{phone:''},{phone:'*1234567#'},{phone:'12+345678'},{booking_mode:'gorez'},{booking_mode:'external'}])assert.equal(businessApplicationSchema.safeParse({...input(),business:{...input().business,...patch}}).success,false)
})
test('registration exposes the exact bilingual choice and phone/external checkboxes are mutually exclusive',()=>{
 const bg=render(BookingModeFields,{mode:'phone',url:'',consent:false,onChange(){},locale:'bg'}),en=render(BookingModeFields,{mode:'phone',url:'',consent:false,onChange(){},locale:'en'})
 assert.match(bg,/Желая да получавам резервации само по телефонен номер/);assert.match(en,/I want to receive bookings only by phone/);assert.equal((bg.match(/checked=""/g)||[]).length,1);assert.doesNotMatch(bg,/type="url"/)
})
test('phone public booking action is one safe tel anchor, never a POST/form or fabricated confirmation; preview and bad numbers fail closed',()=>{
 const html=render(OutboundBookingButton,{business,locale:'bg'});assert.match(html,/href="tel:\+359888123456"/);assert.match(html,/Резервирай час/);assert.doesNotMatch(html,/<form|<button|method=|eventId|confirmed|потвърден/)
 for(const props of [{disabled:true},{business:{...business,phone:'javascript:alert(1)'}}]){const disabled=render(OutboundBookingButton,{business,...props});assert.match(disabled,/aria-disabled="true"/);assert.doesNotMatch(disabled,/<a\b|<form\b/)}
 assert.match(render(OutboundBookingButton,{business:{...business,booking_mode:'external'},locale:'bg'}),/<form[^>]+method="post"/)
})
test('phone partners never load native availability or claim verified available times',async()=>{
 const deps={getBusiness(){assert.fail('must not request native calendar')},getSlots(){assert.fail('must not calculate fictional slots')}}
 const rows=await verifyDiscoveryAvailability([{...business,source:'gorez'}],{date:'2026-11-13'},deps);assert.equal(rows[0].availability.status,'phone');assert.deepEqual(rows[0].availability.slots,[])
})
test('public discovery preserves the actual phone needed by both card and fetched-detail reserve actions',()=>{
 const row=normalizeInternalBusinesses([{...business,active:true,platform_status:'enabled',industry:'beauty',city_ekatte:'68134'}],{browse:true,searchV2:true,requirements:[]})[0]
 assert.ok(row);assert.equal(row.phone,business.phone);assert.equal(bookingAction(row).href,'tel:+359888123456')
 const unsafe=normalizeInternalBusinesses([{...business,phone:'*1234567#',active:true,platform_status:'enabled',industry:'beauty'}],{browse:true,searchV2:true,requirements:[]})[0]
 assert.equal(bookingAction(unsafe).href,null)
})
test('owner phone settings skip external destination checks but preserve auth/ownership/CSRF/revision and DB validation errors',async()=>{
 const user={id:'20000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-11-01'},id='10000000-0000-4000-8000-000000000001',v={mode:'phone',openingHours:emptyOpeningHours(),revision:3};let saved=[]
 const req=(patch={},origin='https://gorez.test')=>new Request('https://gorez.test/api/owner/booking-settings',{method:'PATCH',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({...v,...patch})})
 const deps={authenticate:async()=>user,authorize:async()=>true,allowAttempt:async()=>true,verifyDestination(){assert.fail('phone mode must never resolve website DNS')},save:async row=>saved.push(row)}
 assert.equal((await createBookingSettingsHandler(deps)(req(),id)).status,200);assert.equal(saved.length,1);assert.equal(saved[0].input.mode,'phone');assert.equal(saved[0].input.url,'')
 for(const [override,request,status] of [[{authenticate:async()=>null},req(),401],[{authorize:async()=>false},req(),403],[{},req({},'https://evil.invalid'),403],[{},req({phone:'1234567'}),422],[{save:async()=>{throw Error('BOOKING_PHONE_REQUIRED')}},req(),409]])assert.equal((await createBookingSettingsHandler({...deps,...override})(request,id)).status,status)
 assert.equal(saved.length,1)
})
test('actual phone profile keeps service data/prices while mounting no native calendar, assistant, intake or confirmation',async()=>{
 const nothing=()=>null,forbidden=()=>assert.fail('phone profile must not mount native booking or assistant')
 const generic=new Proxy({},{get:()=>nothing})
 const stubs={react:React,'react-dom':require('react-dom'),'react/jsx-runtime':require('react/jsx-runtime'),luxon:{DateTime},'next/link':{default:({children,...props})=>React.createElement('a',props,children)},'next/navigation':{},'../lib/booking-mode.mjs':bookingMode,'../lib/business-profile-ui.mjs':{profileServicePrice},'./outbound-booking-button':{OutboundBookingButton},'./business-profile':{BusinessServiceList:({business})=>React.createElement('div',{'data-services':'real'},business.services.map(s=>React.createElement('p',{key:s.id,'data-service-id':s.id},s.name+' '+profileServicePrice(s,'bg'))))},'./guided-booking-chat':{GuidedBookingChat:forbidden},'./monthly-booking-calendar':{MonthlyBookingCalendar:forbidden},'./booking-intake-fields':{BookingIntakeFields:forbidden,BookingIntakeSummary:forbidden}}
 stubs['./booking-button-content']=bookingButtonContent
 const source=await readFile(new URL('../components/public-booking-page.js',import.meta.url),'utf8');for(const match of source.matchAll(/from ['"]([^'"]+)['"]/g))if(!(match[1] in stubs))stubs[match[1]]=generic
 const {BusinessBookingExperience}=await component('components/public-booking-page.js',stubs)
 const html=render(BusinessBookingExperience,{business,locale:'bg'});assert.match(html,/data-service-id="actual-service"/);assert.match(html,/Published service/);assert.match(html,/25/);assert.match(html,/href="tel:\+359888123456"/);assert.equal((html.match(/href="tel:/g)||[]).length,1);assert.doesNotMatch(html,/profile-mode-controls|profile-assistant-panel|type="submit"|booking-month|calendar-grid|<form/)
 const preview=render(BusinessBookingExperience,{business,locale:'en',preview:true});assert.doesNotMatch(preview,/href="tel:/);assert.match(preview,/aria-disabled="true"/)
})
