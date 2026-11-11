import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import * as draftHelpers from '../lib/onboarding-catalogue-draft.mjs'
import * as locations from '../lib/business-location.mjs'
import * as schedules from '../lib/business-schedule.mjs'
import * as bookingMode from '../lib/booking-mode.mjs'
import * as slugs from '../lib/business-slug.mjs'
import * as templates from '../lib/industry-templates.mjs'
import * as media from '../lib/business-media.mjs'
import { businessApplicationSchema } from '../lib/business-application.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/business-setup.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, {
  filename,
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
  module: { type: 'commonjs' },
})

// Exercise the real SWC-compiled BusinessSetup handlers with deterministic
// hooks. Child controls are boundaries: tests invoke their actual parent props,
// not a second copy of the import/merge/save algorithm. No browser, remote
// request, database, account, image processing or notification is involved.
let activeHarness
const hooks = {
  ...React,
  useState: initial => activeHarness.state(initial),
  useRef: initial => activeHarness.ref(initial),
  useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies),
}
const controls = Object.fromEntries([
  'Icon', 'BusinessLocationFields', 'WeeklyScheduleFields', 'DurationInput',
  'PhotoPicker', 'BookingModeFields', 'OpeningHoursEditor',
  'CatalogueBusinessLookup', 'CatalogueImportReview',
].map(name => [name, Object.defineProperty(() => null, 'name', { value: name })]))
const stubs = {
  react: hooks,
  'next/link': () => null,
  '../lib/supabase': { supabase: { from() { throw Error('A local UI test must not access a database') } } },
  './icon': controls,
  './business-location-fields': controls,
  './weekly-schedule-fields': controls,
  './duration-input': controls,
  './photo-picker': controls,
  './booking-mode-fields': controls,
  './opening-hours-editor': controls,
  './catalogue-business-lookup': controls,
  './catalogue-import-review': controls,
  '../lib/onboarding-catalogue-draft.mjs': draftHelpers,
  '../lib/business-location.mjs': locations,
  '../lib/business-schedule.mjs': schedules,
  '../lib/booking-mode.mjs': bookingMode,
  '../lib/business-slug.mjs': slugs,
  '../lib/industry-templates.mjs': templates,
  '../lib/business-media.mjs': media,
  '../lib/photo-selection': { fitPhotoFilesToBudget: async files => files },
}
const compiled = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name in stubs ? stubs[name] : require(name), compiled, compiled.exports)
const { BusinessSetup } = compiled.exports

