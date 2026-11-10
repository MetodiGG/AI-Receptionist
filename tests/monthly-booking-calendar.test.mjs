import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DateTime } from 'luxon'
import * as calendarHelpers from '../lib/monthly-booking-calendar.mjs'

const { availabilityClock, bookingCalendarWindow, bookingMonthGrid, calendarMonthTitle, calendarWeekdays, createMonthAvailabilityCache, filterMonthlyAvailability, monthAvailabilityKey, monthlyAvailabilityDaySignature, shiftCalendarMonth, validateMonthlyAvailability } = calendarHelpers
const require = createRequire(import.meta.url)
const { loadBindings, transform } = require('next/dist/build/swc')
await loadBindings()
const source = await readFile(new URL('../components/monthly-booking-calendar.js', import.meta.url), 'utf8')
const { code } = await transform(source, { filename: 'monthly-booking-calendar.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } })
const compiled = { exports: {} }
new Function('require', 'module', 'exports', code)(name => name === '../lib/monthly-booking-calendar.mjs' ? calendarHelpers : require(name), compiled, compiled.exports)
const { MonthlyBookingCalendar, MonthlyBookingCalendarView } = compiled.exports

function slot(date, time = '10:00', zone = 'Europe/Sofia') {
  const start = DateTime.fromISO(`${date}T${time}`, { zone })
  return { startsAt: start.toUTC().toISO(), endsAt: start.plus({ minutes: 30 }).toUTC().toISO(), localTime: time, localEndTime: start.plus({ minutes: 30 }).toFormat('HH:mm'), staffId: 'staff-actual', staffName: 'Actual Specialist' }
}
function payload(month = '2028-02') {
  const first = DateTime.fromISO(`${month}-01`, { zone: 'Europe/Sofia' })
  return { month, timezone: 'Europe/Sofia', today: `${month}-01`, firstBookableDate: `${month}-01`, lastBookableDate: first.endOf('month').toISODate(), generatedAt: `${month}-01T00:00:00.000Z`, days: Array.from({ length: first.daysInMonth }, (_, index) => {
    const date = first.plus({ days: index }).toISODate()
    return { date, slots: index === 1 ? [slot(date)] : [] }
  }) }
}
function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}
const tick = () => new Promise(resolve => setImmediate(resolve))
const params = { business: { id: 'business-actual', slug: 'actual-studio' }, serviceId: 'service-actual', staffId: '', month: '2028-02' }
const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props))
function elements(node, predicate, result = []) {
  if (Array.isArray(node)) { node.forEach(child => elements(child, predicate, result)); return result }
  if (!React.isValidElement(node)) return result
  if (predicate(node)) result.push(node)
  elements(node.props.children, predicate, result)
  return result
}

test('calendar uses the actual inclusive configured horizon, with the server default of sixty days', () => {
  const now = '2026-10-31T22:30:00Z'
  const range = bookingCalendarWindow({ timezone: 'Europe/Sofia', booking_window_days: 60 }, now)
  assert.equal(range.today, '2026-11-01')
  assert.equal(range.lastBookableDate, '2026-12-31')
  assert.equal(range.firstMonth, '2026-11')
  assert.equal(range.lastMonth, '2026-12')
  assert.equal(bookingCalendarWindow({ timezone: 'Europe/Sofia', booking_window_days: 90 }, now).lastBookableDate, '2027-01-30')
  for (const days of [undefined, null, 0]) assert.equal(bookingCalendarWindow({ timezone: 'Europe/Sofia', booking_window_days: days }, now).lastBookableDate, '2026-12-31')
  assert.equal(bookingCalendarWindow({ timezone: 'America/Los_Angeles', booking_window_days: 1 }, '2026-11-01T01:00:00Z').today, '2026-10-31')
})

