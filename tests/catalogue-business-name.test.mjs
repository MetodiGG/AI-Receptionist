import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { businessNameMatches } from '../lib/discovery/business-name.mjs'

const now = DateTime.fromISO('2026-11-06T12:00:00Z')
const forbidden = () => assert.fail('Name search must not call a provider, charge a budget or mutate bookings')
const deps = patch => ({ now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [], readCatalogue: async () => SOFIA_CATALOGUE,
  fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden, ...patch })

test('two identifying name words may omit a generic descriptor but not an actual name word', () => {
  assert.equal(businessNameMatches('Algorithmics · Академия Питагор', 'Algorithmics Питагор'), true)
  for (const query of ['Academy', 'Академия', 'Algorithmics Пита', 'Питагор Algorithmics', 'Algorithmics неизвестен Питагор']) {
    assert.equal(businessNameMatches('Algorithmics · Академия Питагор', query), false, query)
  }
  assert.equal(businessNameMatches('Alpha Real Beta', 'Alpha Beta'), false)
})

test('real catalogue business names are discoverable without inventing a service category', async () => {
  for (const [query, ids] of [
    ['Mint Clinic', ['sofia-mint-clinic']], ['ДЕНТЕЛ', ['sofia-dentel-centre', 'sofia-dentel-lyulin']],
    ['Райна Василева', ['sofia-rayna-vasileva']], ['Rayna Vasileva', ['sofia-rayna-vasileva']],
    ['Underground Barbershop', ['sofia-underground-barbershop']],
  ]) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps())
    assert.equal(result.clarification, null, query)
    assert.deepEqual(result.results.map(row => row.id).sort(), ids.sort(), query)
    assert.ok(result.results.every(row => row.availability.status === 'external' && row.services.length))
  }
})

test('name matches do not remove explicit category, quarter, city, radius or price restrictions', async () => {
  for (const input of [
    { query: 'ДЕНТЕЛ', category: 'barber', cityCode: '68134' },
    { query: 'ДЕНТЕЛ', cityCode: '68134', neighborhood: 'Младост 1' },
    { query: 'ДЕНТЕЛ', cityCode: '56784' },
    { query: 'ДЕНТЕЛ', coordinates: { latitude: 42.67, longitude: 23.29, consent: true }, radiusKm: 1 },
    { query: 'ДЕНТЕЛ до 10 евро', cityCode: '68134' },
  ]) assert.equal((await discoverBusinesses(input, deps())).results.length, 0, JSON.stringify(input))
  const invalid = await discoverBusinesses({ query: 'ДЕНТЕЛ 2035-01-01', cityCode: '68134' }, deps())
  assert.equal(invalid.clarification?.field, 'date')
})

test('generic, unknown and partial-word names remain ambiguous, not fabricated recommendations', async () => {
  for (const query of ['Clinic', 'Studio', 'Клиника', 'Несъществуващ бизнес 987', 'Денте']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps())
    assert.equal(result.results.length, 0, query)
    assert.equal(result.clarification?.field, 'category', query)
  }
})

test('name search finds only public active partners and reads each source at most once', async () => {
  const partner = { id: '123e4567-e89b-42d3-a456-426614174000', name: 'Слънчев Кабинет', slug: 'slanchev-kabinet', active: true, platform_status: 'enabled',
    city_ekatte: '68134', city: 'София', address: 'ул. Пример 1', industry: 'other', public_profile: {},
    services: [{ id: 's1', name: 'Консултация', category: 'other', active: true, price: 30, duration_min: 30 }] }
  let internalReads = 0, catalogueReads = 0
  const data = deps({ readInternal: async () => { internalReads++; return [partner, { ...partner, id: 'hidden', name: 'Тайна Клиника', active: false }] },
    readCatalogue: async () => { catalogueReads++; return [] } })
  const result = await discoverBusinesses({ query: 'Слънчев Кабинет', cityCode: '68134' }, data)
  assert.deepEqual(result.results.map(row => row.id), [partner.id])
  assert.equal(internalReads, 1); assert.equal(catalogueReads, 1)
  assert.equal((await discoverBusinesses({ query: 'Слънчев Кабинет до 10 евро', cityCode: '68134' }, data)).results.length, 0)
  const hidden = await discoverBusinesses({ query: 'Тайна Клиника', cityCode: '68134' }, data)
  assert.equal(hidden.results.length, 0)
})

test('a name cannot revive an expired/draft listing, guess a city or bypass an invalid time', async () => {
  const original = SOFIA_CATALOGUE.find(row => row.id === 'sofia-mint-clinic')
  for (const verification of [{ ...original.verification, status: 'draft' }, { ...original.verification, validUntil: '2026-11-05' }]) {
    const result = await discoverBusinesses({ query: 'Mint Clinic', cityCode: '68134' }, deps({ readCatalogue: async () => [{ ...original, verification }] }))
    assert.equal(result.results.length, 0)
  }
  const city = await discoverBusinesses({ query: 'Mint Clinic' }, deps())
  assert.equal(city.clarification?.field, 'city')
  const clock = await discoverBusinesses({ query: 'Mint Clinic утре след 28:00', cityCode: '68134' }, deps())
  assert.equal(clock.clarification?.field, 'time')
})