function elements(node, predicate, result = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, result))
  else if (React.isValidElement(node)) {
    if (predicate(node)) result.push(node)
    elements(node.props.children, predicate, result)
  }
  return result
}
function harness(props = {}) {
  const slots = [], pending = [], completed = []
  let index = 0, changed = false
  const api = {
    props: { locale: 'en', application: true, preview: true, session: { user: { id: 'test-owner', email: 'owner@example.com' }, access_token: 'test-only-token' }, onComplete: value => completed.push(value), ...props },
    completed, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) {
      const slot = api.slot(() => typeof initial === 'function' ? initial() : initial)
      return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; changed = true } }]
    },
    ref(initial) { return api.slot(() => ({ current: initial })).value },
    effect(effect, dependencies) {
      const slot = api.slot(() => ({ dependencies: undefined, cleanup: undefined }))
      if (!slot.value.dependencies || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) {
        slot.value.dependencies = dependencies
        pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() })
      }
    },
    render() {
      let attempts = 0
      do {
        assert.ok(attempts++ < 10, 'hook fixture must settle')
        changed = false; index = 0; activeHarness = api
        try { api.tree = BusinessSetup(api.props) } finally { activeHarness = null }
        while (pending.length) pending.shift()()
      } while (changed)
      return api.tree
    },
    find(predicate) { return elements(api.tree, predicate) },
    control(name) { return api.find(node => node.type === controls[name])[0] },
    field(id) { return api.find(node => node.props.id === id)[0] },
    edit(id, value) { const field = api.field(id); assert.ok(field, `field ${id} is rendered`); field.props.onChange({ target: { value } }); api.render() },
    choose(draft) { api.control('CatalogueBusinessLookup').props.onSelect(draft); api.render() },
    confirm(indexes) { const review = api.control('CatalogueImportReview'); assert.ok(review, 'explicit review is shown'); review.props.onConfirm(indexes); api.render() },
    backToBusiness() { const step = api.find(node => node.props.className?.startsWith('step-item'))[0]; step.props.onClick(); api.render() },
    next() { const button = api.find(node => node.props.className === 'primary-button')[0]; assert.ok(button, 'Continue is present'); button.props.onClick(); api.render() },
    dispose() { slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  api.render()
  return api
}
function candidate(name = 'Catalogue studio', patch = {}, services = [{ name: 'Haircut', price: '25.00', duration_min: '45' }]) {
  return { business: { id: `catalogue-${name}`, name, phone: '+359882222222', address: 'Source street 1', cityCode: '68134', neighborhood: 'Борово', industry: 'beauty', website: 'https://source.example.com', ...patch }, services, serviceLimit: 40 }
}
function accept(h, draft) {
  h.choose(draft)
  if (h.control('CatalogueImportReview')) h.confirm(draft.services.map((_, index) => index))
}
function addRequiredBusinessFields(h) {
  const lookup = h.control('CatalogueBusinessLookup')
  if (!lookup.props.value) { lookup.props.onChange('Owner studio'); h.render() }
  h.edit('business-phone', '+359881111111')
  h.edit('business-address', 'Owner street 8')
  h.control('BusinessLocationFields').props.onChange({ city_ekatte: '68134', neighborhood: 'Борово' }); h.render()
  h.control('PhotoPicker').props.onChange([new File(['local-ui-fixture'], 'owner-photo.png', { type: 'image/png' })]); h.render()
}
function external(h) {
  h.control('BookingModeFields').props.onChange({ mode: 'external', url: 'https://owner.example.com/book', consent: true }); h.render()
}
function advanceToReview(h) {
  h.next(); assert.ok(h.field('service-0'), 'services step')
  h.next(); assert.ok(h.find(node => node.props.className === 'staff-row' || node.props.className === 'repeat-row staff-row').length === 0, 'empty staff remains optional in external mode')
  h.next(); assert.ok(h.control('OpeningHoursEditor'), 'external opening hours remain separate')
  h.next(); assert.ok(h.find(node => node.props.className === 'review-grid').length, 'review step')
}
function checkConsents(h, { photos = true, account = true } = {}) {
  const checkboxes = h.find(node => node.type === 'input' && node.props.type === 'checkbox')
  assert.equal(checkboxes.length, 2, 'photo rights and application terms have separate controls')
  if (photos) checkboxes[0].props.onChange({ target: { checked: true } })
  if (account) checkboxes[1].props.onChange({ target: { checked: true } })
  h.render()
}
async function save(h) {
  const button = h.find(node => node.props.className === 'primary-button accent')[0]
  assert.ok(button, 'approval/save control is visible')
  await button.props.onClick(); h.render()
}

test('three explicit imports never overwrite manually entered phone/address/website/type, even when source values coincide', () => {
  const h = harness()
  h.edit('business-phone', '+359881111111')
  h.edit('business-address', 'Manually entered address')
  h.edit('business-industry', 'consulting')
  h.find(node => node.type === 'input' && node.props.type === 'url')[0].props.onChange({ target: { value: 'https://manual.example.com' } }); h.render()
  for (const draft of [
    candidate('First'),
    candidate('Second', { phone: '+359881111111', address: 'Manually entered address', website: 'https://manual.example.com', industry: 'consulting' }),
    candidate('Third', { phone: '+359883333333', address: 'Different source address', website: 'https://third.example.com', industry: 'beauty' }),
  ]) {
    accept(h, draft)
    assert.equal(h.field('business-phone').props.value, '+359881111111')
    assert.equal(h.field('business-address').props.value, 'Manually entered address')
    assert.equal(h.field('business-industry').props.value, 'consulting')
    assert.equal(h.find(node => node.type === 'input' && node.props.type === 'url')[0].props.value, 'https://manual.example.com')
    assert.equal(h.control('CatalogueBusinessLookup').props.value, draft.business.name, 'explicitly chosen business name is applied')
  }
})

test('LocationFields manual patch provenance survives three source imports, including coincident city and quarter', () => {
  const h = harness()
  h.control('BusinessLocationFields').props.onChange({ city_ekatte: '10135', neighborhood: 'My manually entered quarter' }); h.render()
  for (const draft of [candidate('First'), candidate('Coincident', { cityCode: '10135', neighborhood: 'My manually entered quarter' }), candidate('Third')]) {
    accept(h, draft)
    assert.equal(h.control('BusinessLocationFields').props.cityCode, '10135')
    assert.equal(h.control('BusinessLocationFields').props.neighborhood, 'My manually entered quarter')
  }
})

test('untouched source fields refresh on a later explicit choice; manually edited imported fields do not', () => {
  const h = harness()
  accept(h, candidate('First'))
  h.edit('business-phone', '+359889999999')
  accept(h, candidate('Second', { phone: '+359883333333', address: 'Second address', neighborhood: 'Лагера', website: 'https://second.example.com' }))
  assert.equal(h.field('business-phone').props.value, '+359889999999')
  assert.equal(h.field('business-address').props.value, 'Second address')
  assert.equal(h.control('BusinessLocationFields').props.neighborhood, 'Лагера')
  assert.equal(h.find(node => node.type === 'input' && node.props.type === 'url')[0].props.value, 'https://second.example.com')
})

