import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { DateTime } from 'luxon'

// Execute the real parent editors with local hooks and inert child controls.
// No production account, database, browser storage or network is used.
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const ownerFile = '../app/dashboard/settings/page.js', adminFile = '../components/admin-business-editor.js'
async function compile(filename) {
  const source = await readFile(new URL(filename, import.meta.url), 'utf8')
  return (await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })).code
}
const ownerCode = await compile(ownerFile), adminCode = await compile(adminFile)
const libraries = Object.fromEntries(await Promise.all(['booking-intake', 'service-pricing', 'business-location', 'business-schedule', 'business-content', 'business-profile', 'public-locale', 'partner-leads'].map(async name => [name, await import(`../lib/${name}.mjs`)])))
const ServiceNameStub = () => null
const stubs = new Map()
function stub(name) { if (!stubs.has(name)) stubs.set(name, function Stub() { return null }); return stubs.get(name) }
let active
const hooks = { ...React, useState: initial => active.state(initial), useEffect: () => {}, useCallback: fn => fn }
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function harness(component, props) {
  const slots = []
  let cursor = 0
  const h = {
    props, slots, tree: null,
    state(initial) { const at = cursor++; if (!(at in slots)) slots[at] = typeof initial === 'function' ? initial() : initial; return [slots[at], next => { slots[at] = typeof next === 'function' ? next(slots[at]) : next }] },
    render() { cursor = 0; active = h; try { h.tree = component(h.props) } finally { active = null } return h.tree },
    names() { return elements(h.tree, node => node.type === ServiceNameStub) },
    clickName(index, name) { h.names()[index].props.onChange(name); h.render() },
  }
  h.render(); return h
}
const business = { id: '10000000-0000-4000-8000-000000000001', name: 'Fictional service editor', slug: 'fictional-service-editor', industry: 'auto', booking_mode: 'gorez', timezone: 'Europe/Sofia', city_ekatte: '68134', neighborhood: 'Борово', address: 'Offline street 1', default_duration_min: 45, content_revision: 2 }
const services = [
  { id: '20000000-0000-4000-8000-000000000001', business_id: business.id, name: 'Offline original service', category: 'Existing custom category', price: 24.5, currency: 'USD', price_details: { kind: 'range', maximum: 69.5, unit: 'per visit' }, duration_min: 75, description: 'Owner-entered qualification, unchanged.', active: true, sort_order: 4, staff_ids: ['specialist-one'] },
  { id: '20000000-0000-4000-8000-000000000002', business_id: business.id, name: 'Another original service', category: 'Another category', price: 0, currency: 'EUR', price_details: { kind: 'from', unit: 'per item' }, duration_min: 30, description: 'Do not replace this description.', active: false, sort_order: 7 },
]
const staff = [{ id: '30000000-0000-4000-8000-000000000001', name: 'Fictional specialist', active: true, email: '', phone: '', bio: '', sort_order: 0 }]
function fixture(kind, locale = 'bg', mode = 'gorez') {
  const writes = [], sends = [], dirties = [], saved = []
  const client = { from(table) {
    return { update(payload) {
      const write = { table, payload, filters: [] }; writes.push(write)
      const chain = { eq(key, value) { write.filters.push([key, value]); return chain }, then(resolve, reject) { return Promise.resolve({ error: null }).then(resolve, reject) } }
      return chain
    } }
  } }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', kind === 'owner' ? ownerCode : adminCode)(name => {
    if (name === 'react') return hooks
    if (name === 'luxon') return { DateTime }
    if (name === 'next/link') return { default: stub('Link') }
    if (name.endsWith('/supabase')) return { supabase: client }
    if (name.endsWith('/use-unsaved-changes')) return { useUnsavedChanges() {} }
    if (name.endsWith('/service-name-input')) return { ServiceNameInput: ServiceNameStub }
    const library = /\/lib\/([^/]+)\.mjs$/.exec(name)?.[1]
    if (library && Object.hasOwn(libraries, library)) return libraries[library]
    if (name.startsWith('./') || name.startsWith('../../../components/')) return new Proxy({}, { get: (_, key) => stub(key) })
    return require(name)
  }, module, module.exports)
  const detail = { business: { ...business, booking_mode: mode }, services: structuredClone(services), staff: structuredClone(staff), hours: [] }
  const props = kind === 'owner' ? { business: detail.business, locale, preview: true, previewCollections: detail, refreshBusiness: async () => {} } : { detail, locale, section: 'services', preview: false, onBusy() {}, onDirty: value => dirties.push(value), onSaved: async value => saved.push(value), onSection() {}, send: async (url, init) => { sends.push({ url, init }) } }
  const h = harness(kind === 'owner' ? module.exports.SettingsContent : module.exports.AdminBusinessEditor, props)
  if (kind === 'owner') {
    const button = elements(h.tree, node => node.type === 'button' && node.key === 'services')[0]
    assert.ok(button, 'the real services section is available')
    button.props.onClick(); h.render()
  }
  return { h, writes, sends, dirties, saved, serviceState: () => h.slots[1] }
}

