import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAvailableSlots } from '../lib/availability.mjs'

const staff = [{ id: 'staff-1', name: 'Мая' }]
const mondayHours = [{ staff_id: 'staff-1', weekday: 1, open_time: '09:00:00', close_time: '12:00:00' }]

test('creates slots in the business timezone with the requested duration', () => {
  const slots = buildAvailableSlots({
    date: '2026-10-19', zone: 'Europe/Sofia', durationMinutes: 30, slotMinutes: 30,
    minimumNoticeMinutes: 0, now: '2026-10-18T08:00:00Z', staff, workingHours: mondayHours,
    appointments: [], timeOff: [],
  })

  assert.equal(slots.length, 6)
  assert.deepEqual(slots.map((slot) => slot.localTime), ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  assert.equal(slots[0].startsAt, '2026-10-19T06:00:00.000Z')
})

test('removes appointments that overlap only part of a candidate slot', () => {
  const slots = buildAvailableSlots({
    date: '2026-10-19', zone: 'Europe/Sofia', durationMinutes: 30, slotMinutes: 30,
    minimumNoticeMinutes: 0, now: '2026-10-18T08:00:00Z', staff, workingHours: mondayHours,
    appointments: [{ staff_id: 'staff-1', starts_at: '2026-10-19T07:15:00.000Z', ends_at: '2026-10-19T07:45:00.000Z' }],
    timeOff: [],
  })

  assert.deepEqual(slots.map((slot) => slot.localTime), ['09:00', '09:30', '11:00', '11:30'])
})

test('applies business-wide time off and minimum notice', () => {
  const slots = buildAvailableSlots({
    date: '2026-10-19', zone: 'Europe/Sofia', durationMinutes: 30, slotMinutes: 30,
    minimumNoticeMinutes: 60, now: '2026-10-19T06:30:00.000Z', staff, workingHours: mondayHours,
    appointments: [],
    timeOff: [{ staff_id: null, starts_at: '2026-10-19T08:00:00.000Z', ends_at: '2026-10-19T08:30:00.000Z' }],
  })

  assert.deepEqual(slots.map((slot) => slot.localTime), ['10:30', '11:30'])
})

test('handles the Europe/Sofia daylight-saving offset', () => {
  const slots = buildAvailableSlots({
    date: '2026-11-02', zone: 'Europe/Sofia', durationMinutes: 60, slotMinutes: 60,
    minimumNoticeMinutes: 0, now: '2026-11-01T08:00:00Z', staff,
    workingHours: [{ staff_id: 'staff-1', weekday: 1, open_time: '09:00:00', close_time: '11:00:00' }],
    appointments: [], timeOff: [],
  })

  assert.equal(slots[0].startsAt, '2026-11-02T07:00:00.000Z')
})
