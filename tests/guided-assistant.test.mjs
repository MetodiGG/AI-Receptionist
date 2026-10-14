import assert from 'node:assert/strict'
import test from 'node:test'
import { buildGuidedReply, detectGuidedTopic, getEligibleStaff } from '../lib/guided-assistant.mjs'

const business = {
  name: 'Тестово студио',
  address: 'ул. Примерна 1',
  phone: '+359 88 123 4567',
  cancellation_notice_hours: 12,
  bot_instructions: 'При закъснение се обади предварително.',
  services: [
    { id: 'service-1', name: 'Подстригване', duration_min: 30, price: 25, currency: 'EUR' },
    { id: 'service-2', name: 'Боядисване', duration_min: 60, price: 50, currency: 'EUR' },
  ],
  staff: [
    { id: 'staff-1', name: 'Мая' },
    { id: 'staff-2', name: 'Иван' },
  ],
  staffServices: [{ staff_id: 'staff-1', service_id: 'service-1' }],
  workingHours: [
    { weekday: 1, open_time: '09:00:00', close_time: '18:00:00' },
    { weekday: 2, open_time: '10:00:00', close_time: '19:00:00' },
  ],
}

test('classifies common Bulgarian questions without an AI model', () => {
  assert.equal(detectGuidedTopic('Имате ли свободен час утре?'), 'booking')
  assert.equal(detectGuidedTopic('Колко струва подстригването?'), 'services')
  assert.equal(detectGuidedTopic('Къде се намирате?'), 'contact')
  assert.equal(detectGuidedTopic('Кога работите?'), 'hours')
  assert.equal(detectGuidedTopic('Как да отменя часа?'), 'cancellation')
  assert.equal(detectGuidedTopic('Имам друг въпрос'), 'help')
})

test('returns only staff mapped to the selected service', () => {
  assert.deepEqual(getEligibleStaff(business, 'service-1').map((person) => person.id), ['staff-1'])
  assert.deepEqual(getEligibleStaff(business, 'service-2').map((person) => person.id), ['staff-1', 'staff-2'])
})

test('builds answers from verified business data', () => {
  const services = buildGuidedReply(business, 'services')
  const hours = buildGuidedReply(business, 'hours')
  const contact = buildGuidedReply(business, 'contact')
  const cancellation = buildGuidedReply(business, 'cancellation')

  assert.match(services, /Подстригване/)
  assert.match(services, /25,00/)
  assert.match(hours, /Понеделник: 09:00–18:00/)
  assert.match(contact, /ул\. Примерна 1/)
  assert.match(cancellation, /12 часа/)
  assert.equal(buildGuidedReply(business, 'rules'), business.bot_instructions)
})

test('does not start a booking flow without active services or staff', () => {
  assert.match(buildGuidedReply({ ...business, services: [] }, 'booking'), /няма активни услуги/)
  assert.match(buildGuidedReply({ ...business, staff: [] }, 'booking'), /няма активен специалист/)
})

test('builds English guided answers from the same verified business data', () => {
  const answer = buildGuidedReply(business, 'services', 'en')
  assert.match(answer, /Services:/)
  assert.match(answer, /Подстригване/)
  assert.match(buildGuidedReply(business, 'booking', 'en'), /First choose/i)
})
