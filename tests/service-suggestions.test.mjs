import test from 'node:test'
import assert from 'node:assert/strict'
import { SERVICE_SUGGESTION_DATA } from '../lib/service-suggestion-data.mjs'
import { MAX_SERVICE_SUGGESTIONS, normalizeServiceSuggestion, searchServiceSuggestions as search } from '../lib/service-suggestions.mjs'
import { PARTNER_CATEGORY_KEYS } from '../lib/partner-leads.mjs'
import { INDUSTRY_SERVICE_TEMPLATES, INDUSTRY_SERVICE_TEMPLATES_EN } from '../lib/industry-templates.mjs'

const all = Object.entries(SERVICE_SUGGESTION_DATA).flatMap(([industry, groups]) => groups.flatMap(group => group.services.map(service => ({ industry, ...service }))))

test('all nine business types have a substantial reviewed bilingual name-only vocabulary with unique stable IDs', () => {
  assert.deepEqual(Object.keys(SERVICE_SUGGESTION_DATA).sort(), [...PARTNER_CATEGORY_KEYS].sort())
  assert.ok(all.length >= 350, `${all.length} genuinely distinct suggestions`)
  for (const industry of PARTNER_CATEGORY_KEYS) {
    const services = all.filter(service => service.industry === industry)
    assert.ok(services.length >= 25, industry)
    assert.equal(new Set(services.map(service => service.id)).size, services.length, `${industry} stable IDs`)
    for (const locale of ['bg', 'en']) assert.equal(new Set(services.map(service => normalizeServiceSuggestion(service[locale]))).size, services.length, `${industry}/${locale} duplicate names`)
    for (const service of services) {
      assert.ok(service.bg.trim().length > 2 && service.en.trim().length > 2)
      assert.ok(service.bg.length <= 120 && service.en.length <= 120, `${industry}/${service.id} fits the actual service-name field`)
      assert.match(service.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      assert.deepEqual(Object.keys(service).sort(), ['industry', 'id', 'bg', 'en', 'aliases'].sort())
    }
  }
})

test('existing generic industry templates remain findable without copying their prices or durations', () => {
  for (const [locale, templates] of [['bg', INDUSTRY_SERVICE_TEMPLATES], ['en', INDUSTRY_SERVICE_TEMPLATES_EN]]) {
    for (const [industry, services] of Object.entries(templates)) for (const service of services) {
      const results = search(service.name, { industry, locale, limit: 12 })
      assert.ok(results.length, `${industry}/${locale}: ${service.name}`)
      for (const result of results) assert.deepEqual(Object.keys(result).sort(), ['id', 'name', 'group'].sort())
    }
  }
})

test('боя and common precise aliases complete to canonical names within the selected type', () => {
  assert.equal(search('боя', { industry: 'beauty' })[0].name, 'Боядисване на коса')
  assert.equal(search('боя', { industry: 'home_services' })[0].name, 'Боядисване на стени')
  assert.equal(search('боя', { industry: 'auto' })[0].name, 'Оглед за автобоядисване')
  assert.equal(search('каре', { industry: 'beauty' })[0].name, 'Подстригване на каре')
  assert.equal(search('гел лак', { industry: 'beauty' })[0].name, 'Маникюр с гел лак')
  assert.equal(search('bjj', { industry: 'fitness', locale: 'en' })[0].name, 'Brazilian jiu-jitsu session')
})

test('normalization handles mixed case, accents, punctuation, decomposed Unicode and Bulgarian transliteration', () => {
  for (const value of [' БОЯДИСВАНЕ ', 'boyadisvane', 'BÓYADISVANE', 'BO\u0301YADISVANE']) assert.equal(search(value, { industry: 'beauty' })[0].id, 'beauty:hair-colouring', value)
  for (const value of ['кола-маска', 'КОЛА — МАСКА', 'kola maska']) assert.equal(search(value, { industry: 'beauty' })[0].id, 'beauty:waxing', value)
  assert.equal(search('boq', { industry: 'beauty' })[0].id, 'beauty:hair-colouring')
  assert.equal(search('ПИЪРСИНГ', { industry: 'other' })[0].id, 'other:piercing')
  assert.equal(normalizeServiceSuggestion('Йога / Yoga'), 'yoga yoga')
})

test('exact matches precede prefixes, which precede word matches and substrings, with stable order', () => {
  const results = search('маникюр', { industry: 'beauty', limit: 12 })
  assert.equal(results[0].id, 'beauty:manicure')
  assert.equal(results[1].id, 'beauty:gel-polish')
  assert.ok(results.findIndex(row => row.id === 'beauty:gel-polish') < results.findIndex(row => row.id === 'beauty:french-manicure'))
  assert.deepEqual(search('hair', { industry: 'beauty', locale: 'en' }), search('hair', { industry: 'beauty', locale: 'en' }))
  assert.equal(search('nail', { industry: 'beauty', locale: 'en' })[0].id, 'beauty:nail-extension')
})

test('category filtering never broadens an unknown type and unknown text stays free-entry', () => {
  assert.deepEqual(search('боя', { industry: 'pets' }), [])
  assert.deepEqual(search('диагностика', { industry: 'beauty' }), [])
  for (const industry of ['', 'unknown', 'constructor', '__proto__', null, 1]) assert.deepEqual(search('маникюр', { industry }), [])
  for (const query of ['', ' ', '\t', 'а', '???', 'Непубликувана услуга по избор', null, {}, 'a'.repeat(161)]) assert.deepEqual(search(query, { industry: 'beauty' }), [])
  for (const query of ['<script>alert(1)</script>', "'; DROP TABLE services; --", '^.*$']) assert.deepEqual(search(query, { industry: 'beauty' }), [], 'code-looking text is only literal input')
  assert.deepEqual(search('[a-z]+', { industry: 'beauty' }), search('a z', { industry: 'beauty' }), 'regex punctuation is normalized as ordinary text, never executed')
})

test('every canonical service name resolves to its own stable identifier in both languages', () => {
  for (const service of all) for (const locale of ['bg', 'en']) {
    const result = search(service[locale], { industry: service.industry, locale, limit: 12 })
    assert.ok(result.some(row => row.id === `${service.industry}:${service.id}`), `${service.industry}/${locale}: ${service[locale]}`)
  }
})

test('limits and output are bounded, results cannot mutate cached data, and caller input is unchanged', () => {
  const options = Object.freeze({ industry: 'beauty', locale: 'bg', limit: 999 })
  const results = search('на', options)
  assert.equal(results.length, MAX_SERVICE_SUGGESTIONS)
  assert.equal(search('на', { ...options, limit: 1 }).length, 1)
  assert.equal(search('на', { ...options, limit: 1.9 }).length, 1)
  assert.deepEqual(search('на', { ...options, limit: 0 }), [])
  assert.deepEqual(search('на', { ...options, limit: -5 }), [])
  assert.ok(search('на', { ...options, limit: NaN }).length <= 8)
  const first = results[0].name; results[0].name = 'mutated'
  assert.equal(search('на', options)[0].name, first)
  assert.equal(options.limit, 999)
})

test('localized result names and groups preserve stable IDs and do not mix display languages', () => {
  const bg = search('hair coloring', { industry: 'beauty' }), en = search('hair coloring', { industry: 'beauty', locale: 'en' })
  assert.deepEqual(bg.map(row => row.id), en.map(row => row.id))
  assert.equal(bg[0].name, 'Боядисване на коса'); assert.equal(en[0].name, 'Hair colouring')
  assert.equal(bg[0].group, 'Фризьорство'); assert.equal(en[0].group, 'Hair')
})

test('health vocabulary is limited to dental and mental healthcare, without other doctors or laboratory panels', () => {
  const health = all.filter(row => row.industry === 'health')
  assert.ok(health.some(row => row.id === 'dental-exam') && health.some(row => row.id === 'psychiatrist'))
  assert.doesNotMatch(JSON.stringify(health), /кардиолог|невролог|гинеколог|ортопед|дерматолог|кръвни|лаборатор|cardiolog|neurolog|gynaecolog|orthopaed|dermatolog|laboratory/i)
  for (const query of ['кардиолог', 'гинеколог', 'кръвни изследвания']) assert.deepEqual(search(query, { industry: 'health' }), [])
})
