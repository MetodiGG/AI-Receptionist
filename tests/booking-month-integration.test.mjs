import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { DateTime } from 'luxon'
import * as monthHelpers from '../lib/monthly-booking-calendar.mjs'
import * as bookingWindow from '../lib/booking-window.mjs'
import * as profileUi from '../lib/business-profile-ui.mjs'

const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const bookingSource = await readFile(new URL('../components/public-booking-page.js', import.meta.url), 'utf8')
const monthSource = await readFile(new URL('../components/monthly-booking-calendar.js', import.meta.url), 'utf8')
async function compile(source, filename) {
  return (await transform(source, { filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })).code
}
const bookingCode = await compile(`${bookingSource}\nexport { BookingPanel, BusinessBookingExperience }`, 'public-booking-page.js')
const monthCode = await compile(monthSource, 'monthly-booking-calendar.js')
const tick = () => new Promise(resolve => setImmediate(resolve))
const sameDependencies = (before, after) => before && after && before.length === after.length && before.every((value, index) => Object.is(value, after[index]))

// A small deterministic hook runner executes the actual SWC-compiled component
// and effects. It does not invent component behavior or need a browser/DOM.
function hookRunner(code, extraStubs = {}, options = {}) {
  const hooks = [], timers = new Map()
  let index = 0, dirty = false, effects = [], tree, props, component
  let now = Date.parse('2028-02-02T07:59:50Z'), timerId = 0
  const mockReact = { ...React,
    useState(initial) {
      const slot = index++
      if (!hooks[slot]) hooks[slot] = { value: typeof initial === 'function' ? initial() : initial }
      return [hooks[slot].value, next => {
        const value = typeof next === 'function' ? next(hooks[slot].value) : next
        if (!Object.is(hooks[slot].value, value)) { hooks[slot].value = value; dirty = true }
      }]
    },
    useRef(initial) { const slot = index++; return (hooks[slot] ||= { current: initial }) },
    useId() { const slot = index++; return `test-heading-${slot}` },
    useMemo(create, dependencies) {
      const slot = index++
      if (!hooks[slot] || !sameDependencies(hooks[slot].dependencies, dependencies)) hooks[slot] = { value: create(), dependencies }
      return hooks[slot].value
    },
    useEffect(create, dependencies) {
      const slot = index++
      if (!hooks[slot] || !sameDependencies(hooks[slot].dependencies, dependencies)) effects.push({ slot, create, dependencies })
    },
    useCallback(callback, dependencies) { return mockReact.useMemo(() => callback, dependencies) },
    useImperativeHandle(ref, create, dependencies) { mockReact.useEffect(() => { if (ref) ref.current = create() }, dependencies) },
  }
  const module = { exports: {} }
  const stubs = { react: mockReact, '../lib/monthly-booking-calendar.mjs': { ...monthHelpers, createMonthAvailabilityCache: options => monthHelpers.createMonthAvailabilityCache({ ...options, now: () => now }) }, ...extraStubs }
  new Function('require', 'module', 'exports', 'fetch', 'window', 'setInterval', 'clearInterval', 'Date', code)(
    name => name in stubs ? stubs[name] : require(name), module, module.exports,
    options.fetch || (() => assert.fail('Unexpected network request')),
    { matchMedia: () => ({ matches: true }) },
    callback => { const id = ++timerId; timers.set(id, callback); return id }, id => timers.delete(id), { now: () => now },
  )
  function flush() {
    let renders = 0
    do {
      assert.ok(++renders < 30, 'component effects must settle without a render loop')
      dirty = false; index = 0; effects = []
      tree = component(props)
      const pending = effects
      for (const effect of pending) hooks[effect.slot]?.cleanup?.()
      for (const effect of pending) hooks[effect.slot] = { dependencies: effect.dependencies, cleanup: effect.create() }
    } while (dirty)
    return tree
  }
  return {
    exports: module.exports,
    mount(name, nextProps) { component = module.exports[name]; props = nextProps; return flush() },
    render(nextProps = props) { props = nextProps; return flush() },
    flush,
    advance(milliseconds) { now += milliseconds; for (const callback of timers.values()) callback(); return flush() },
    async settle() { await tick(); return flush() },
    dispose() { for (const hook of hooks) hook?.cleanup?.(); timers.clear() },
  }
}
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) { node.forEach(child => elements(child, predicate, result)); return result }
  if (!React.isValidElement(node)) return result
  if (predicate(node)) result.push(node)
  elements(node.props.children, predicate, result)
  return result
}
function actualSlot(date = '2028-02-02', time = '10:00') {
  const start = DateTime.fromISO(`${date}T${time}`, { zone: 'Europe/Sofia' })
  return { startsAt: start.toUTC().toISO(), endsAt: start.plus({ minutes: 30 }).toUTC().toISO(), localTime: time, localEndTime: start.plus({ minutes: 30 }).toFormat('HH:mm'), staffId: 'actual-staff', staffName: 'Actual Specialist' }
}
function monthPayload() {
  const first = DateTime.fromISO('2028-02-01', { zone: 'Europe/Sofia' })
  return { month: '2028-02', timezone: 'Europe/Sofia', today: '2028-02-02', firstBookableDate: '2028-02-02', lastBookableDate: '2028-04-02', generatedAt: '2028-02-02T07:59:50Z', days: Array.from({ length: 29 }, (_, index) => ({ date: first.plus({ days: index }).toISODate(), slots: index === 1 ? [actualSlot()] : [] })) }
}

