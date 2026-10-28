import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { appointmentsForDay, filterCalendarAppointments, getAppointmentTiming, getCalendarDays, getTimelineBounds, groupCalendarAppointments, layoutDayAppointments, shiftCalendarDate } from '../lib/owner-calendar.mjs'
import { readFile } from 'node:fs/promises'

const booking = (id, starts_at, ends_at, extra = {}) => ({ id, starts_at, ends_at, status: 'booked', staff: { id: 'alex', name: 'Alex' }, customer: { name: 'Client A' }, service: { name: 'Diagnostics' }, ...extra })

test('week starts on Monday and crosses month boundaries in the business zone', () => {
  const days = getCalendarDays('2026-11-01', 'week', 'Europe/Sofia')
  assert.equal(days.length, 7)
  assert.equal(days[0].toISODate(), '2026-10-26')
  assert.equal(days[6].toISODate(), '2026-11-01')
  assert.equal(days[0].weekday, 1)
})

test('month has complete Monday–Sunday weeks, including leap February and year boundaries', () => {
  for (const [date, first, last, length] of [
    ['2026-10-28', '2026-09-28', '2026-11-01', 35],
    ['2026-11-01', '2026-10-26', '2026-12-06', 42],
    ['2021-02-14', '2021-02-01', '2021-02-28', 28],
    ['2024-02-29', '2024-01-29', '2024-03-03', 35],
    ['2026-12-31', '2026-11-30', '2027-01-03', 35],
  ]) {
    const days = getCalendarDays(date, 'month')
    assert.equal(days.length, length, date)
    assert.equal(days[0].toISODate(), first)
    assert.equal(days.at(-1).toISODate(), last)
    assert.equal(days[0].weekday, 1)
    assert.equal(days.at(-1).weekday, 7)
    assert.equal(new Set(days.map(day => day.toISODate())).size, length)
    const target = DateTime.fromISO(date)
    assert.equal(days.filter(day => day.hasSame(target, 'month')).length, target.daysInMonth)
  }
})

test('month navigation never skips a month from the 29th–31st and crosses years in both directions', () => {
  assert.equal(shiftCalendarDate('2026-01-31', 'month', 1), '2026-02-01')
  assert.equal(shiftCalendarDate('2024-03-31', 'month', -1), '2024-02-01')
  assert.equal(shiftCalendarDate('2026-12-31', 'month', 1), '2027-01-01')
  assert.equal(shiftCalendarDate('2026-01-01', 'month', -1), '2025-12-01')
  assert.equal(shiftCalendarDate('2026-10-25', 'day', 1), '2026-10-26')
  assert.equal(shiftCalendarDate('2026-10-25', 'week', 1), '2026-11-01')
})

test('month buckets match daily intervals across DST and midnight without mutating or losing appointments', () => {
  const rows = [
    booking('later', '2026-10-25T08:00:00Z', '2026-10-25T09:00:00Z'),
    booking('overnight', '2026-10-24T20:30:00Z', '2026-10-25T01:30:00Z'),
    booking('midnight', '2026-10-24T20:00:00Z', '2026-10-24T21:00:00Z'),
    booking('previous-month', '2026-09-28T08:00:00Z', '2026-09-28T09:00:00Z'),
    booking('next-month', '2026-11-01T08:00:00Z', '2026-11-01T09:00:00Z'),
  ]
  const snapshot = structuredClone(rows), days = getCalendarDays('2026-10-25', 'month')
  const grouped = groupCalendarAppointments(rows, days)
  for (const bucket of grouped) assert.deepEqual(bucket.appointments.map(item => item.id), appointmentsForDay(rows, bucket.day).map(item => item.id))
  assert.deepEqual(grouped.find(({ day }) => day.toISODate() === '2026-10-25').appointments.map(item => item.id), ['overnight', 'later'])
  const octoberRows = grouped.filter(({ day }) => day.month === 10).flatMap(item => item.appointments)
  assert.equal(new Set(octoberRows.map(item => item.id)).size, 3)
  assert.deepEqual(rows, snapshot)
  assert.equal(groupCalendarAppointments([], days).every(item => item.appointments.length === 0), true)
})

test('month keeps specialist/status/client filters and excludes invalid or zero-length intervals', () => {
  const rows = [
    booking('active', '2026-10-28T08:00:00Z', '2026-10-28T09:00:00Z'),
    booking('cancelled', '2026-10-28T08:00:00Z', '2026-10-28T09:00:00Z', { status: 'cancelled' }),
    booking('other', '2026-10-28T08:00:00Z', '2026-10-28T09:00:00Z', { staff: { id: 'sam' } }),
  ]
  const days = getCalendarDays('2026-10-28', 'month')
  const filtered = filterCalendarAppointments(rows, { staffId: 'alex', query: 'diagnostics' })
  assert.deepEqual(groupCalendarAppointments(filtered, days).flatMap(item => item.appointments).map(item => item.id), ['active'])
  const invalid = [booking('invalid', 'bad', 'bad'), booking('zero', '2026-10-28T08:00:00Z', '2026-10-28T08:00:00Z'), booking('backwards', '2026-10-28T09:00:00Z', '2026-10-28T08:00:00Z')]
  assert.equal(groupCalendarAppointments(invalid, days).every(item => item.appointments.length === 0), true)
})