test('a manually selected city with an empty quarter does not permanently mark future imported quarters as manual', () => {
  const h = harness()
  h.control('BusinessLocationFields').props.onChange({ city_ekatte: '68134', neighborhood: '' }); h.render()
  accept(h, candidate('First', { neighborhood: 'Борово' }))
  assert.equal(h.control('BusinessLocationFields').props.neighborhood, 'Борово')
  accept(h, candidate('Second', { neighborhood: 'Лагера' }))
  assert.equal(h.control('BusinessLocationFields').props.neighborhood, 'Лагера', 'untouched imported quarter must follow the newly selected business')
  assert.equal(h.control('BusinessLocationFields').props.cityCode, '68134', 'manually chosen city is retained')
  h.control('BusinessLocationFields').props.onChange({ city_ekatte: '68134', neighborhood: 'Owner quarter' }); h.render()
  accept(h, candidate('Third', { neighborhood: 'Павлово' }))
  assert.equal(h.control('BusinessLocationFields').props.neighborhood, 'Owner quarter', 'a later genuine manual quarter edit owns the value')
})

test('atomic provenance records only fields actually supplied, replays purely and clears ownership on explicit manual edits', () => {
  const { selectCatalogueBusinessDraft: select, editOnboardingBusinessDraft: edit } = draftHelpers
  const initial = { business: { name: 'Manual name', phone: '+359881111111', address: '', city_ekatte: '68134', neighborhood: '', website_url: '', industry: 'other', owner_id: 'current-owner', external_booking_consent: false }, importedFields: {} }
  const before = structuredClone(initial), source = candidate('First', { phone: '+359881111111' }).business
  const first = select(initial, source)
  assert.deepEqual(initial, before, 'selector does not mutate the prior React state')
  assert.deepEqual(select(initial, source), first, 'React updater replay has no ref side effects')
  assert.equal(Object.hasOwn(first.importedFields, 'phone'), false, 'same-valued manual phone was not imported')
  assert.equal(Object.hasOwn(first.importedFields, 'city_ekatte'), false, 'already chosen city was not imported')
  assert.equal(first.importedFields.address, 'Source street 1')
  assert.equal(first.importedFields.neighborhood, 'Борово')
  const manual = edit(first, { address: 'Source street 1', neighborhood: '' })
  assert.equal(Object.hasOwn(manual.importedFields, 'address'), false, 'explicit same-value edits remove import ownership too')
  assert.equal(Object.hasOwn(manual.importedFields, 'neighborhood'), false)
  const second = select(manual, candidate('Second', { phone: '+359883333333', address: 'Other street', neighborhood: 'Лагера' }).business)
  assert.equal(second.business.phone, '+359881111111')
  assert.equal(second.business.address, 'Source street 1')
  assert.equal(second.business.neighborhood, 'Лагера', 'an explicit import may fill a blank manually cleared field')
  assert.equal(second.importedFields.neighborhood, 'Лагера', 'the actual new fill has fresh ownership')
  const third = select(second, candidate('Third', { neighborhood: 'Павлово' }).business)
  assert.equal(third.business.neighborhood, 'Павлово', 'fresh ownership can be refreshed next time')
  assert.equal(third.business.owner_id, 'current-owner')
  assert.equal(third.business.external_booking_consent, false)
  assert.deepEqual(first, select(initial, source), 'subsequent edits/selections did not mutate earlier state')
})

test('dirty service names, zero prices and duration-only edits require explicit confirmation; cancel preserves the actual draft', () => {
  for (const [field, value] of [['service-0', 'My service'], ['price-0', '0'], ['duration-0', '30']]) {
    const h = harness(); addRequiredBusinessFields(h); h.next()
    if (field === 'duration-0') h.field(field).props.onChange(value)
    else h.field(field).props.onChange({ target: { value } })
    h.render(); h.backToBusiness(); h.choose(candidate('Different studio'))
    assert.equal(h.control('CatalogueImportReview').props.replace, true, field)
    assert.equal(h.control('CatalogueBusinessLookup').props.value, 'Owner studio', 'pending import must not change business name')
    h.control('CatalogueImportReview').props.onCancel(); h.render()
    assert.equal(h.control('CatalogueImportReview'), undefined)
    h.next(); assert.equal(h.field(field).props.value, value, `${field}: cancel keeps the exact entered value`)
    h.backToBusiness(); h.choose(candidate('Different studio')); h.confirm([0]); h.next()
    assert.equal(h.field('service-0').props.value, 'Haircut', 'confirmed replacement uses selected real service')
    assert.equal(h.field('price-0').props.value, '25.00')
  }
})

