import assert from 'node:assert/strict'
import test from 'node:test'
import { filterDirectoryBusinesses, getIndustryLabel, normalizeLocale, resolvePublicIndustry } from '../lib/public-locale.mjs'
import { getIndustryServiceTemplate } from '../lib/industry-templates.mjs'

test('normalizes public locale and translates industry labels', () => {
  assert.equal(normalizeLocale('en'), 'en')
  assert.equal(normalizeLocale('fr'), 'bg')
  assert.equal(getIndustryLabel('auto', 'en'), 'Auto services')
  assert.equal(getIndustryLabel('auto', 'bg'), 'Автосервизи')
})

test('filters the real directory by business type', () => {
  const businesses = [{ slug: 'garage', industry: 'auto' }, { slug: 'salon', industry: 'beauty' }]
  assert.deepEqual(filterDirectoryBusinesses(businesses, 'auto'), [businesses[0]])
  assert.equal(filterDirectoryBusinesses(businesses, 'all').length, 2)
})

test('auto businesses receive relevant starter services without shared mutation', () => {
  const first = getIndustryServiceTemplate('auto')
  first[0].name = 'changed'
  const second = getIndustryServiceTemplate('auto')
  assert.match(second[0].name, /Диагностика/i)
})

test('places legacy uncategorized businesses in an obvious public category', () => {
  assert.equal(resolvePublicIndustry({ name: 'MG Barbershop', industry: 'other', services: [] }), 'beauty')
  assert.equal(resolvePublicIndustry({ name: 'Сервиз 24', industry: 'other', services: [{ name: 'Диагностика' }] }), 'auto')
  assert.equal(resolvePublicIndustry({ name: 'Адвокат', industry: 'consulting', services: [] }), 'consulting')
})
