import * as brandLoading from './helpers/brand-loading.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DateTime } from 'luxon'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const filename = '../components/admin-business-report.js'
const source = await readFile(new URL(filename, import.meta.url), 'utf8')
const { code } = await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
let activeHarness
const fakeReact = { ...React, useId: () => 'test-report', useState: value => activeHarness.state(value), useRef: value => activeHarness.ref(value), useEffect: (effect, dependencies) => activeHarness.effect(effect, dependencies) }
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
    update(patch, effects = true) { h.props = { ...h.props, ...patch }; h.render(); if (effects) h.flush() },
    dispose() { disposed = true; pending.length = 0; slots.forEach(slot => slot.value?.cleanup?.()) },
  }
  h.render(); return h
}
const business = { id: 'fictional-business-one', name: 'QA Studio', timezone: 'Europe/Sofia', booking_mode: 'native' }
const statuses = { booked: 1, confirmed: 1, done: 1, cancelled: 1, no_show: 1 }
function response(request, patch = {}) {
  const url = new URL(request.url, 'https://local.invalid'), query = Object.fromEntries(url.searchParams)
  return {
    business: { id: decodeURIComponent(url.pathname.split('/')[4]), name: 'QA Studio', timezone: 'Europe/Sofia', bookingMode: 'native' },
    period: { from: query.from, to: query.to, basis: query.basis, timezone: 'Europe/Sofia' },
    summary: { bookings: 5, customers: 2, statuses }, filtered: { bookings: query.status === 'all' ? 5 : 1, customers: query.status === 'all' ? 2 : 1 },
    view: query.view, page: Number(query.page), pageSize: 25, totalRows: 1, totalPages: 1,
    rows: query.view === 'customers' ? [{ id: 'fictional-customer', name: 'QA Customer', phone: '+359000000000', email: 'qa@example.invalid', bookings: 5, statuses, firstVisitAt: '2026-11-01T08:00:00Z', lastVisitAt: '2026-11-05T09:00:00Z' }] : [{ id: 'fictional-booking', startsAt: '2026-11-01T08:00:00Z', endsAt: '2026-11-01T08:45:00Z', createdAt: '2026-10-30T08:00:00Z', status: query.status === 'all' ? 'done' : query.status, source: 'manual', customer: { id: 'fictional-customer', name: 'QA Customer', phone: '+359000000000', email: 'qa@example.invalid' }, service: { id: 'fictional-service', name: 'QA Service' }, staff: { id: 'fictional-staff', name: 'QA Staff' } }],
    ...patch,
  }
}
function fixture(patch = {}) {
  const requests = []
  const send = (url, init) => {
    let resolve, reject
    const promise = new Promise((yes, no) => { resolve = yes; reject = no })
    requests.push({ url, init, reject, respond(value) { resolve(value || response(this)) } })
    return promise
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => name === 'react' ? fakeReact : name === 'luxon' ? { DateTime } : (name === './brand-loading' ? brandLoading : require(name)), module, module.exports)
  const h = harness(module.exports.AdminBusinessReport, { business, send, ...patch })
  h.flush()
  const f = {
    h, requests,
    html: () => renderToStaticMarkup(h.tree),
    field: name => elements(h.tree, node => node.props.name === name)[0],
    edit(name, value, effects = true) { f.field(name).props.onChange({ target: { value } }); h.render(); if (effects) h.flush() },
    click(title, effects = true) { const button = elements(h.tree, node => node.type === 'button' && node.props.children === title)[0]; assert.ok(button, title); button.props.onClick(); h.render(); if (effects) h.flush() },
    apply() { elements(h.tree, node => node.type === 'form')[0].props.onSubmit({ preventDefault() {} }); h.render(); h.flush() },
    async settle() { for (let i = 0; i < 15; i++) { await Promise.resolve(); h.flush() } },
    close() { h.dispose() },
  }
  return f
}

test('actual report defaults to thirty business-local days and sends one read-only no-store request', async () => {
  const f = fixture()
  try {
    await f.settle()
    assert.equal(f.requests.length, 1)
    const query = Object.fromEntries(new URL(f.requests[0].url, 'https://local.invalid').searchParams)
    assert.equal(query.to, DateTime.now().setZone('Europe/Sofia').toISODate())
    assert.equal(query.from, DateTime.fromISO(query.to).minus({ days: 29 }).toISODate())
    assert.deepEqual({ ...query, from: null, to: null }, { from: null, to: null, basis: 'visit', status: 'all', view: 'bookings', page: '1', limit: '25' })
    assert.equal(f.requests[0].init.method, 'GET')
    assert.equal(f.requests[0].init.cache, 'no-store')
    f.requests[0].respond(); await f.settle()
    assert.match(f.html(), /QA Customer/)
    assert.match(f.html(), /QA Service/)
    assert.match(f.html(), /Завършени/)
    assert.match(f.html(), /Ръчно добавена/)
    assert.match(f.html(), /10:00/)
  } finally { f.close() }
})

