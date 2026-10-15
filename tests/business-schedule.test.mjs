import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAvailableSlots } from '../lib/availability.mjs'
import { validDuration, scheduleRows, scheduleProblem, scheduleFromHours } from '../lib/business-schedule.mjs'
import { BULGARIAN_CITIES, searchCities, businessLocationFields, businessAddress, NEIGHBOURHOODS } from '../lib/business-location.mjs'
import { getIndustryServiceTemplate } from '../lib/industry-templates.mjs'
import { buildGuidedReply } from '../lib/guided-assistant.mjs'
import { readFile } from 'node:fs/promises'

const staff = [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }]
const hours = staff.map((person) => ({ staff_id: person.id, weekday: 1, open_time: '09:00:00', close_time: '18:00:00', break_start: '12:00:00', break_end: '13:00:00' }))
const base = { date: '2026-10-19', zone: 'Europe/Sofia', durationMinutes: 45, slotMinutes: 15, minimumNoticeMinutes: 0, now: '2026-10-18T08:00:00Z', staff, workingHours: hours, appointments: [], timeOff: [] }

test('lunch removes the entire overlapping service, not just starts inside the break', () => {
  const slots = buildAvailableSlots(base).filter((slot) => slot.staffId === 'a')
  assert.ok(slots.some((slot) => slot.localTime === '11:15' && slot.localEndTime === '12:00'))
  for (const time of ['11:30', '11:45', '12:00', '12:15', '12:30', '12:45']) assert.equal(slots.some((slot) => slot.localTime === time), false)
  assert.ok(slots.some((slot) => slot.localTime === '13:00'))
})

test('a booked 45-minute service removes all intersecting 15-minute start options for that specialist', () => {
  const slots = buildAvailableSlots({ ...base, appointments: [{ staff_id: 'a', starts_at: '2026-10-19T07:00:00Z', ends_at: '2026-10-19T07:45:00Z' }] })
  for (const time of ['09:30', '09:45', '10:00', '10:15', '10:30']) assert.equal(slots.some((slot) => slot.staffId === 'a' && slot.localTime === time), false)
  assert.ok(slots.some((slot) => slot.staffId === 'a' && slot.localTime === '10:45'))
  assert.ok(slots.some((slot) => slot.staffId === 'b' && slot.localTime === '10:00'))
})

test('a 60-minute service blocks one hour even with 15-minute start options', () => {
  const slots = buildAvailableSlots({ ...base, durationMinutes: 60, appointments: [{ staff_id: 'a', starts_at: '2026-10-19T07:00:00Z', ends_at: '2026-10-19T08:00:00Z' }] })
  assert.equal(slots.some((slot) => slot.staffId === 'a' && ['09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45'].includes(slot.localTime)), false)
  assert.ok(slots.some((slot) => slot.staffId === 'a' && slot.localTime === '11:00' && slot.localEndTime === '12:00'))
})

test('weekly lunch repeats after the Sofia DST change without shifting local hours', () => {
  const slots = buildAvailableSlots({ ...base, date: '2026-11-02' })
  assert.ok(slots.some((slot) => slot.localTime === '13:00' && slot.startsAt === '2026-11-02T11:00:00.000Z'))
  assert.equal(slots.some((slot) => slot.localTime === '12:00'), false)
})

test('one-off whole-business closure blocks all staff and longer services crossing its start', () => {
  const slots = buildAvailableSlots({ ...base, timeOff: [{ staff_id: null, starts_at: '2026-10-19T11:00:00Z', ends_at: '2026-10-19T12:00:00Z' }] })
  assert.equal(slots.some((slot) => ['13:30', '13:45', '14:00', '14:15', '14:30', '14:45'].includes(slot.localTime)), false)
  assert.ok(slots.some((slot) => slot.localTime === '15:00'))
})

test('invalid duration or interval cannot cause an infinite slot loop', () => {
  for (const value of [0, -1, NaN, Infinity]) {
    assert.deepEqual(buildAvailableSlots({ ...base, slotMinutes: value }), [])
    assert.deepEqual(buildAvailableSlots({ ...base, durationMinutes: value }), [])
  }
})