test('more than forty services require a selection; parent rejects oversize confirmation and imports selected source indices only', () => {
  const h = harness(), rows = Array.from({ length: 41 }, (_, index) => ({ name: `Actual source service ${index}`, price: String(index), duration_min: '30' }))
  h.choose(candidate('Large menu', {}, rows))
  assert.equal(h.control('CatalogueImportReview').props.draft.services.length, 41, 'no silent source truncation')
  assert.equal(h.control('CatalogueImportReview').props.replace, false)
  h.confirm(rows.map((_, index) => index))
  assert.ok(h.control('CatalogueImportReview'), 'invalid confirmation keeps review open')
  assert.match(h.find(node => node.props.role === 'alert')[0].props.children, /1 to 40/)
  h.confirm([0, 40]); addRequiredBusinessFields(h); h.next()
  assert.equal(h.field('service-0').props.value, 'Actual source service 0')
  assert.equal(h.field('service-1').props.value, 'Actual source service 40')
  assert.equal(h.field('service-2'), undefined)
  assert.equal(h.field('price-0').props.value, '0', 'real zero price is not replaced with a sample value')
})

function qualifiedExternalDraft() {
  return candidate('Public catalogue name', { owner_id: 'not-the-owner', contact_email: 'catalogue@example.com', slug: 'existing-partner', booking_mode: 'gorez', external_booking_consent: true, latitude: 42.7, photos: ['https://untrusted.example.com/photo.jpg'] }, [
    { id: 'source-service', name: 'Qualified service', price: '99', duration_min: '', catalogueHint: { priceLabel: 'от 99 EUR / посещение', description: 'Само при посочените условия.', requiresPriceConfirmation: true, owner_id: 'not-the-owner' } },
    { id: 'source-free', name: 'Zero-priced service', price: '0.00', duration_min: '30', catalogueHint: { priceLabel: '0 EUR', description: 'Published service context.', requiresPriceConfirmation: false } },
  ])
}
function readyExternal(h) {
  external(h); accept(h, qualifiedExternalDraft()); addRequiredBusinessFields(h); advanceToReview(h)
}

test('actual preview save strips source/UI service metadata, retains unknown nulls and exact zero, and never copies source identity or consents', async () => {
  const h = harness(); readyExternal(h)
  await save(h)
  assert.equal(h.completed.length, 0, 'terms are not auto-accepted from a public record')
  checkConsents(h, { photos: false }); await save(h)
  assert.equal(h.completed.length, 0, 'gallery rights are not auto-accepted from a public record')
  checkConsents(h); await save(h)
  assert.equal(h.completed.length, 1)
  const result = h.completed[0]
  assert.deepEqual(result.services, [
    { name: 'Qualified service', price: null, duration_min: null },
    { name: 'Zero-priced service', price: '0.00', duration_min: '30' },
  ])
  assert.equal(result.business.contact_email, 'owner@example.com')
  assert.equal(result.business.booking_mode, 'external')
  assert.equal(result.business.external_booking_url, 'https://owner.example.com/book')
  assert.notEqual(result.business.slug, 'existing-partner')
  for (const key of ['id', 'owner_id', 'gorezBusinessId', 'photos', 'latitude']) assert.equal(Object.hasOwn(result.business, key), false, key)
  assert.equal(result.business.public_profile.latitude, null)
})

test('actual application POST sends only schema-valid service fields and real photo/rights consent through a local fetch stub', async () => {
  const previousFetch = globalThis.fetch, calls = []
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/public/business-applications', 'no external requests are allowed')
    calls.push({ url, init })
    return { ok: true, json: async () => ({ photos: { requested: 1, saved: 1 } }) }
  }
  try {
    const h = harness({ preview: false }); readyExternal(h); checkConsents(h); await save(h)
    assert.equal(calls.length, 1)
    const { init } = calls[0]
    assert.equal(init.method, 'POST')
    assert.equal(init.headers.Authorization, 'Bearer test-only-token')
    assert.ok(init.body instanceof FormData)
    assert.equal(init.body.get('photoConsent'), 'true')
    assert.equal(init.body.get('gallery_0').name, 'owner-photo.png')
    const payload = JSON.parse(init.body.get('payload'))
    assert.deepEqual(payload.services, [
      { name: 'Qualified service', price: null, duration_min: null },
      { name: 'Zero-priced service', price: '0.00', duration_min: '30' },
    ])
    assert.equal(businessApplicationSchema.safeParse(payload).success, true, 'actual projected payload passes the strict authoritative schema')
    assert.equal(payload.account.email, 'owner@example.com')
    assert.equal(payload.consent, true)
    assert.deepEqual(h.completed, [{ pending: true, photos: { requested: 1, saved: 1 } }])
  } finally { globalThis.fetch = previousFetch }
})