test('actual calendar defers expiry callbacks while a booking is in flight and applies them immediately after unlock', async () => {
  const changes = [], invalidations = [], loading = []
  const props = { business: { id: 'actual-business', slug: 'actual-studio', timezone: 'Europe/Sofia', booking_window_days: 60 }, serviceId: 'actual-service', selectedDate: '2028-02-02', previewMonthLoader: async () => monthPayload(), onData: data => changes.push(data), onInvalidateSelection: () => invalidations.push(true), onLoadingChange: value => loading.push(value) }
  const runner = hookRunner(monthCode)
  try {
    runner.mount('MonthlyBookingCalendar', props)
    let tree = await runner.settle()
    assert.equal(tree.props.status, 'ready')
    assert.equal(changes.length, 1)
    assert.equal(invalidations.length, 0)
    assert.equal(loading.at(-1), false)
    runner.advance(1000)
    assert.equal(changes.length, 1, 'an unchanged clock tick must not update the parent')
    runner.render({ ...props, disabled: true })
    tree = runner.advance(19_000)
    assert.equal(tree.props.calendar.find(day => day?.date === '2028-02-02').state, 'unavailable')
    assert.equal(changes.length, 1, 'an in-flight POST keeps its original selected data')
    assert.equal(invalidations.length, 0, 'confirmation date must not be cleared by the expiry timer')
    runner.render({ ...props, disabled: false })
    assert.equal(changes.length, 2)
    assert.equal(changes.at(-1).days[1].slots.length, 0)
    assert.equal(invalidations.length, 1)
  } finally { runner.dispose() }
})

test('actual calendar makes malformed payloads retryable and publishes a fresh same-count response after refresh', async () => {
  const published = []
  let calls = 0
  const props = { business: { id: 'actual-business', slug: 'actual-studio', timezone: 'Europe/Sofia', booking_window_days: 60 }, serviceId: 'actual-service', onData: data => published.push(data), previewMonthLoader: async () => {
    calls++
    const data = monthPayload()
    if (calls === 1) return { ...data, days: [] }
    if (calls > 2) data.days[1].slots = [actualSlot('2028-02-02', '11:00')]
    return data
  } }
  const runner = hookRunner(monthCode)
  try {
    runner.mount('MonthlyBookingCalendar', props)
    let tree = await runner.settle()
    assert.equal(tree.props.status, 'error')
    assert.ok(tree.props.calendar.filter(Boolean).filter(day => day.date >= '2028-02-02').every(day => day.state === 'unknown'))
    assert.equal(published.length, 0)
    tree.props.onRetry()
    runner.flush()
    tree = await runner.settle()
    assert.equal(tree.props.status, 'ready')
    assert.equal(published.length, 1)
    runner.render({ ...props, refreshKey: 1 })
    await runner.settle()
    assert.equal(published.length, 2, 'a new request generation matters even when all per-day counts are identical')
    assert.equal(published.at(-1).days[1].slots[0].localTime, '11:00')
  } finally { runner.dispose() }
})

test('actual calendar ignores an aborted previous service response and forces revalidation when the booking mode returns', async () => {
  let oldResolve, loads = 0
  const old = new Promise(resolve => { oldResolve = resolve })
  const published = []
  const props = { business: { id: 'actual-business', slug: 'actual-studio', timezone: 'Europe/Sofia', booking_window_days: 60 }, serviceId: 'old-service', onData: data => published.push(data), previewMonthLoader: async ({ serviceId }) => { loads++; return serviceId === 'old-service' ? old : monthPayload() } }
  const runner = hookRunner(monthCode)
  try {
    runner.mount('MonthlyBookingCalendar', props)
    await tick()
    runner.render({ ...props, serviceId: 'new-service' })
    await runner.settle()
    assert.equal(published.length, 1)
    oldResolve({ ...monthPayload(), generatedAt: '2028-02-01T00:00:00Z' })
    await runner.settle()
    assert.equal(published.length, 1)
    runner.render({ ...props, serviceId: 'new-service', active: false })
    runner.render({ ...props, serviceId: 'new-service', active: true })
    await runner.settle()
    assert.equal(loads, 3)
    assert.equal(published.length, 2)
  } finally { runner.dispose() }
})

