import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DateTime } from 'luxon'
import { bookingSlotKey } from '../lib/booking-safety.mjs'
import { localizedApiMessage } from '../lib/localized-api-message.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/owner-manual-booking-dialog.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const DateMenuStub = () => null, IntakeStub = () => null
let activeHarness
const fakeReact = {
  ...React,
  useState: initial => activeHarness.state(initial),
  useRef: initial => activeHarness.ref(initial),
  useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies),
}
function elements(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(child => elements(child, predicate, found))
  else if (React.isValidElement(node)) { if (predicate(node)) found.push(node); elements(node.props.children, predicate, found) }
  return found
}
function harness(component, props) {
  const slots = [], pending = []
  let index = 0, dirty = false, disposed = false
  const h = {
    props, tree: null,
    slot(initial) { const at = index++; return slots[at] ?? (slots[at] = { value: initial() }) },
    state(initial) { const slot = h.slot(() => typeof initial === 'function' ? initial() : initial); return [slot.value, next => { const value = typeof next === 'function' ? next(slot.value) : next; if (!Object.is(value, slot.value)) { slot.value = value; dirty = true } }] },
    ref(initial) { return h.slot(() => ({ current: initial })).value },
    effect(effect, dependencies) { const slot = h.slot(() => ({ dependencies: undefined, cleanup: undefined })); if (!slot.value.dependencies || dependencies.some((value, at) => !Object.is(value, slot.value.dependencies[at]))) { slot.value.dependencies = dependencies; pending.push(() => { slot.value.cleanup?.(); slot.value.cleanup = effect() }) } },
    render() { index = 0; dirty = false; activeHarness = h; try { h.tree = component(h.props) } finally { activeHarness = null }; return h.tree },
    flush() { if (disposed) return; let turns = 0; while (dirty || pending.length) { assert.ok(++turns < 40, 'effects must settle'); while (pending.length) pending.shift()(); if (dirty) h.render() } },
    update(patch) { h.props = { ...h.props, ...patch }; h.render(); h.flush() },
    dispose() { if (disposed) return; disposed = true; pending.length = 0; slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  h.render(); return h
}
const slot = (suffix = 'one', staffId = 'staff-1') => ({ staffId, startsAt: `2028-02-02T0${suffix === 'two' ? 9 : 8}:00:00.000Z`, endsAt: `2028-02-02T0${suffix === 'two' ? 9 : 8}:30:00.000Z`, localTime: suffix === 'two' ? '11:00' : '10:00', localEndTime: suffix === 'two' ? '11:30' : '10:30', staffName: `QA ${staffId}` })
const business = { id: 'fictional-owner-business', slug: 'fictional-owner-business', timezone: 'Europe/Sofia', industry: 'beauty', booking_mode: 'native' }
const services = [{ id: 'service-1', name: 'Детско подстригване за момчета', duration_min: 30 }, { id: 'service-2', name: 'Втора измислена услуга', duration_min: 45 }]
const staff = [{ id: 'staff-1', name: 'QA One' }, { id: 'staff-2', name: 'QA Two' }]
const field = (f, name) => elements(f.h.tree, node => node.props.name === name)[0]
const date = f => elements(f.h.tree, node => node.type === DateMenuStub)[0]
const form = f => elements(f.h.tree, node => node.type === 'form')[0]
const submitButton = f => elements(f.h.tree, node => node.props.type === 'submit')[0]
const html = f => renderToStaticMarkup(f.h.tree)

// Executes the actual component with deterministic local hooks and controlled
// requests that deliberately ignore AbortSignal. No real auth/network/booking.
function fixture(patch = {}) {
  const original = { fetch: globalThis.fetch, document: globalThis.document }
  const requests = [], created = [], closed = [], focus = [], sessions = [], dialogState = { open: false, shown: 0, closed: 0 }
  const previous = { isConnected: true, focus: () => focus.push('restored') }
  globalThis.document = { activeElement: previous, body: { style: { overflow: 'scroll' } } }
  globalThis.fetch = (url, init = {}) => {
    assert.match(url, /^\/api\/public\/fictional-owner-business\/(availability\?|bookings$)/)
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    requests.push({ url, init, reject, respond(body, status = 200) { resolve({ ok: status >= 200 && status < 300, status, json: async () => body }) } })
    return promise
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => {
    const imports = {
      react: fakeReact, luxon: { DateTime }, './date-menu': { DateMenu: DateMenuStub }, './booking-intake-fields': { BookingIntakeFields: IntakeStub },
      './icon': { Icon: ({ name }) => React.createElement('svg', { 'data-icon': name }) },
      '../lib/booking-safety.mjs': { bookingSlotKey }, '../lib/localized-api-message.mjs': { localizedApiMessage },
      '../lib/dialog-focus.mjs': { containDialogTab: event => { if (event.key === 'Tab') event.preventDefault() } },
      '../lib/supabase': { supabase: { auth: { getSession: async () => { sessions.push('auth'); return { data: { session: { access_token: 'fictional-test-token' } } } } } } },
    }
    return Object.hasOwn(imports, name) ? imports[name] : require(name)
  }, module, module.exports)
  const h = harness(module.exports.OwnerManualBookingDialog, { business, services, staff, onClose: () => closed.push('close'), onCreated: value => created.push(value), ...patch })
  h.tree.props.ref.current = {
    showModal() { dialogState.open = true; dialogState.shown++ }, close() { dialogState.open = false; dialogState.closed++ },
    querySelector: () => ({ focus: () => focus.push('close-button') }),
  }
  h.flush()
  const f = {
    h, requests, created, closed, focus, sessions, dialogState,
    edit(name, value, flush = true) { field(f, name).props.onChange({ target: { value } }); if (flush) h.flush() },
    chooseDate(value, flush = true) { date(f).props.onChange(value); if (flush) h.flush() },
    async settle() { for (let i = 0; i < 15; i++) { await Promise.resolve(); h.flush() } },
    submit() { return form(f).props.onSubmit({ preventDefault() {}, currentTarget: { checkValidity: () => true } }) },
    async available(rows = [slot()]) { f.edit('serviceId', 'service-1'); f.chooseDate('2028-02-02'); requests.at(-1).respond({ slots: rows }); await f.settle() },
    close() { h.dispose(); Object.assign(globalThis, original) },
  }
  return f
}

test('native dialog opens once, locks body scroll, restores focus, and starts without stale services or availability', () => {
  const f = fixture()
  try {
    assert.equal(f.dialogState.shown, 1)
    assert.equal(document.body.style.overflow, 'hidden')
    assert.deepEqual(f.focus, ['close-button'])
    assert.equal(field(f, 'serviceId').props.value, '')
    assert.equal(field(f, 'startsAt').props.disabled, true)
    assert.equal(submitButton(f).props.disabled, true)
    assert.equal(f.requests.length, 0)
    assert.match(html(f), /Нова резервация/)
    assert.match(html(f), /owner-appointment-dialog-head/)
    assert.equal(date(f).props.required, true)
    f.h.dispose()
    assert.equal(document.body.style.overflow, 'scroll')
    assert.deepEqual(f.focus, ['close-button', 'restored'])
  } finally { f.close() }
})

test('real service, date and optional staff identifiers form one no-store authoritative availability request', async () => {
  const f = fixture({ initialStaffId: 'staff-2', initialDate: '2028-02-02', locale: 'en' })
  try {
    f.edit('serviceId', 'service-2')
    assert.equal(f.requests.length, 1)
    assert.deepEqual(Object.fromEntries(new URL(f.requests[0].url, 'https://local.invalid').searchParams), { service_id: 'service-2', date: '2028-02-02', staff_id: 'staff-2' })
    assert.equal(f.requests[0].init.cache, 'no-store')
    assert.match(html(f), /Checking available times/)
    f.requests[0].respond({ slots: [slot('one', 'staff-2')] }); await f.settle()
    assert.equal(field(f, 'startsAt').props.disabled, false)
    f.edit('startsAt', bookingSlotKey(slot('one', 'staff-2')))
    assert.equal(submitButton(f).props.disabled, false)
    assert.equal(f.sessions.length, 0)
  } finally { f.close() }
})

test('service/date/staff changes immediately invalidate old times and ignored-abort responses cannot replace newer availability', async () => {
  const f = fixture()
  try {
    await f.available(); f.edit('startsAt', bookingSlotKey(slot()))
    const original = f.requests[0]
    f.edit('serviceId', 'service-2', false)
    assert.equal(original.init.signal.aborted, true, 'synchronous event invalidation, before effects')
    f.h.flush()
    assert.equal(field(f, 'startsAt').props.value, '')
    assert.equal(field(f, 'startsAt').props.disabled, true)
    const slow = f.requests.at(-1)
    f.edit('staffId', 'staff-2')
    assert.equal(slow.init.signal.aborted, true)
    const newest = f.requests.at(-1)
    slow.respond({ slots: [slot('one')] }); await f.settle()
    assert.equal(field(f, 'startsAt').props.disabled, true)
    newest.respond({ slots: [slot('two', 'staff-2')] }); await f.settle()
    assert.match(html(f), /11:00–11:30/)
    assert.doesNotMatch(html(f), /10:00–10:30/)
    f.edit('startsAt', bookingSlotKey(slot('two', 'staff-2')))
    f.chooseDate('2028-02-03')
    assert.equal(field(f, 'startsAt').props.value, '')
    assert.equal(submitButton(f).props.disabled, true)
  } finally { f.close() }
})

test('technical failures have retry and do not masquerade as genuine zero availability', async () => {
  const f = fixture({ locale: 'en' })
  try {
    f.edit('serviceId', 'service-1'); f.chooseDate('2028-02-02')
    f.requests[0].reject(Error('network')); await f.settle()
    assert.match(html(f), /We could not load available times/)
    assert.doesNotMatch(html(f), /No available times/)
    const retry = elements(f.h.tree, node => node.type === 'button' && node.props.children === 'Try again')[0]
    retry.props.onClick(); f.h.flush()
    assert.equal(f.requests.length, 2)
    f.requests[1].respond({ slots: [] }); await f.settle()
    assert.match(html(f), /No available times/)
    assert.doesNotMatch(html(f), /We could not load available times/)
    await f.submit(); await f.settle()
    assert.equal(f.requests.length, 2)
    assert.equal(f.sessions.length, 0)
  } finally { f.close() }
})

test('successful owner submission preserves real slot/payload, locks editing/dismissal and prevents double submit before React commit', async () => {
  const f = fixture()
  try {
    await f.available(); f.edit('startsAt', bookingSlotKey(slot()))
    f.edit('customerName', 'QA Client'); f.edit('customerPhone', '0888123456'); f.edit('customerEmail', 'qa@example.invalid'); f.edit('notes', 'fictional note')
    elements(f.h.tree, node => node.type === IntakeStub)[0].props.onChange({ test: 'fictional intake' }); f.h.flush()
    const first = f.submit(), duplicate = f.submit()
    await f.settle()
    assert.equal(f.sessions.length, 1)
    assert.equal(f.requests.length, 2)
    assert.equal(elements(f.h.tree, node => node.props.className === 'owner-manual-fields')[0].props.disabled, true)
    f.h.tree.props.onCancel({ preventDefault() {} })
    elements(f.h.tree, node => node.props.className === 'owner-appointment-dialog-close')[0].props.onClick()
    assert.deepEqual(f.closed, [])
    f.edit('customerName', 'MUST NOT REPLACE')
    assert.equal(field(f, 'customerName').props.value, 'QA Client')
    const post = f.requests[1]
    assert.equal(post.init.method, 'POST')
    assert.equal(post.init.headers.Authorization, 'Bearer fictional-test-token')
    assert.deepEqual(JSON.parse(post.init.body), { serviceId: 'service-1', staffId: 'staff-1', startsAt: slot().startsAt, customer: { name: 'QA Client', phone: '0888123456', email: 'qa@example.invalid' }, notes: 'fictional note', intake: { test: 'fictional intake' }, locale: 'bg', consent: true, source: 'manual' })
    const booking = { appointment: { id: 'fictional-confirmed-id' } }
    post.respond({ booking }, 201); await first; await duplicate; await f.settle()
    assert.deepEqual(f.created, [booking])
    assert.equal(field(f, 'startsAt').props.value, '')
    assert.equal(submitButton(f).props.disabled, true)
  } finally { f.close() }
})

test('409 conflict refreshes availability and clears only the stale time, retaining customer-entered details', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.available(); f.edit('startsAt', bookingSlotKey(slot()))
    f.edit('customerName', 'QA Preserved'); f.edit('customerPhone', '0888123456'); f.edit('customerEmail', 'qa@example.invalid')
    const pending = f.submit(); await f.settle()
    f.requests[1].respond({ error: { code: 'SLOT_UNAVAILABLE', message: 'Този час вече е зает.' } }, 409)
    await pending; await f.settle()
    assert.match(html(f), /This time is no longer available/)
    assert.equal(field(f, 'startsAt').props.value, '')
    assert.equal(field(f, 'customerName').props.value, 'QA Preserved')
    assert.equal(field(f, 'customerPhone').props.value, '0888123456')
    assert.equal(f.requests.length, 3)
    assert.equal(f.requests[2].init.method, undefined)
    assert.deepEqual(f.created, [])
    f.requests[2].respond({ slots: [slot('two')] }); await f.settle()
    assert.equal(submitButton(f).props.disabled, true)
    f.edit('startsAt', bookingSlotKey(slot('two')))
    assert.equal(submitButton(f).props.disabled, false)
  } finally { f.close() }
})