for (const kind of ['owner', 'admin']) for (const locale of ['bg', 'en']) test(`${kind}/${locale}: selecting a suggestion changes only its service name and never saves automatically`, () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = () => assert.fail('a name selection cannot issue a network request')
  try {
    const f = fixture(kind, locale), before = structuredClone(f.serviceState()), team = structuredClone(f.h.slots[2])
    assert.equal(f.h.names().length, 2)
    for (const input of f.h.names()) {
      assert.equal(input.props.industry, 'auto')
      assert.equal(input.props.locale, locale)
      assert.equal(input.props.disabled, false)
      assert.equal(input.props.maxLength ?? 120, 120, 'shared input preserves the service schema limit')
      assert.equal(input.props.required ?? false, kind === 'admin', 'preserve the previous parent validation contract')
      assert.ok(elements(f.h.tree, node => node.type === 'label' && node.props.htmlFor === input.props.id).length, 'the input retains a real associated label')
    }
    f.h.clickName(0, locale === 'en' ? 'Tyre replacement' : 'Смяна на гуми')
    assert.deepEqual(f.serviceState()[0], { ...before[0], name: locale === 'en' ? 'Tyre replacement' : 'Смяна на гуми' })
    assert.deepEqual(f.serviceState()[1], before[1], 'another service is never modified')
    assert.deepEqual(f.h.slots[2], team, 'staff and their eligibility are not modified')
    assert.deepEqual(f.writes, []); assert.deepEqual(f.sends, []); assert.deepEqual(f.saved, [])
    if (kind === 'admin') assert.deepEqual(f.dirties, [true], 'normal dirty-state safeguards remain connected')
    f.h.clickName(0, 'Custom service outside the suggestion vocabulary')
    assert.equal(f.serviceState()[0].name, 'Custom service outside the suggestion vocabulary', 'free text remains supported')
    assert.deepEqual({ ...f.serviceState()[0], name: before[0].name }, before[0])
  } finally { globalThis.fetch = previousFetch }
})

for (const kind of ['owner', 'admin']) test(`${kind}: category or locale changes update suggestion context without clearing any draft`, () => {
  const f = fixture(kind), before = structuredClone(f.serviceState())
  if (kind === 'owner') f.h.props.business = { ...f.h.props.business, industry: 'pets' }
  else f.h.slots[0] = { ...f.h.slots[0], industry: 'pets' }
  f.h.props.locale = 'en'; f.h.render()
  assert.ok(f.h.names().every(input => input.props.industry === 'pets' && input.props.locale === 'en'))
  assert.deepEqual(f.serviceState(), before)
  assert.deepEqual(f.writes, []); assert.deepEqual(f.sends, [])
})