const Empty = () => null
const MonthStub = () => null
const business = { id: 'actual-business', slug: 'actual-studio', timezone: 'Europe/Sofia', services: [{ id: 'actual-service', name: 'Actual Service', duration_min: 30, price: 20, currency: 'EUR' }], staff: [{ id: 'actual-staff', name: 'Actual Specialist' }], staffServices: [] }
const panelStubs = {
  'next/link': Empty, 'next/navigation': { useParams: () => ({}), useRouter: () => ({}) }, 'react-dom': { flushSync: callback => callback() },
  './brand-logo': { BrandLogo: Empty }, './guided-booking-chat': { GuidedBookingChat: Empty }, './booking-intake-fields': { BookingIntakeFields: Empty, BookingIntakeSummary: Empty },
  './booking-confirmation-actions': { BookingConfirmationActions: Empty }, '../lib/localized-api-message.mjs': { localizedApiMessage: error => error?.message || 'Booking failed' },
  './language-switch': { LanguageSwitch: Empty }, './home-link': { HomeLink: Empty }, '../hooks/use-public-locale': { usePublicLocale: () => ({ locale: 'en' }) },
  '../lib/booking-window.mjs': bookingWindow, './monthly-booking-calendar': { MonthlyBookingCalendar: MonthStub }, '../lib/supabase': { hasSupabaseConfig: false },
  '../lib/notification-copy.mjs': { notificationNotice: () => '' }, '../lib/product-events-client': { trackProductEvent: () => {} }, '../lib/booking-details-navigation.mjs': { focusBookingDetails: () => {} },
  './business-profile': { BusinessProfileHeader: Empty, BusinessProfileInformation: Empty, BusinessServiceList: Empty }, './icon': { Icon: Empty }, './business-reviews': { BusinessReviews: Empty, useBusinessReviews: () => ({}) },
  '../lib/booking-mode.mjs': { isExternalBooking: item => item.booking_mode === 'external' }, '../lib/business-profile-ui.mjs': profileUi, './outbound-booking-button': { OutboundBookingButton: Empty }, './profile-view-tracker': { ProfileViewTracker: Empty },
}
function mountChosenPanel(fetch) {
  const ref = { current: null }, busy = []
  const runner = hookRunner(bookingCode, panelStubs, { fetch })
  runner.mount('BookingPanel', { business, locale: 'en', ref, onServiceChange: () => {}, onBusyChange: value => busy.push(value) })
  ref.current.chooseService('actual-service')
  let tree = runner.flush()
  let calendar = elements(tree, item => item.type === MonthStub)[0]
  calendar.props.onSelectDate('2028-02-02', [actualSlot()])
  tree = runner.flush()
  const timeGroup = elements(tree, item => item.props.className === 'profile-time-slots')[0]
  elements(timeGroup, item => item.type === 'button')[0].props.onClick()
  tree = runner.flush()
  for (const [type, value] of [['name', 'Actual Customer'], ['tel', '+359888123456'], ['email', 'actual@example.com'], ['checkbox', true]]) {
    const input = elements(tree, item => item.type === 'input' && (type === 'name' ? item.props.name === 'name' : item.props.type === type))[0]
    input.props.onChange({ target: { value, checked: value } })
    tree = runner.flush()
  }
  return { runner, ref, busy, get tree() { return runner.flush() }, calendar: () => elements(runner.flush(), item => item.type === MonthStub)[0] }
}

test('actual native panel keeps its booking POST payload and rejects duplicate confirms synchronously', async () => {
  let finish
  const calls = []
  const panel = mountChosenPanel((url, init) => { calls.push({ url, init }); return new Promise(resolve => { finish = resolve }) })
  try {
    const form = elements(panel.tree, item => item.type === 'form')[0]
    const first = form.props.onSubmit({ preventDefault() {} })
    await form.props.onSubmit({ preventDefault() {} })
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, '/api/public/actual-studio/bookings')
    assert.equal(calls[0].init.method, 'POST')
    assert.deepEqual(JSON.parse(calls[0].init.body), { serviceId: 'actual-service', staffId: 'actual-staff', startsAt: actualSlot().startsAt, customer: { name: 'Actual Customer', phone: '+359888123456', email: 'actual@example.com' }, notes: '', intake: {}, locale: 'en', consent: true, source: 'web' })
    assert.equal(panel.calendar().props.disabled, true)
    assert.equal(panel.ref.current.chooseService('actual-service'), false)
    assert.deepEqual(panel.busy, [true])
    finish({ ok: true, json: async () => ({ booking: { appointment: { id: 'actual-appointment', cancellation_token: 'actual-token' }, staff: business.staff[0] } }) })
    await first
    assert.ok(elements(panel.tree, item => item.props.className === 'booking-card booking-success').length)
    assert.deepEqual(panel.busy, [true, false])
  } finally { panel.runner.dispose() }
})

