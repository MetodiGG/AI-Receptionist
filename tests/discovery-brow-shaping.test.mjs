import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { parseIntent, discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'
import { matchingServices, normalizeInternalBusinesses } from '../lib/discovery/internal-search.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { googleSearchRequest } from '../lib/discovery/google-places.mjs'

const now = DateTime.fromISO('2026-11-04T09:00:00+02:00')
const origin = { latitude: 42.66, longitude: 23.28, consent: true } // Synthetic point, not a customer's location.
const input = query => discoveryRequestSchema.parse(discoverySearchInput({ query, coordinates: origin, expandNearby: true }))
const intent = query => ({ ...parseIntent(input(query), now, { v2: true }), searchV2: true })
const names = ['Оформяне на брада', 'Оформяне на вежди с конец', 'Ламиниране на вежди', 'Подстригване на коса', 'Маникюр']
const business = { id: 'synthetic-partner', name: 'QA partner', slug: 'qa-partner', active: true, platform_status: 'enabled', industry: 'beauty', city_ekatte: '68134', neighborhood: 'Манастирски ливади', public_profile: { latitude: origin.latitude, longitude: origin.longitude }, services: names.map((name, id) => ({ id: String(id), name, active: true, duration_min: 30 })), staff: [], workingHours: [] }

test('оформяне finds both actual shaping services without guessing beard or brow lamination', () => {
  const parsed = intent('оформяне')
  assert.equal(parsed.clarification, null); assert.equal(parsed.category, 'beauty'); assert.equal(parsed.service, 'оформяне')
  assert.deepEqual(matchingServices(business, parsed).map(row => row.name), names.slice(0, 2))
  assert.equal(normalizeInternalBusinesses([business], parsed).length, 1)
})
test('explicit eyebrow shaping in Bulgarian and English never substitutes lamination or beard services', () => {
  for (const query of ['оформяне на вежди', 'оформяне на вежди с конец', 'вежди с конец', 'корекция на вежди', 'eyebrow shaping', 'eyebrow threading']) {
    const parsed = intent(query)
    assert.equal(parsed.clarification, null, query)
    assert.deepEqual(matchingServices(business, parsed).map(row => row.name), ['Оформяне на вежди с конец'], query)
    assert.doesNotMatch(googleSearchRequest(parsed).body.textQuery, /ламиниране|lamination/)
  }
})
test('longer beard and lamination phrases retain their distinct service matching', () => {
  assert.deepEqual(matchingServices(business, intent('оформяне на брада')).map(row => row.name), ['Оформяне на брада'])
  assert.deepEqual(matchingServices(business, intent('ламиниране на вежди')).map(row => row.name), ['Ламиниране на вежди'])
  assert.deepEqual(matchingServices(business, intent('оформяне на коса')), [])
  const alternative = { ...business, services: [{ id: 'different-method', name: 'Оформяне на вежди с пинсета', duration_min: 20 }] }
  assert.deepEqual(matchingServices(alternative, intent('eyebrow threading')), [])
})
test('a nearby published partner appears first for shaping without a Google or AI call', async () => {
  const result = await discoverBusinesses(input('оформяне'), {
    now, config: { ...discoveryConfig({ DISCOVERY_ENABLED: 'true' }), searchV2Enabled: true },
    readInternal: async () => [business], readLinks: async () => [], claimBudget: async () => false,
    fetcher: () => assert.fail('no paid provider requests'), getBusiness: () => assert.fail('no date: no availability claim'), getSlots: () => assert.fail('no reservations'),
  })
  assert.equal(result.results[0].source, 'gorez'); assert.equal(result.results[0].proximityBand, 'nearby')
  assert.deepEqual(result.results[0].services.map(row => row.name), names.slice(0, 2))
  assert.equal(result.results[0].availability.status, 'unknown')
})
test('unified partner cards retain their factual service category and the existing booking entry point', async () => {
  const ui = await readFile(new URL('../components/discovery-business-card.js', import.meta.url), 'utf8')
  assert.match(ui, /className="home-business-category">\{railCategory\(row, locale\)\}/)
  assert.match(ui, /href=\{profile\} prefetch=\{false\}/)
  assert.match(ui, /OutboundBookingButton business=\{row\}/)
})