test('schedule validation rejects inverted/outside breaks and keeps disabled days closed', () => {
  const day = { weekday: 1, enabled: true, open: '09:00', close: '18:00', breakEnabled: true, breakStart: '12:00', breakEnd: '13:00' }
  assert.equal(scheduleProblem([day]), null)
  for (const patch of [{ breakStart: '08:00' }, { breakEnd: '19:00' }, { breakEnd: '11:00' }, { breakStart: '09:00', breakEnd: '18:00' }, { breakStart: '' }]) assert.equal(scheduleProblem([{ ...day, ...patch }]).kind, 'break')
  assert.deepEqual(scheduleRows([{ ...day, enabled: false }]), [])
  assert.deepEqual(scheduleRows([day]), [{ weekday: 1, open_time: '09:00', close_time: '18:00', break_start: '12:00', break_end: '13:00' }])
  assert.equal(scheduleRows([{ ...day, breakEnabled: false }])[0].break_start, null)
})

test('saved staff-specific breaks survive editing and locale changes', () => {
  const saved = scheduleFromHours([[1, 'Monday'], [2, 'Tuesday']], hours, 'a')
  assert.equal(saved[0].breakStart, '12:00')
  assert.equal(saved[0].breakEnd, '13:00')
  assert.equal(saved[0].breakEnabled, true)
  assert.equal(saved[1].enabled, false)
})

test('assistant business-hours answers explicitly describe published lunch breaks in BG and EN', () => {
  const business = { workingHours: hours }
  assert.match(buildGuidedReply(business, 'hours', 'bg'), /почивка 12:00–13:00/)
  assert.match(buildGuidedReply(business, 'hours', 'en'), /break 12:00–13:00/)
})

test('owner menu has no Demo entry and customer surfaces have no uptime status badges', async () => {
  const shell = await readFile(new URL('../components/dashboard-shell.js', import.meta.url), 'utf8')
  assert.equal(shell.includes('/dashboard/demo'), false)
  for (const path of ['../components/dashboard-shell.js','../app/page.js','../app/book/[slug]/page.js','../app/dashboard/assistant/page.js']) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /className="(?:status-chip|booking-live|directory-live)"/)
  }
})

test('durations support 45 and 60 minutes and reject missing, fractional or oversized values', () => {
  for (const value of [5, '45', 60, 1440]) assert.equal(validDuration(value), true)
  for (const value of ['', null, 0, -1, 3, 45.5, 1441, Infinity, 'bad']) assert.equal(validDuration(value), false)
  assert.equal(getIndustryServiceTemplate('beauty')[0].duration_min, '45')
})

test('official city list has all 257 unique EKATTE codes, including both cities named Byala', () => {
  assert.equal(BULGARIAN_CITIES.length, 257)
  assert.equal(new Set(BULGARIAN_CITIES.map((city) => city.code)).size, 257)
  assert.equal(BULGARIAN_CITIES.filter((city) => city.name === 'Бяла').length, 2)
  assert.equal(searchCities('sofia')[0].code, '68134')
  assert.ok(searchCities('Варна').some((city) => city.code === '10135'))
  assert.ok(searchCities('02676').length > 0)
})

test('locations persist canonical city names and allow missing neighbourhoods without carrying one to another city', () => {
  assert.deepEqual(businessLocationFields('68134', ' Младост 1 '), { city_ekatte: '68134', city: 'София', neighborhood: 'Младост 1' })
  assert.equal(businessLocationFields('10135', '').neighborhood, null)
  assert.throws(() => businessLocationFields('unknown'))
  assert.equal(businessAddress({ ...businessLocationFields('68134', 'Младост 1'), address: 'ул. Тест 1' }), 'София, Младост 1, ул. Тест 1')
  assert.equal(businessAddress({ address: 'Existing full address' }), 'Existing full address')
  for (const code of Object.keys(NEIGHBOURHOODS)) assert.ok(BULGARIAN_CITIES.some((city) => city.code === code))
})
