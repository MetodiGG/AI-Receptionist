import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBookingNotes, getBookingIntake, validateBookingIntake } from '../lib/booking-intake.mjs'

test('industry bookings reject missing required details before creating appointments', () => {
  for (const industry of ['auto', 'pets', 'home_services', 'education', 'consulting']) {
    assert.throws(() => validateBookingIntake(industry, {}), { code: 'VALIDATION_ERROR' })
  }
  assert.deepEqual(validateBookingIntake('beauty', {}), {})
  assert.deepEqual(validateBookingIntake('other', {}), {})
})

test('vehicle answers are normalized and invalid years or oversized input are rejected', () => {
  assert.deepEqual(validateBookingIntake('auto', { vehicle: '  VW Golf  ', year: '2018' }), { vehicle: 'VW Golf', year: '2018' })
  assert.throws(() => validateBookingIntake('auto', { vehicle: 'VW', year: 'tomorrow' }), { code: 'VALIDATION_ERROR' })
  assert.throws(() => validateBookingIntake('auto', { vehicle: 'V'.repeat(101) }), { code: 'VALIDATION_ERROR' })
  assert.throws(() => validateBookingIntake('auto', { vehicle: 'VW', request: ['text'] }), { code: 'VALIDATION_ERROR' })
})

test('only permitted questions and select choices reach the appointment record', () => {
  assert.throws(() => validateBookingIntake('pets', { pet_type: 'unknown' }), { code: 'VALIDATION_ERROR' })
  assert.throws(() => validateBookingIntake('pets', { pet_type: 'dog', arbitrary_field: 'data' }), { code: 'VALIDATION_ERROR' })
  assert.throws(() => validateBookingIntake('health', { medical_record: 'unrequested details' }), { code: 'VALIDATION_ERROR' })
  assert.throws(() => validateBookingIntake('auto', null), { code: 'VALIDATION_ERROR' })
})

test('stored answers remain readable in both owner languages and preserve the customer note', () => {
  const notes = buildBookingNotes('auto', { vehicle: 'VW Golf', year: '2018', request: 'Engine light on' }, 'Call before starting.', 'en')
  assert.match(notes, /Марка и модел \/ Make and model: VW Golf/)
  assert.match(notes, /Година \/ Year: 2018/)
  assert.match(notes, /Engine light on/)
  assert.ok(notes.endsWith('Call before starting.'))
  assert.match(buildBookingNotes('pets', { pet_type: 'dog' }), /Куче \/ Dog/)
  assert.equal(buildBookingNotes('other', {}, ''), null)
  assert.equal(buildBookingNotes('other', {}, ' Old booking note '), 'Old booking note')
})

test('English UI uses translated field labels and validation messages', () => {
  const intake = getBookingIntake('auto', 'en')
  assert.equal(intake.title, 'About your vehicle')
  assert.equal(intake.fields[0].label, 'Make and model')
  assert.throws(() => validateBookingIntake('auto', {}, 'en'), /Enter make and model/)
  assert.equal(getBookingIntake('unknown', 'en').fields.length, 0)
})
