import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { parseContentUpdate, createContentHandler } from '../lib/business-content.mjs'
import { publicProfileDetails } from '../lib/business-profile.mjs'
import { scheduleFromHours } from '../lib/business-schedule.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/admin-business-editor.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const id = '10000000-0000-4000-8000-000000000001'
const business = { id, name: 'Offline location QA', slug: 'offline-location-qa', phone: '', contact_email: '', address: 'Пирин 42', city_ekatte: '68134', neighborhood: 'Манастирски ливади', industry: 'beauty', timezone: 'Europe/Sofia', content_revision: 3 }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function fixture(section = 'public', preview = false) {
  const slots = [], saved = [], requests = [], persisted = []
  let cursor = 0
  const fakeReact = { ...React, useState(initial) { const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial; return [slots[at], value => { slots[at] = typeof value === 'function' ? value(slots[at]) : value }] } }
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react') return fakeReact
    if (name === '../lib/business-content.mjs') return { parseContentUpdate }
    if (name === '../lib/business-profile.mjs') return { publicProfileDetails }
    if (name === '../lib/business-schedule.mjs') return { scheduleFromHours }
    if (name === '../lib/partner-leads.mjs') return { PARTNER_CATEGORY_KEYS: ['beauty'] }
    if (name === '../lib/public-locale.mjs') return { getIndustryLabel: () => 'Красота' }
    if (name.startsWith('./')) return new Proxy({}, { get: (_, key) => function Stub() { return React.createElement('span', { 'data-stub': key }) } })
    return require(name)
  }, mod, mod.exports)
  const handler = createContentHandler({ authenticate: async () => ({ id, email_confirmed_at: '2026-01-01' }), isAdmin: () => true, allowAttempt: async () => true, readBusiness: async () => business, save: async input => persisted.push(input) })
  const props = { detail: { business, services: [], staff: [], hours: [] }, section, locale: 'bg', preview, onBusy() {}, onDirty() {}, onSection() {}, onSaved: async input => saved.push(input), send: async (url, init) => { requests.push({ url, init }); const response = await handler(new Request(`https://local.example${url}`, { ...init, headers: { ...init.headers, origin: 'https://local.example' } }), id); assert.equal(response.status, 200, await response.text()) } }
  const render = () => { cursor = 0; return mod.exports.AdminBusinessEditor(props) }
  return { render, slots, saved, requests, persisted }
}

for (const section of ['business', 'public']) test(`actual ${section} editor sends raw strict input and persists server-derived city and exact point`, async () => {
  const f = fixture(section)
  f.render()
  f.slots[0] = { ...f.slots[0], public_profile: { ...f.slots[0].public_profile, latitude: 42.6650291, longitude: 23.2825296 } }
  f.slots[5] = 'Verified offline point correction'
  const tree = f.render()
  await elements(tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
  assert.equal(f.requests.length, 1)
  const body = JSON.parse(f.requests[0].init.body)
  assert.equal(body.section, 'business')
  assert.equal(Object.hasOwn(body.payload, 'city'), false, 'derived city must not be serialized back into strict request schema')
  assert.equal(f.persisted.length, 1)
  assert.equal(f.persisted[0].payload.city, 'София')
  assert.equal(f.persisted[0].payload.public_profile.latitude, 42.6650291)
  assert.equal(f.persisted[0].payload.public_profile.longitude, 23.2825296)
  assert.deepEqual(f.saved, [null])
})
test('preview keeps parsed output without issuing a mutation; invalid editor fields never send', async () => {
  const f = fixture('public', true)
  f.render(); f.slots[5] = 'Offline preview'
  await elements(f.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
  assert.equal(f.requests.length, 0)
  assert.equal(f.saved[0].payload.city, 'София')
  f.slots[0].city_ekatte = 'not-a-city'
  await elements(f.render(), node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} })
  assert.equal(f.saved.length, 1)
  assert.equal(f.requests.length, 0)
})