test('date drafts do not fetch; Apply validates calendar dates, order, inclusive 366-day limit and preserves basis', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.settle(); f.requests[0].respond(); await f.settle()
    f.edit('reportFrom', '2026-02-30'); f.apply(); await f.settle()
    assert.match(f.html(), /Enter valid dates/); assert.equal(f.requests.length, 1)
    f.edit('reportFrom', '2026-12-01'); f.edit('reportTo', '2026-11-01'); f.apply(); await f.settle()
    assert.match(f.html(), /Enter valid dates/); assert.equal(f.requests.length, 1)
    f.edit('reportFrom', '2024-01-01'); f.edit('reportTo', '2025-01-01'); f.apply(); await f.settle()
    assert.match(f.html(), /up to 366 days/); assert.equal(f.requests.length, 1)
    f.edit('reportTo', '2024-12-31'); f.edit('reportBasis', 'created'); await f.settle()
    assert.equal(f.requests.length, 1); assert.match(f.html(), /Unapplied changes/)
    f.apply(); await f.settle()
    assert.equal(f.requests.length, 2)
    const query = Object.fromEntries(new URL(f.requests[1].url, 'https://local.invalid').searchParams)
    assert.equal(query.from, '2024-01-01'); assert.equal(query.to, '2024-12-31'); assert.equal(query.basis, 'created')
    assert.doesNotMatch(f.html(), /QA Customer/)
  } finally { f.close() }
})

test('rapid status/view changes synchronously hide previous PII and ignore responses even if abort is ignored', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.settle(); f.requests[0].respond(); await f.settle()
    f.edit('reportStatus', 'confirmed', false)
    assert.doesNotMatch(f.html(), /QA Customer|qa@example.invalid/)
    f.h.flush(); await f.settle()
    const slow = f.requests[1]
    f.click('Customers'); await f.settle()
    assert.equal(slow.init.signal.aborted, true)
    const newest = f.requests[2]
    slow.respond(response(slow, { rows: [{ ...response(slow).rows[0], customer: { name: 'STALE PRIVATE CONTACT' } }] })); await f.settle()
    assert.doesNotMatch(f.html(), /STALE PRIVATE CONTACT|QA Customer/)
    newest.respond(); await f.settle()
    assert.match(f.html(), /QA Customer/); assert.match(f.html(), /First \/ last visit in this report/)
    assert.match(f.html(), /Totals include all statuses/)
    assert.equal(new URL(newest.url, 'https://local.invalid').searchParams.get('status'), 'confirmed')
  } finally { f.close() }
})

test('business identity changes hide PII before effects, reset date/filter state and invalidate previous requests', async () => {
  const f = fixture()
  try {
    await f.settle(); f.requests[0].respond(); await f.settle()
    f.edit('reportStatus', 'done'); await f.settle()
    const old = f.requests.at(-1)
    f.h.update({ business: { ...business, id: 'fictional-business-two', name: 'Second' } }, false)
    assert.doesNotMatch(f.html(), /QA Customer|qa@example.invalid/)
    assert.equal(f.field('reportStatus').props.value, 'all')
    f.h.flush(); await f.settle()
    assert.equal(old.init.signal.aborted, true)
    const current = f.requests.at(-1)
    old.respond(); await f.settle(); assert.doesNotMatch(f.html(), /QA Customer/)
    current.respond(); await f.settle(); assert.match(f.html(), /QA Customer/)
  } finally { f.close() }
})

test('mismatched business, period and view responses fail closed with retry; technical failures are not empty reports', async () => {
  for (const patch of [{ business: { id: 'foreign-business' } }, { period: { from: '1999-01-01' } }, { view: 'customers' }]) {
    const f = fixture({ locale: 'en' })
    try {
      await f.settle(); f.requests[0].respond(response(f.requests[0], patch)); await f.settle()
      assert.match(f.html(), /We could not load this report/)
      assert.doesNotMatch(f.html(), /QA Customer|No records for this period/)
      f.click('Retry'); await f.settle(); assert.equal(f.requests.length, 2)
      f.requests[1].reject({ code: 'UNAUTHORIZED' }); await f.settle()
      assert.match(f.html(), /Administrator access could not be verified/)
    } finally { f.close() }
  }
})

