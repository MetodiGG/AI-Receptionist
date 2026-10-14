import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PARTNER_CATEGORY_KEYS,
  PARTNER_STATUS_KEYS,
  PARTNER_STATUS_LABELS,
  normalizeLeadText,
} from '../lib/partner-leads.mjs'

test('normalizes partner lead text without changing meaningful characters', () => {
  assert.equal(normalizeLeadText('  MG   Barbershop\n Sofia  '), 'MG Barbershop Sofia')
  assert.equal(normalizeLeadText('Автосервиз „Иванов“'), 'Автосервиз „Иванов“')
  assert.equal(normalizeLeadText(null), '')
})

test('partner pipeline exposes labels for every supported status', () => {
  for (const status of PARTNER_STATUS_KEYS) {
    assert.ok(PARTNER_STATUS_LABELS[status]?.bg)
    assert.ok(PARTNER_STATUS_LABELS[status]?.en)
  }
})

test('partner form accepts the supported appointment-business categories', () => {
  assert.deepEqual(PARTNER_CATEGORY_KEYS, [
    'beauty', 'auto', 'health', 'fitness', 'education',
    'consulting', 'home_services', 'pets', 'other',
  ])
})