for (const kind of ['owner', 'admin']) test(`${kind}: busy editor disables service suggestions without changing selected values`, () => {
  const f = fixture(kind), before = structuredClone(f.serviceState())
  // The actual component's existing save/busy hook; no alternate rendering path.
  f.h.slots[kind === 'owner' ? 9 : 7] = true; f.h.render()
  assert.ok(f.h.names().every(input => input.props.disabled === true))
  assert.deepEqual(f.serviceState(), before)
  assert.deepEqual(f.writes, []); assert.deepEqual(f.sends, [])
})

for (const kind of ['owner', 'admin']) for (const mode of ['external', 'phone']) test(`${kind}/${mode}: unknown price and duration stay unknown after a suggested name`, () => {
  const f = fixture(kind, 'bg', mode)
  f.h.slots[1] = f.serviceState().map(item => ({ ...item, price: null, duration_min: null, price_details: {} }))
  f.h.render(); const before = structuredClone(f.serviceState())
  f.h.clickName(0, 'Измиване на автомобил')
  assert.deepEqual(f.serviceState()[0], { ...before[0], name: 'Измиване на автомобил' })
  assert.equal(f.serviceState()[0].price, null)
  assert.equal(f.serviceState()[0].duration_min, null)
  assert.deepEqual(f.writes, []); assert.deepEqual(f.sends, [])
})

test('owner Save remains explicit and scoped to the actual service and business, preserving actual pricing', async () => {
  const previousWindow = globalThis.window
  globalThis.window = { setTimeout: () => 0 }
  try {
    const f = fixture('owner', 'en'), before = structuredClone(f.serviceState()[0])
    f.h.props.preview = false; f.h.render(); f.h.clickName(0, 'Tyre replacement')
    assert.deepEqual(f.writes, [])
    const button = elements(f.h.tree, node => node.type === 'button' && node.props.children === 'Save')[0]
    await button.props.onClick(); f.h.render()
    assert.equal(f.writes.length, 1)
    assert.equal(f.writes[0].table, 'services')
    assert.deepEqual(f.writes[0].filters, [['id', before.id], ['business_id', business.id]])
    assert.deepEqual(f.writes[0].payload, { name: 'Tyre replacement', price: before.price, currency: before.currency, description: before.description, price_details: before.price_details, duration_min: before.duration_min, category: before.category })
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow }
})

test('admin Save remains explicit with original IDs, all qualifications, revision and audit reason', async () => {
  const f = fixture('admin', 'en'), before = structuredClone(f.serviceState())
  f.h.clickName(0, 'Tyre replacement')
  const reason = elements(f.h.tree, node => node.type === 'input' && node.props.minLength === 3)[0]
  reason.props.onChange({ target: { value: 'Owner requested the exact service name' } }); f.h.render()
  assert.deepEqual(f.sends, [])
  await elements(f.h.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); f.h.render()
  assert.equal(f.sends.length, 1)
  assert.equal(f.sends[0].url, `/api/admin/businesses/${business.id}/content`)
  const envelope = JSON.parse(f.sends[0].init.body)
  assert.equal(envelope.section, 'services'); assert.equal(envelope.revision, business.content_revision)
  assert.equal(envelope.reason, 'Owner requested the exact service name')
  assert.deepEqual(envelope.payload, [{ ...before[0], name: 'Tyre replacement' }, before[1]])
  assert.deepEqual(f.saved, [null])
})

test('new admin service rows use the same optional suggestions without inferring a tariff or modifying existing services', () => {
  const f = fixture('admin', 'en'), before = structuredClone(f.serviceState())
  const add = elements(f.h.tree, node => node.type === 'button' && node.props.children === '+ Add service')[0]
  add.props.onClick(); f.h.render()
  const created = structuredClone(f.serviceState()[2])
  assert.equal(created.name, '')
  assert.equal(f.h.names()[2].props.industry, 'auto')
  f.h.clickName(2, 'Custom new service')
  assert.deepEqual(f.serviceState(), [...before, { ...created, name: 'Custom new service' }])
  assert.deepEqual(f.sends, []); assert.deepEqual(f.writes, [])
})