test('Monday-first months align leap days, year rollover and both DST transitions without skipped or duplicate dates', () => {
  for (const [month, count, leading] of [['2028-02', 29, 1], ['2027-02', 28, 0], ['2026-03', 31, 6], ['2026-10', 31, 3]]) {
    const grid = bookingMonthGrid({ month, timezone: 'Europe/Sofia', firstBookableDate: `${month}-01`, lastBookableDate: `${month}-31` })
    const dates = grid.filter(Boolean)
    assert.equal(grid.length % 7, 0)
    assert.equal(grid.findIndex(Boolean), leading)
    assert.equal(dates.length, count)
    assert.equal(new Set(dates.map(day => day.date)).size, count)
    assert.equal(dates.at(-1).day, count)
  }
  assert.equal(shiftCalendarMonth('2026-12', 1), '2027-01')
  assert.equal(shiftCalendarMonth('2027-01', -1), '2026-12')
  assert.equal(shiftCalendarMonth('2026-13', 1), null)
  assert.equal(calendarWeekdays('en')[0].full, 'Monday')
  assert.equal(calendarWeekdays('bg')[0].full, 'понеделник')
  assert.equal(calendarMonthTitle('2028-02', 'Europe/Sofia', 'en'), 'February 2028')
  assert.equal(calendarMonthTitle('2028-02', 'Europe/Sofia', 'bg'), 'февруари 2028')
})

test('only supplied actual slots make dates available; missing/loading/error days remain neutral unknown', () => {
  const base = { month: '2028-02', timezone: 'Europe/Sofia', today: '2028-02-01', firstBookableDate: '2028-02-01', lastBookableDate: '2028-02-20', days: payload().days.slice(0, 2) }
  const grid = bookingMonthGrid({ ...base, status: 'ready' }).filter(Boolean)
  assert.equal(grid[0].state, 'unavailable')
  assert.equal(grid[1].state, 'available')
  assert.deepEqual(grid[1].slots, payload().days[1].slots)
  assert.equal(grid[2].state, 'unknown')
  assert.equal(grid[19].state, 'unknown')
  assert.equal(grid[20].state, 'outside')
  for (const status of ['loading', 'error']) {
    const unknown = bookingMonthGrid({ ...base, status }).filter(Boolean)
    assert.ok(unknown.slice(0, 20).every(day => day.state === 'unknown'))
    assert.ok(unknown.slice(20).every(day => day.state === 'outside'))
  }
})

test('elapsed slots and notice-expired slots are removed using actual startsAt, without fabricating availability', () => {
  const data = { ...payload(), days: [{ date: '2028-02-02', slots: [slot('2028-02-02', '10:00'), slot('2028-02-02', '10:15'), slot('2028-02-02', '11:00'), { ...slot('2028-02-02'), startsAt: 'invalid' }] }] }
  const filtered = filterMonthlyAvailability(data, { now: '2028-02-02T08:01:00Z', minimumNoticeMinutes: 15 })
  assert.deepEqual(filtered.days[0].slots.map(value => value.localTime), ['11:00'])
  assert.equal(data.days[0].slots.length, 4)
  const received = Date.parse('2028-02-02T07:58:00Z')
  assert.equal(availabilityClock({ generatedAt: '2028-02-02T08:00:00Z' }, received, received + 120_000), Date.parse('2028-02-02T08:02:00Z'))
  assert.equal(availabilityClock({ generatedAt: '2028-02-02T08:00:00Z' }, received, received + 600_000), Date.parse('2028-02-02T08:10:00Z'))
})

test('payload validation rejects mismatched months, invalid dates, repeated dates and non-slot responses', () => {
  assert.equal(validateMonthlyAvailability(payload(), '2028-02').month, '2028-02')
  for (const data of [{ ...payload(), month: '2028-03' }, { ...payload(), days: [{ date: '2028-02-30', slots: [] }] }, { ...payload(), days: [payload().days[0], payload().days[0]] }, { ...payload(), days: [{ date: '2028-02-02', slots: null }] }]) assert.throws(() => validateMonthlyAvailability(data, '2028-02'), /Invalid monthly/)
})

test('partial calendars and malformed or wrong-date slots are technical failures, not ready availability', () => {
  const data = payload()
  for (const days of [[], data.days.slice(1), [...data.days.slice(1), data.days[1]]]) assert.throws(() => validateMonthlyAvailability({ ...data, days }, data.month), /Invalid monthly/)
  const actual = data.days[1].slots[0]
  for (const patch of [{ endsAt: actual.startsAt }, { endsAt: 'invalid' }, { localTime: '25:00' }, { localEndTime: undefined }, { staffName: undefined }, { startsAt: slot('2028-02-03').startsAt }, { localTime: '11:00' }]) {
    const days = data.days.map((day, index) => index === 1 ? { ...day, slots: [{ ...actual, ...patch }] } : day)
    assert.throws(() => validateMonthlyAvailability({ ...data, days }, data.month), /Invalid monthly/, JSON.stringify(patch))
  }
})