test('pagination uses applied dates, retains status, hides previous rows and resets on view change', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.settle(); f.requests[0].respond(response(f.requests[0], { totalRows: 28, totalPages: 2 })); await f.settle()
    f.edit('reportFrom', '2020-01-01')
    f.click('Next', false); assert.doesNotMatch(f.html(), /QA Customer/)
    f.h.flush(); await f.settle()
    const next = f.requests.at(-1), query = new URL(next.url, 'https://local.invalid').searchParams
    assert.equal(query.get('page'), '2'); assert.notEqual(query.get('from'), '2020-01-01')
    next.respond(response(next, { totalRows: 28, totalPages: 2 })); await f.settle()
    assert.match(f.html(), /Page 2 \/ 2/)
    f.click('Customers'); await f.settle()
    assert.equal(new URL(f.requests.at(-1).url, 'https://local.invalid').searchParams.get('page'), '1')
  } finally { f.close() }
})

test('erased and missing references stay redacted, unknown sources are not inferred, all actual statuses remain', async () => {
  const f = fixture({ locale: 'en' })
  try {
    await f.settle()
    const base = response(f.requests[0])
    f.requests[0].respond({ ...base, rows: [{ ...base.rows[0], customer: { id: 'erased', name: 'Изтрит клиент', phone: null, email: null }, service: null, staff: null, source: 'untrusted private note', status: 'no_show' }, { ...base.rows[0], id: 'second-row', customer: null }] }); await f.settle()
    assert.match(f.html(), /Изтрит клиент|Unavailable customer/)
    assert.match(f.html(), /Unavailable service/); assert.match(f.html(), /No-shows/)
    assert.match(f.html(), /Other/); assert.doesNotMatch(f.html(), /untrusted private note/)
  } finally { f.close() }
})

test('external/phone modes distinguish real GoRez records, empty reports show no fake clients, preview never requests', async () => {
  for (const mode of ['external', 'phone']) {
    const f = fixture({ business: { ...business, booking_mode: mode }, locale: 'en' })
    try {
      await f.settle(); f.requests[0].respond(response(f.requests[0], { summary: { bookings: 0, customers: 0, statuses: Object.fromEntries(Object.keys(statuses).map(key => [key, 0])) }, rows: [], filtered: { bookings: 0, customers: 0 }, totalRows: 0, totalPages: 0 })); await f.settle()
      assert.match(f.html(), /clicks are not reservations/); assert.match(f.html(), /No records for this period/); assert.doesNotMatch(f.html(), /QA Customer/)
    } finally { f.close() }
  }
  const f = fixture({ preview: true })
  try { await f.settle(); assert.equal(f.requests.length, 0); assert.match(f.html(), /Локален преглед/); assert.match(f.html(), /Няма записи/); assert.doesNotMatch(f.html(), /QA Customer/) } finally { f.close() }
})

test('unmounted report aborts requests and late private responses cannot update the disposed tree', async () => {
  const f = fixture()
  await f.settle(); const request = f.requests[0], before = f.html()
  f.close(); assert.equal(request.init.signal.aborted, true)
  request.respond(); await f.settle(); assert.equal(f.html(), before)
})

test('direct report integration is separate from expensive management and includes statistics and guarded local preview', async () => {
  const platform = await readFile(new URL('../components/platform-admin.js', import.meta.url), 'utf8')
  const analytics = await readFile(new URL('../components/admin-referral-analytics.js', import.meta.url), 'utf8')
  const page = await readFile(new URL('../app/dev/admin-business-report/page.js', import.meta.url), 'utf8')
  const openReport = platform.slice(platform.indexOf('function openReport(row)'), platform.indexOf('async function open(row)'))
  assert.doesNotMatch(openReport, /adminRequest|fetch\(/)
  assert.match(platform, /onClick=\{\(\)=>openReport\(row\)\}/)
  assert.match(platform, /onClick=\{\(\)=>openReport\(b\)\}/)
  assert.match(platform, /businesses=\{overview.businesses\} onReport=\{openReport\}/)
  assert.match(platform, /session&&error!=='FORBIDDEN'&&error!=='UNAUTHORIZED'&&reportBusiness&&reportBusiness.reportActorId===\(preview\?'local-preview':session.user\?\.id\)&&<Dialog/)
  assert.match(openReport, /setReportBusiness\(\{\.\.\.row,reportActorId:actorId\}\)/)
  assert.match(platform, /key=\{`\$\{reportBusiness.reportActorId\}:\$\{reportBusiness.id\}`\}/)
  assert.match(analytics, /businesses.find\(row=>row.id===businessId\)/)
  assert.match(page, /NODE_ENV==='production'\) notFound|NODE_ENV === 'production'\) notFound/)
  assert.doesNotMatch(source, /localStorage|sessionStorage|console\.(log|error)|JSON.stringify\(value\)/)
})