test('actual native conflict clears the chosen time and forces the calendar to refresh without carrying old slots', async () => {
  const panel = mountChosenPanel(async () => ({ ok: false, json: async () => ({ error: { code: 'SLOT_UNAVAILABLE', message: 'That time was just booked.' } }) }))
  try {
    await elements(panel.tree, item => item.type === 'form')[0].props.onSubmit({ preventDefault() {} })
    const calendar = panel.calendar()
    assert.equal(calendar.props.refreshKey, 1)
    assert.equal(calendar.props.selectedDate, '2028-02-02')
    assert.equal(elements(panel.tree, item => item.type === 'form').length, 0)
    assert.equal(elements(panel.tree, item => item.props.className === 'profile-time-slots').length, 0)
    calendar.props.onData({ days: [{ date: '2028-02-02', slots: [actualSlot('2028-02-02', '11:00')] }] })
    const tree = panel.runner.flush()
    assert.equal(elements(tree, item => item.type === 'form').length, 0)
    const times = elements(elements(tree, item => item.props.className === 'profile-time-slots')[0], item => item.type === 'button')
    assert.equal(times.length, 1)
    assert.match(times[0].props['aria-label'], /11:00/)
    assert.doesNotMatch(times[0].props['aria-label'], /10:00/)
  } finally { panel.runner.dispose() }
})

test('public integration removes the fourteen-day strip and selected-date empty blocks while preserving shared busy/selection contracts', () => {
  assert.doesNotMatch(bookingSource, /resolveVisibleBookingDays|date-strip|selected-date-panel|No available times for this date|Next \$\{dates\.length\} days/)
  for (const prop of ['onSelectDate={chooseDate}', 'onInvalidateSelection={invalidateSelection}', 'onData={monthDataChanged}', 'onLoadingChange={monthLoadingChanged}', 'refreshKey={availabilityRevision}', 'disabled={submitting}', 'active={active}']) assert.ok(bookingSource.includes(prop), prop)
  assert.match(bookingSource, /date && !monthLoading && visibleSlots\.length > 0/)
  assert.match(bookingSource, /setSlot\(current => current && nextSlots\.some/)
  assert.match(bookingSource, /disabled=\{busy\} aria-pressed=\{mode === 'booking'\}/)
  assert.match(bookingSource, /disabled=\{busy\} aria-pressed=\{mode === 'chat'\}/)
  assert.match(bookingSource, /key=\{profileBookingContextKey\(business\)\}/)
})

test('fictional calendar previews are production-gated, never use production provider configuration and keep local state paths separate', async () => {
  const route = await readFile(new URL('../app/api/dev/business-profile/month/route.js', import.meta.url), 'utf8')
  const fixture = await readFile(new URL('../app/dev/business-profile/page.js', import.meta.url), 'utf8')
  assert.match(route, /process\.env\.NODE_ENV === 'production'[^\n]*status: 404/)
  assert.match(fixture, /process\.env\.NODE_ENV === 'production'\) notFound\(\)/)
  assert.match(route, /buildMonthlyAvailability/)
  assert.doesNotMatch(route, /getSupabase|supabase-admin|createPublicBooking|processPendingNotifications|RESEND|SUPABASE|GOOGLE/)
  assert.match(bookingSource, /previewMonthLoader=\{preview \? loadPreviewMonth : undefined\}/)
  assert.match(bookingSource, /if \(preview\) \{[\s\S]*?return\n    \}\n    if \(!service/)
  assert.match(fixture, /booking_window_days: 60/)
})

test('mode artwork resolves to the intended local assets and the calendar stylesheet is loaded globally', async () => {
  for (const filename of ['calendar-3d-v1.webp', 'assistant-3d-v1.webp']) {
    assert.ok(bookingSource.includes(`/booking-art/${filename}`))
    assert.ok((await stat(new URL(`../public/booking-art/${filename}`, import.meta.url))).size > 0)
  }
  const layout = await readFile(new URL('../app/layout.js', import.meta.url), 'utf8')
  assert.match(layout, /import '\.\/monthly-booking-calendar\.css'/)
})
