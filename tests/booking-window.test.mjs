import test from 'node:test'
import assert from 'node:assert/strict'
import { collapseSlotsByLocalTime, formatBulgarianMonthShort, groupSlotsByPeriod, resolveVisibleBookingDays } from '../lib/booking-window.mjs'

test('shows at most the next fourteen booking days', () => {
  assert.equal(resolveVisibleBookingDays(60), 14)
  assert.equal(resolveVisibleBookingDays(14), 14)
  assert.equal(resolveVisibleBookingDays(7), 7)
  assert.equal(resolveVisibleBookingDays(undefined), 14)
})

test('groups available hours into intuitive parts of the day', () => {
  const groups = groupSlotsByPeriod([
    { localTime: '09:00' },
    { localTime: '12:30' },
    { localTime: '17:00' },
  ])

  assert.deepEqual(groups.map(({ key, slots }) => [key, slots.length]), [
    ['morning', 1],
    ['afternoon', 1],
    ['evening', 1],
  ])
})

test('formats the month clearly in Bulgarian', () => {
  assert.equal(formatBulgarianMonthShort(10), 'окт.')
  assert.equal(formatBulgarianMonthShort(1), 'яну.')
})

test('shows a time only once when the customer has no staff preference', () => {
  const slots = collapseSlotsByLocalTime([
    { localTime: '09:00', staffId: 'one' },
    { localTime: '09:00', staffId: 'two' },
    { localTime: '09:30', staffId: 'one' },
  ])

  assert.deepEqual(slots.map(({ localTime, staffId }) => [localTime, staffId]), [
    ['09:00', 'one'],
    ['09:30', 'one'],
  ])
})
