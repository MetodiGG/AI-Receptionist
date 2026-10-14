import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime } from 'luxon'
import { appointmentsForDay, filterCalendarAppointments, getAppointmentTiming, getCalendarDays, getTimelineBounds, layoutDayAppointments } from '../lib/owner-calendar.mjs'

const booking = (id, starts_at, ends_at, extra = {}) => ({ id, starts_at, ends_at, status: 'booked', staff: { id: 'alex', name: 'Alex' }, customer: { name: 'Client A' }, service: { name: 'Diagnostics' }, ...extra })

test('week starts on Monday and crosses month boundaries in the business zone', () => {
  const days = getCalendarDays('2026-11-01', 'week', 'Europe/Sofia')
  assert.equal(days.length, 7)
  assert.equal(days[0].toISODate(), '2026-10-26')
  assert.equal(days[6].toISODate(), '2026-11-01')
  assert.equal(days[0].weekday, 1)
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