test('preview uses only explicitly supplied fictional availability and can never authenticate, POST or simulate a booking', async () => {
  const calls = [], f = fixture({ preview: true, previewAvailabilityLoader: async value => { calls.push(value); return { slots: [slot()] } } })
  try {
    f.edit('serviceId', 'service-1'); f.chooseDate('2028-02-02'); await f.settle()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].serviceId, 'service-1')
    assert.equal(calls[0].date, '2028-02-02')
    f.edit('startsAt', bookingSlotKey(slot()))
    assert.equal(submitButton(f).props.disabled, true)
    await f.submit(); await f.settle()
    assert.deepEqual(f.requests, []); assert.deepEqual(f.sessions, []); assert.deepEqual(f.created, [])
    assert.match(html(f), /създаването на резервации е изключено/)
  } finally { f.close() }
})

test('malformed availability stays a technical failure, and an external business never loads or submits native availability', async () => {
  const f = fixture()
  try {
    f.edit('serviceId', 'service-1'); f.chooseDate('2028-02-02')
    f.requests[0].respond({ notSlots: [] }); await f.settle()
    assert.match(html(f), /Не успяхме да заредим свободните часове/)
    assert.equal(submitButton(f).props.disabled, true)
  } finally { f.close() }
  const external = fixture({ business: { ...business, booking_mode: 'external' } })
  try {
    external.edit('serviceId', 'service-1'); external.chooseDate('2028-02-02'); await external.submit(); await external.settle()
    assert.deepEqual(external.requests, []); assert.deepEqual(external.sessions, [])
    assert.match(html(external), /Резервациите се управляват от външната система/)
  } finally { external.close() }
})

test('unmount aborts availability and late response cannot update a closed dialog', async () => {
  const f = fixture()
  try {
    f.edit('serviceId', 'service-1'); f.chooseDate('2028-02-02')
    f.h.dispose()
    assert.equal(f.requests[0].init.signal.aborted, true)
    f.requests[0].respond({ slots: [slot()] }); await f.settle()
    assert.deepEqual(f.created, [])
    assert.equal(f.dialogState.open, false)
  } finally { f.close() }
})