test('large month expiry signatures do not trigger parent updates until a returned slot actually expires', () => {
  const data = payload()
  data.days = data.days.map(day => {
    const actual = slot(day.date, '10:00')
    return { ...day, slots: Array.from({ length: 1000 }, (_, index) => ({ ...actual, staffId: `staff-${index}` })) }
  })
  const first = filterMonthlyAvailability(data, { now: '2028-02-01T07:00:00Z' })
  const unchanged = filterMonthlyAvailability(data, { now: '2028-02-01T07:00:01Z' })
  assert.equal(monthlyAvailabilityDaySignature(first), monthlyAvailabilityDaySignature(unchanged))
  assert.notEqual(monthlyAvailabilityDaySignature(first), monthlyAvailabilityDaySignature(filterMonthlyAvailability(data, { now: '2028-02-01T08:00:01Z' })))
  assert.ok(monthlyAvailabilityDaySignature(first).length < 1000)
})

test('cache deduplicates requests, isolates business/service/staff/month, expires after fifteen seconds and stays bounded', async () => {
  let now = 1000
  const loading = deferred()
  const calls = []
  const cache = createMonthAvailabilityCache({ now: () => now, maxEntries: 3, loadMonth: async input => { calls.push(input); return calls.length === 1 ? loading.promise : { call: calls.length } } })
  const first = cache.load(params)
  const duplicate = cache.load({ ...params, business: { ...params.business, name: 'Translated' } })
  await tick()
  assert.equal(calls.length, 1)
  loading.resolve(payload())
  assert.deepEqual(await first, await duplicate)
  now += 14_999
  await cache.load(params)
  assert.equal(calls.length, 1)
  now += 1
  await cache.load(params)
  assert.equal(calls.length, 2)
  for (const patch of [{ serviceId: 'service-other' }, { staffId: 'staff-other' }, { month: '2028-03' }, { business: { id: 'business-other' } }]) await cache.load({ ...params, ...patch })
  assert.equal(calls.length, 6)
  assert.equal(cache.size, 3)
  assert.notEqual(monthAvailabilityKey(params), monthAvailabilityKey({ ...params, staffId: 'staff-other' }))
  assert.notEqual(monthAvailabilityKey(params), monthAvailabilityKey({ ...params, business: { id: 'other' } }))
  cache.dispose()
  assert.equal(cache.size, 0)
})

test('one cancelled subscriber does not abort an identical active request, but the last cancellation does', async () => {
  const loading = deferred()
  let underlying
  const cache = createMonthAvailabilityCache({ loadMonth: input => { underlying = input.signal; return loading.promise } })
  const firstController = new AbortController()
  const secondController = new AbortController()
  const first = cache.load(params, { signal: firstController.signal })
  const second = cache.load(params, { signal: secondController.signal })
  await tick()
  firstController.abort()
  await assert.rejects(first, { name: 'AbortError' })
  assert.equal(underlying.aborted, false)
  secondController.abort()
  await assert.rejects(second, { name: 'AbortError' })
  assert.equal(underlying.aborted, true)
  assert.equal(cache.size, 0)
  loading.resolve(payload())
  await tick()
  assert.equal(cache.size, 0)
})

test('forced refresh and invalidation reject old work even when the loader ignores abort, and failures do not poison retries', async () => {
  const old = deferred()
  let calls = 0
  const cache = createMonthAvailabilityCache({ loadMonth: () => ++calls === 1 ? old.promise : Promise.resolve({ fresh: true }) })
  const stale = cache.load(params)
  await tick()
  const fresh = cache.load(params, { force: true })
  await assert.rejects(stale, { name: 'AbortError' })
  assert.deepEqual(await fresh, { fresh: true })
  old.resolve({ stale: true })
  await tick()
  assert.deepEqual(await cache.load(params), { fresh: true })
  cache.invalidate()
  assert.equal(cache.size, 0)
  let attempts = 0
  const retryCache = createMonthAvailabilityCache({ loadMonth: async () => { if (++attempts === 1) throw new Error('Network failed'); return payload() } })
  await assert.rejects(retryCache.load(params), /Network failed/)
  assert.equal(retryCache.size, 0)
  assert.equal((await retryCache.load(params)).month, '2028-02')
  assert.equal(attempts, 2)
})

