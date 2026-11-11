import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { applicationServiceSchema, editServicePriceDetails, servicePriceDetailsSchema, withServicePricing } from '../lib/service-pricing.mjs'
import { contentSections } from '../lib/business-content.mjs'
import { businessApplicationSchema } from '../lib/business-application.mjs'
import { readApplicationPhotos } from '../lib/application-photos.mjs'
import { APPLICATION_JSON_CHAR_LIMIT, APPLICATION_JSON_BYTE_LIMIT, readBoundedApplicationText } from '../lib/business-application-limits.mjs'

test('legacy fixed EUR service input stays valid with additive defaults, while unknowns remain null', () => {
  assert.deepEqual(applicationServiceSchema.parse({ name: 'Local service', price: '0', duration_min: '30' }), { name: 'Local service', price: 0, duration_min: 30, currency: 'EUR', description: '', price_details: {} })
  const unknown = applicationServiceSchema.parse({ name: 'External service', price: '', duration_min: null })
  assert.equal(unknown.price, null); assert.equal(unknown.duration_min, null)
  assert.equal(applicationServiceSchema.safeParse({ name: 'Local service', price: 12, duration_min: 30, currency: 'usd' }).success, false)
  assert.equal(applicationServiceSchema.safeParse({ name: 'Local service', price: false, duration_min: 30 }).success, false)
})

test('literal from/range, BGN, per-unit and conditional prices preserve their exact meaning', () => {
  for (const price_details of [{ kind: 'from' }, { kind: 'range', maximum: 40.9 }, { kind: 'fixed', unit: 'процедура' }]) {
    const input = { name: 'Услуга', price: 20.45, duration_min: 30, currency: 'BGN', description: 'Само при онлайн записване; материалите се заплащат отделно.', price_details }
    assert.deepEqual(applicationServiceSchema.parse(input), input)
    const mapped = withServicePricing(input)
    assert.equal(mapped.price, 20.45); assert.equal(mapped.currency, 'BGN')
    assert.equal(mapped.priceKind, price_details.kind)
    assert.equal(mapped.priceUnit, price_details.unit || '')
    assert.equal(mapped.description, input.description)
  }
})

test('ranges need a real maximum, never an empty-string zero or a smaller bound; unknown metadata/currencies are rejected', () => {
  const base = { name: 'Local service', price: 0, duration_min: 30 }
  for (const price_details of [{ kind: 'range' }, { kind: 'range', maximum: '' }, { kind: 'range', maximum: null }, { kind: 'from', maximum: 20 }, { kind: 'fixed', maximum: 20 }, { kind: 'range', maximum: -1 }, { kind: 'range', maximum: 1.001 }, { kind: 'fixed', unit: 'x'.repeat(101) }, { kind: 'sale' }, { kind: 'fixed', forged: true }]) assert.equal(applicationServiceSchema.safeParse({ ...base, price_details }).success, false, JSON.stringify(price_details))
  assert.equal(applicationServiceSchema.safeParse({ ...base, price: 20, price_details: { kind: 'range', maximum: 19 } }).success, false)
  assert.equal(applicationServiceSchema.safeParse({ ...base, price: null, price_details: { kind: 'from' } }).success, false)
  assert.equal(servicePriceDetailsSchema.safeParse({ kind: null }).success, false)
})

test('public adapter preserves old scalar and camelCase Intl-compatible service data without mutating input', () => {
  const source = Object.freeze({ name: 'Old range', price: '12.50', currency: 'GBP', priceKind: 'range', priceMaximum: 20, priceUnit: 'visit' })
  assert.deepEqual(withServicePricing(source), { ...source, price: 12.5 })
  assert.equal(withServicePricing({ price: '0.00' }).price, 0)
  assert.equal(withServicePricing({ price: null }).price, null)
  assert.equal(withServicePricing({ price: '' }).price, null)
  assert.equal(withServicePricing({ price: 10, price_details: {}, priceKind: 'from' }).priceKind, 'from')
  assert.equal(withServicePricing({ price: 999999.99, currency: 'EUR', priceKind: 'range', priceMaximum: 1234567.89 }).priceMaximum, 1234567.89)
})

test('malformed supplied pricing fails closed rather than displaying an unqualified fixed lower bound', () => {
  for (const price_details of ['bad', [], { kind: 'range' }, { kind: 'range', maximum: 4 }, { kind: 'fixed', maximum: 20 }, { kind: 'from', maximum: 20 }, { kind: 'fixed', unit: 'x'.repeat(101) }]) assert.equal(withServicePricing({ price: 10, price_details }).price, null, JSON.stringify(price_details))
  assert.equal(withServicePricing({ price: 10, currency: 'not-currency', price_details: {} }).price, null)
})

test('an explicit kind change reconciles the maximum; changing units does not erase a range', () => {
  const service = { price: 20, price_details: { kind: 'range', maximum: 40, unit: 'час' } }
  assert.deepEqual(editServicePriceDetails(service, { unit: 'посещение' }), { kind: 'range', maximum: 40, unit: 'посещение' })
  assert.deepEqual(editServicePriceDetails(service, { kind: 'from' }), { kind: 'from', unit: 'час' })
  assert.deepEqual(service.price_details, { kind: 'range', maximum: 40, unit: 'час' })
})