test('spring DST month uses the 23-hour business day and exclusive midnight boundaries', () => {
  const days = getCalendarDays('2026-03-29', 'month', 'Europe/Sofia')
  const day = days.find(item => item.toISODate() === '2026-03-29')
  assert.equal(day.plus({ days: 1 }).diff(day, 'hours').hours, 23)
  const rows = [
    booking('before', '2026-03-28T21:00:00Z', '2026-03-28T22:00:00Z'),
    booking('inside', '2026-03-28T22:00:00Z', '2026-03-29T21:00:00Z'),
    booking('after', '2026-03-29T21:00:00Z', '2026-03-29T22:00:00Z'),
  ]
  assert.deepEqual(groupCalendarAppointments(rows, days).find(item => item.day.toISODate() === '2026-03-29').appointments.map(item => item.id), ['inside'])
})

test('month UI preserves day/week/list and uses only in-month unique bookings for the monthly summary', async () => {
  const ui = await readFile(new URL('../components/appointment-calendar.js', import.meta.url), 'utf8')
  for (const key of ['day', 'week', 'month', 'list']) assert.match(ui, new RegExp(`\\['${key}',en\\?`))
  assert.match(ui, /'Month':'Месец'/)
  assert.match(ui, /day\.hasSame\(selectedDate, 'month'\)\) : daysWithAppointments/)
  assert.match(ui, /new Map\(periodDays\.flatMap/)
  assert.match(ui, /aria-pressed=\{iso === date\}/)
  assert.match(ui, /aria-current=\{iso === today \? 'date'/)
  assert.match(ui, /selectedMonthDay\.appointments\.map\(item => eventButton\(item, selectedDate\)\)/)
  assert.match(ui, /onClick=\{\(\) => setView\('day'\)\}/)
  assert.match(ui, /Нова резервация за деня/)
  assert.match(ui, /items\.length > 99 \? '99\+'/)
  const css = await readFile(new URL('../app/owner-calendar-month.css', import.meta.url), 'utf8')
  assert.match(css, /grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/)
  assert.match(css, /\.owner-month-count \{[^}]*font-size: 16px/)
  assert.match(css, /\.owner-month-day:focus-visible/)
})

test('UTC reservations appear on the correct business day, including overnight visits', () => {
  const overnight = booking('overnight', '2026-10-14T20:30:00Z', '2026-10-14T22:30:00Z')
  const endingAtMidnight = booking('midnight', '2026-10-14T20:00:00Z', '2026-10-14T21:00:00Z')
  assert.equal(appointmentsForDay([overnight], '2026-10-14').length, 1)
  assert.equal(appointmentsForDay([overnight], '2026-10-15').length, 1)
  assert.equal(appointmentsForDay([endingAtMidnight], '2026-10-15').length, 0)
  const timing = getAppointmentTiming(overnight, '2026-10-15')
  assert.equal(timing.startMinute, 0)
  assert.equal(timing.endMinute, 90)
  assert.equal(timing.continuesBefore, true)
  assert.equal(timing.durationMinutes, 120)
})

test('calendar handles the 25-hour Sofia daylight-saving day', () => {
  const day = getCalendarDays('2026-10-25', 'day')[0]
  assert.equal(day.plus({ days: 1 }).diff(day, 'hours').hours, 25)
  const appointment = booking('dst', '2026-10-25T08:00:00Z', '2026-10-25T09:00:00Z')
  assert.equal(appointmentsForDay([appointment], day).length, 1)
  assert.equal(getAppointmentTiming(appointment, '2026-10-25').startMinute, 600)
})

test('specialist, status, text and period filters combine without mutating data', () => {
  const rows = [
    booking('later', '2026-10-14T12:00:00Z', '2026-10-14T13:00:00Z'),
    booking('cancelled', '2026-10-14T11:00:00Z', '2026-10-14T12:00:00Z', { status: 'cancelled' }),
    booking('other', '2026-10-14T10:00:00Z', '2026-10-14T11:00:00Z', { staff: { id: 'sam', name: 'Sam' } }),
  ]
  assert.deepEqual(filterCalendarAppointments(rows, { staffId: 'alex', query: 'diag' }).map((item) => item.id), ['later'])
  assert.equal(filterCalendarAppointments(rows, { status: 'all' }).length, 3)
  const now = DateTime.fromISO('2026-10-14T12:30:00Z')
  assert.deepEqual(filterCalendarAppointments(rows, { status: 'all', scope: 'upcoming', now }).map((item) => item.id), ['later'])
  assert.equal(rows[0].id, 'later')
})

test('day timeline expands for early and late bookings instead of hiding them', () => {
  const rows = [booking('early', '2026-10-14T03:00:00Z', '2026-10-14T04:00:00Z'), booking('late', '2026-10-14T19:00:00Z', '2026-10-14T20:00:00Z')]
  assert.deepEqual(getTimelineBounds(rows, '2026-10-14'), { startHour: 6, endHour: 23 })
})

test('overlapping cancelled and active bookings stay separately clickable', () => {
  const items = [
    booking('cancelled', '2026-10-14T06:00:00Z', '2026-10-14T07:00:00Z', { status: 'cancelled' }),
    booking('active', '2026-10-14T06:30:00Z', '2026-10-14T07:30:00Z'),
    booking('later', '2026-10-14T08:00:00Z', '2026-10-14T09:00:00Z'),
  ]
  const layout = layoutDayAppointments(items, '2026-10-14')
  assert.equal(layout[0].laneCount, 2)
  assert.notEqual(layout[0].lane, layout[1].lane)
  assert.equal(layout[2].laneCount, 1)
})