test('cache instances never share availability or private booking context', async () => {
  let calls = 0
  const makeCache = () => createMonthAvailabilityCache({ loadMonth: async () => ({ instance: ++calls }) })
  const first = makeCache(), second = makeCache()
  assert.deepEqual(await first.load(params), { instance: 1 })
  assert.deepEqual(await second.load(params), { instance: 2 })
})

test('actual monthly view renders one Monday-first month, disabled unavailable diagonals, selected semantics and bounded controls', () => {
  const data = payload()
  const calendar = bookingMonthGrid({ ...data, status: 'ready' })
  const selected = []
  const props = { month: data.month, timezone: data.timezone, locale: 'en', calendar, status: 'ready', selectedDate: '2028-02-02', canPrevious: false, canNext: true, onSelectDate: (...values) => selected.push(values) }
  const node = MonthlyBookingCalendarView(props)
  const buttons = elements(node, element => element.type === 'button')
  assert.equal(buttons.length, 31)
  assert.equal(buttons[0].props.disabled, true)
  assert.equal(buttons[1].props.disabled, false)
  assert.equal(buttons.filter(button => button.props['aria-pressed']).length, 1)
  assert.equal(buttons.filter(button => button.props.className?.includes('is-available')).length, 1)
  const available = buttons.find(button => button.props.className?.includes('is-available'))
  available.props.onClick()
  assert.deepEqual(selected, [['2028-02-02', data.days[1].slots]])
  const html = render(MonthlyBookingCalendarView, props)
  assert.match(html, /February 2028/)
  assert.match(html, /<th scope="col" abbr="Monday">Mon<\/th>/)
  assert.equal((html.match(/<table/g) || []).length, 1)
  assert.equal((html.match(/<tr>/g) || []).length, 6)
  assert.match(html, /is-unavailable[^>]*disabled=""/)
  assert.match(html, /is-selected[^>]*aria-pressed="true"/)
  assert.doesNotMatch(html, /No available times|Choose another day|Следващите 14/)
  assert.match(render(MonthlyBookingCalendarView, { ...props, locale: 'bg' }), /февруари 2028/)
})

test('loading and technical failures render neutral unknown dates, with an actionable retry instead of false unavailability', () => {
  const data = payload()
  let retries = 0
  for (const status of ['loading', 'error']) {
    const calendar = bookingMonthGrid({ ...data, status })
    const props = { month: data.month, timezone: data.timezone, locale: 'en', calendar, status, canPrevious: false, canNext: false, onRetry: () => retries++ }
    const html = render(MonthlyBookingCalendarView, props)
    assert.match(html, /is-unknown/)
    assert.doesNotMatch(html, /is-unavailable|is-available|No available|Unavailable<\/span>/)
    if (status === 'error') {
      assert.match(html, /Calendar could not load/)
      elements(MonthlyBookingCalendarView(props), node => node.type === 'button' && node.props.children === 'Retry')[0].props.onClick()
    } else assert.match(html, /Checking availability/)
  }
  assert.equal(retries, 1)
})

test('actual client component starts neutral without making SSR or local-preview network calls; styles keep seven columns and forty-four-pixel targets', async () => {
  const html = render(MonthlyBookingCalendar, { business: { id: 'actual', slug: 'actual', timezone: 'Europe/Sofia', booking_window_days: 60 }, serviceId: 'service-actual', previewMonthLoader: () => assert.fail('No loader runs during server rendering') })
  assert.match(html, /aria-busy="true"/)
  assert.match(html, /is-unknown/)
  assert.doesNotMatch(html, /is-available|No available times/)
  const css = await readFile(new URL('../app/monthly-booking-calendar.css', import.meta.url), 'utf8')
  assert.match(css, /table-layout: fixed/)
  assert.match(css, /height: 44px/)
  assert.match(css, /is-unavailable[^}]*linear-gradient/s)
  assert.match(css, /is-unknown[^}]*background: #f5f3ed/)
  assert.doesNotMatch(css, /min-width: [4-9]\d\dpx|overflow-x: (?:auto|scroll)/)
})