test('content edits preserve explicit pricing and do not add EUR/default metadata to old cached edit payloads', () => {
  const old = { name: 'Local service', description: '', category: '', price: 20, duration_min: 30, active: true, sort_order: 0 }
  const parsed = contentSections.services.parse([old])[0]
  assert.equal(Object.hasOwn(parsed, 'currency'), false)
  assert.equal(Object.hasOwn(parsed, 'price_details'), false)
  const next = { ...old, currency: 'BGN', price_details: { kind: 'range', maximum: 30, unit: 'процедура' } }
  assert.deepEqual(contentSections.services.parse([next])[0], { ...next, description:null,category:null })
})

test('compact editor pricing controls preserve actual currency, expose the upper bound and use localized labels', async () => {
  const require = createRequire(import.meta.url), { loadBindings, transform } = require('next/dist/build/swc')
  await loadBindings()
  const source = await readFile(new URL('../components/service-pricing-fields.js', import.meta.url), 'utf8')
  const { code } = await transform(source, { filename: 'service-pricing-fields.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === '../lib/service-pricing.mjs' ? { editServicePriceDetails } : require(name), module, module.exports)
  for (const locale of ['bg', 'en']) {
    const html = renderToStaticMarkup(React.createElement(module.exports.ServicePricingFields, { locale, value: { price: 20, currency: 'BGN', price_details: { kind: 'range', maximum: 40, unit: 'процедура' } }, onChange() {} }))
    assert.match(html, /<option value="BGN" selected=""/)
    assert.match(html, /value="40"/)
    assert.match(html, locale === 'en' ? /Maximum price/ : /Максимална цена/)
    assert.match(html, /процедура/)
  }
})

test('forty complete Cyrillic conditions and twenty team biographies fit the bounded application reader without truncation', async () => {
  const description = 'Условия за услугата. '.repeat(100).slice(0,2000)
  const value = {
    business:{name:'Offline pricing QA',slug:'offline-pricing-qa',phone:'+359888123456',contact_email:'owner@example.com',address:'Local 1',timezone:'Europe/Sofia',industry:'beauty',city_ekatte:'68134',neighborhood:''},
    services:Array.from({length:40},(_,index)=>({name:`Измислена услуга ${index}`,price:25,duration_min:30,currency:'BGN',description,price_details:{kind:'fixed',unit:'процедура'}})),
    staff:Array.from({length:20},(_,index)=>({name:`Измислен специалист ${index}`,bio:description})),
    schedule:Array.from({length:7},(_,index)=>({weekday:index+1,enabled:index<5,open:'09:00',close:'18:00',breakEnabled:false,breakStart:'12:00',breakEnd:'13:00'})),
    account:{email:'owner@example.com',password:'Offline-pricing-test-only'},locale:'bg',consent:true,company:'',
  }
  const payload=JSON.stringify(value), bytes=new TextEncoder().encode(payload).length
  assert.ok(payload.length>60000&&payload.length<APPLICATION_JSON_CHAR_LIMIT)
  assert.ok(bytes>APPLICATION_JSON_CHAR_LIMIT&&bytes<APPLICATION_JSON_BYTE_LIMIT,'multibyte text must not be confused with a character count')
  assert.equal(await readBoundedApplicationText(new Request('https://local.invalid/',{method:'POST',headers:{'content-length':String(bytes)},body:payload})),payload)
  const form=new FormData();form.append('payload',payload);form.append('photoConsent','true');form.append('gallery_0',new File(['offline fixture'],'photo.webp',{type:'image/webp'}))
  const result=await readApplicationPhotos(new Request('https://local.invalid/',{method:'POST',body:form}))
  const parsed=businessApplicationSchema.parse(result.value)
  assert.equal(parsed.services.length,40);assert.equal(parsed.staff.length,20)
  assert.ok(parsed.services.every(service=>service.description===description&&service.currency==='BGN'&&service.price_details.unit==='процедура'))
})

test('application JSON limits reject overlong characters, excessive byte headers and streamed bodies before identity work', async () => {
  await assert.rejects(readBoundedApplicationText(new Request('https://local.invalid/',{method:'POST',body:'x'.repeat(APPLICATION_JSON_CHAR_LIMIT+1)})),/VALIDATION_ERROR/)
  await assert.rejects(readBoundedApplicationText(new Request('https://local.invalid/',{method:'POST',headers:{'content-length':String(APPLICATION_JSON_BYTE_LIMIT+1)},body:'{}'})),/VALIDATION_ERROR/)
  const form=new FormData();form.append('payload','x'.repeat(APPLICATION_JSON_CHAR_LIMIT+1))
  await assert.rejects(readApplicationPhotos(new Request('https://local.invalid/',{method:'POST',body:form})),/VALIDATION_ERROR/)
})
