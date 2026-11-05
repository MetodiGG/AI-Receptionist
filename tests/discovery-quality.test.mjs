import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { parseIntent, discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'
import { normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'

const now = DateTime.fromISO('2026-10-30T12:00:00', { zone: 'Europe/Sofia' })
const request = (query, patch = {}) => discoveryRequestSchema.parse(discoverySearchInput({ query, ...patch }))
const parse = (query, patch = {}) => ({ ...parseIntent(request(query, patch), now, { v2: true }), searchV2: true })
const config = { ...discoveryConfig({ DISCOVERY_PROVIDER_MODE: 'google' }), searchV2Enabled: true, googleEnabled: true, googleKey: 'fixture-key', maxResults: 12 }
const place = { id: 'FIXTURE_EXTERNAL', displayName: { text: 'Fictional exact service provider' }, googleMapsUri: 'https://www.google.com/maps/place/fixture', location: { latitude: 42.7, longitude: 23.3 } }
function dependencies(patch = {}) {
  const calls = { google: 0, slots: 0, diagnostic: [] }
  return { now, config, calls, claimBudget: async () => true, readInternal: async () => [], readLinks: async () => [],
    getBusiness: async () => null, getSlots: async () => { calls.slots++; return [] },
    fetcher: async () => { calls.google++; return Response.json({ places: [place] }) }, diagnostic: value => calls.diagnostic.push(value), ...patch }
}
test('V2 is opt-in and ordinary rollback keeps original interpretation', () => {
  assert.equal(discoveryConfig({}).searchV2Enabled, false)
  assert.equal(discoveryConfig({ DISCOVERY_SEARCH_V2_ENABLED: 'true' }).searchV2Enabled, true)
  assert.equal(parseIntent(request('невролог след 13:00'), now).category, null)
})
test('specialist discovery survives zero partners and missing date, without claiming a slot or treating hospitals as specialist evidence', async () => {
  const deps = dependencies(), result = await discoverBusinesses(request('невролог след 13:00'), deps)
  assert.equal(result.clarification, null); assert.equal(result.appointmentClarification.field, 'date')
  assert.equal(result.intent.category, 'other'); assert.equal(result.intent.service, 'невролог')
  assert.equal(deps.calls.google, 1); assert.equal(deps.calls.slots, 0)
  assert.equal(result.results[0].availability.status, 'unknown')
  assert.equal(normalizeInternalBusinesses([{ id: 'hospital', city_ekatte: '68134', industry: 'health', services: [{ name: 'Общ медицински преглед', active: true }] }], result.intent).length, 0)
  assert.ok(deps.calls.diagnostic.length)
  assert.doesNotMatch(JSON.stringify(deps.calls.diagnostic), /невролог|latitude|query|FIXTURE_EXTERNAL/)
})
test('Bulgarian, English, transliteration, mixed script and common typos map to supported categories', () => {
  for (const [query, category] of [['frizior v sofia', 'hair'], ['маникУр', 'nails'], ['mannikur sofia', 'nails'], ['avtoserviz mlados 4', 'auto_repair'], ['спортен масаж в Лозенец', 'other'], ['почистване на лице', 'beauty'], ['почисти апартамента', 'home_services'], ['очен лекар', 'other'], ['котешки груминг', 'pets'], ['уроци по китара', 'education']]) assert.equal(parse(query).category, category, query)
  assert.equal(parse('frizior utре').date, '2026-10-31')
  assert.equal(parse('avtoserviz mlados 4').neighborhood, 'Младост 4')
})
test('specialty words and Bulgarian service phrases are preserved, not stem-replaced or stripped of prepositions', () => {
  for (const query of ['смяна на масло в Младост 4', 'данъчен консултант', 'детски невролог', 'котешки груминг', 'пилатес реформър', 'фризьор за къдрава коса']) {
    const intent = parse(query), provider = googleSearchRequest(intent)
    assert.doesNotMatch(provider.body.textQuery, /консултацияант|заниманияен|13:00|утре/)
    if (query.startsWith('смяна')) assert.equal(intent.service, 'смяна на масло')
    if (query.includes('реформър')) assert.match(intent.service, /реформър/)
    if (query.includes('котешки')) assert.match(intent.service, /котешки/)
  }
})
test('cross-industry exact published service survives, unrelated or missing speciality does not', () => {
  const intent = parse('детски невролог'), base = { id: 'specialist', city_ekatte: '68134', industry: 'other' }
  const rows = ['Детски невролог', 'Невролог', 'Общ преглед'].map((name, index) => ({ ...base, id: String(index), services: [{ id: 's', name, active: true, duration_min: 30 }] }))
  assert.deepEqual(normalizeInternalBusinesses(rows, intent).map(row => row.id), ['0'])
})
test('broad existing categories still discover their actual services; explicit duration is never inferred', () => {
  for (const [query, name, industry] of [['барбершоп', 'Мъжко подстригване', 'beauty'], ['фризьор', 'Подстригване', 'beauty'], ['автосервиз', 'Смяна на гуми', 'auto']]) {
    assert.equal(normalizeInternalBusinesses([{ id: 'partner', city_ekatte: '68134', industry, services: [{ id: 's', name, active: true, duration_min: 30 }] }], parse(query)).length, 1, query)
  }
  const intent = parse('масаж 60 минути до 40 евро')
  assert.equal(intent.durationMin, 60); assert.equal(intent.budget.max, 40)
  const rows = [30, 60].map(duration_min => ({ id: String(duration_min), city_ekatte: '68134', industry: 'other', services: [{ id: 's', name: 'Масаж', duration_min, price: 35, currency: 'EUR' }] }))
  assert.deepEqual(normalizeInternalBusinesses(rows, intent).map(row => row.id), ['60'])
})
test('city-wide is not a default 2 km circle; explicit near-me radii and numbered quarters stay hard limits', () => {
  assert.equal(googleSearchRequest(parse('фризьор из цяла София')).body.locationBias, undefined)
  for (const name of ['Младост 1', 'Младост 4', 'Люлин 5', 'Дружба 1', 'Дружба 2', 'Обеля 2']) assert.equal(parse(`автосервиз ${name}`).neighborhood, name)
  assert.equal(parse('фризьор на 1 км от мен').clarification.field, 'coordinates')
  const origin = { latitude: 42.7, longitude: 23.3, consent: true }, intent = parse('фризьор на 1 км от мен', { coordinates: origin })
  assert.equal(intent.radiusKm, 1); assert.equal(intent.clarification, null)
  assert.equal(googleSearchRequest(intent).body.locationRestriction.circle.radius, 1000)
  assert.equal(parse('фризьор на 30 км от мен', { coordinates: origin }).clarification.field, 'radius')
})
test('past dates never search; relative weeks, tonight, tomorrow and undated windows preserve appointment semantics', async () => {
  assert.equal(parse('маникюр вчера').clarification.field, 'date')
  assert.equal(parse('уроци по математика за след 3 седмици').date, '2026-11-20')
  assert.equal(parse('уроци по математика за след 3 седмици').timeFrom, null)
  assert.equal(parse('маникюр понеделник и вторник').clarification.field, 'date')
  assert.equal(parse('водопроводчик тази вечер').date, '2026-10-30')
  assert.equal(parse('маникюр утре преди 12').timeTo, '12:00')
  const window = parse('пилатес от 19 до 21')
  assert.equal(window.timeFrom, '19:00'); assert.equal(window.timeTo, '21:00'); assert.equal(window.clarification, null); assert.equal(window.appointmentClarification.field, 'date')
  const deps = dependencies(); await discoverBusinesses(request('маникюр вчера'), deps); assert.equal(deps.calls.google, 0)
})
test('provider search text omits symptom narratives, email addresses and phone numbers', () => {
  const specialist = googleSearchRequest(parse('невролог за болка и изтръпване в София след 13:00'))
  assert.equal(specialist.body.textQuery, 'невролог, София, България')
  assert.doesNotMatch(specialist.body.textQuery, /болка|изтръпване|13:00/)
  const service = googleSearchRequest(parse('фризьор info@example.com +359 888 123 456 София'))
  assert.doesNotMatch(service.body.textQuery, /example|359|888/)
})
test('narrow service text is not lost to a broad Google type and home services can include service-area businesses', () => {
  assert.equal(googleSearchRequest(parse('ремонт на спирачки')).body.strictTypeFiltering, undefined)
  assert.equal(googleSearchRequest(parse('електротехник')).body.includePureServiceAreaBusinesses, true)
  assert.equal(googleSearchRequest(parse('невролог')).body.includedType, undefined)
})
test('zero results, 429, unavailable key, quota, timeout and AI failure stay explicit and never invent facts', async () => {
  for (const [patch, status] of [[{ fetcher: async () => Response.json({ places: [] }) }, 'ok'], [{ fetcher: async () => new Response('', { status: 429 }) }, 'unavailable'], [{ config: { ...config, googleKey: '' } }, 'not_configured'], [{ claimBudget: async () => false }, 'quota'], [{ fetcher: async () => { throw new Error('timeout') } }, 'unavailable']]) {
    const result = await discoverBusinesses(request('невролог'), dependencies(patch))
    assert.equal(result.externalStatus, status); assert.equal(result.results.length, 0)
  }
})
