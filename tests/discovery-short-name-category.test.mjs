import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { createDiscoveryHandler } from '../lib/discovery/handler.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { matchingServices } from '../lib/discovery/internal-search.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'

const now = DateTime.fromISO('2026-11-13T12:00:00Z')
const service = (id, name, category, patch = {}) => ({ id, name, category, active: true, price: 20, currency: 'EUR', duration_min: 30, ...patch })
const partner = services => ({
  id: '123e4567-e89b-42d3-a456-426614174000', name: 'IN Beauty', slug: 'synthetic-short-brand',
  active: true, platform_status: 'enabled', industry: 'beauty', city_ekatte: '68134', city: 'София',
  address: 'София, измислен тестов адрес 1', public_profile: {}, services,
})
const forbidden = () => assert.fail('No provider, budget, appointment or production call is allowed')
async function handlerSearch(services, input, patch = {}) {
  const row = partner(services)
  let internalReads = 0, catalogueReads = 0
  const handler = createDiscoveryHandler({
    now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true', DISCOVERY_PROVIDER_MODE: 'catalogue' }),
    allowAttempt: async () => true,
    readInternal: async () => { internalReads++; return [row] }, readCatalogue: async () => { catalogueReads++; return [] },
    fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden, ...patch,
  })
  const response = await handler(new Request('https://www.gorez.co/api/public/discovery', {
    method: 'POST', headers: { Origin: 'https://www.gorez.co', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'IN Beauty', cityCode: '68134', ...input }),
  }))
  assert.equal(response.status, 200)
  assert.ok(internalReads <= 1); assert.ok(catalogueReads <= 1)
  return response.json()
}

test('actual handler: the exact short native brand cannot turn a nail-only menu into barber or auto repair', async () => {
  for (const category of ['barber', 'auto_repair', 'beauty', 'hair', 'other']) {
    const response = await handlerSearch([service('n', 'Маникюр', 'nails')], { category })
    assert.deepEqual(response.results, [], category)
  }
  const nails = await handlerSearch([service('n', 'Маникюр', 'nails')], { category: 'nails' })
  assert.deepEqual(nails.results.map(row => row.id), [partner([]).id])
})

test('actual handler: an explicit category returns only its real declared service rows from a mixed name match', async () => {
  const rows = [service('n', 'Маникюр', 'nails'), service('h', 'Мъжко подстригване', 'barber'), service('b', 'Оформяне на брада', 'barber'),
    service('wrong', 'Оформяне на брада с подвеждащ етикет', 'nails'), service('off', 'Скрита брада', 'barber', { active: false })]
  const response = await handlerSearch(rows, { category: 'barber' })
  assert.deepEqual(response.results[0].services.map(row => row.name), ['Мъжко подстригване', 'Оформяне на брада'])
  const unspecified = await handlerSearch(rows, {})
  // The HTTP boundary keeps its existing two-service preview cap; the
  // unfiltered server-side name match retains every actual public service.
  assert.deepEqual(unspecified.results[0].services.map(row => row.name), rows.filter(row => row.active).slice(0, 2).map(row => row.name))
  assert.deepEqual(matchingServices(partner(rows), { businessNameQuery: 'in beauty', category: null, service: '', searchV2: true }).map(row => row.name), rows.filter(row => row.active).map(row => row.name))
  const beardFirst = await handlerSearch([...rows].reverse(), {})
  assert.deepEqual(beardFirst.results[0].services.map(row => row.name), rows.filter(row => row.active).reverse().slice(0, 2).map(row => row.name))
})

test('actual handler: missing/free native category needs actual service text, not the beauty industry', async () => {
  const rows = [service('n', 'Маникюр', undefined), service('h', 'Мъжко подстригване', undefined), service('b', 'Оформяне на брада', 'Бръснарски услуги'), service('f', 'Почистване на лице', undefined)]
  const response = await handlerSearch(rows, { category: 'barber' })
  assert.deepEqual(response.results[0].services.map(row => row.name), ['Мъжко подстригване', 'Оформяне на брада'])
  const beauty = await handlerSearch(rows, { category: 'beauty' })
  assert.deepEqual(beauty.results[0].services.map(row => row.name), ['Почистване на лице'])
})

test('actual handler: a partial/unknown short brand cannot expose an account or manufacture service evidence', async () => {
  for (const query of ['IN', 'Beau', 'IN Unknown']) {
    const response = await handlerSearch([service('n', 'Маникюр', 'nails')], { query })
    assert.deepEqual(response.results, [], query)
  }
  for (const status of [{ active: false }, { platform_status: 'disabled' }]) {
    const response = await handlerSearch([service('n', 'Маникюр', 'nails')], { category: 'nails' }, { readInternal: async () => [{ ...partner([service('n', 'Маникюр', 'nails')]), ...status }] })
    assert.deepEqual(response.results, [])
  }
})

test('the name-only guard retains budget/duration checks and the existing uncategorised Other-business exception', () => {
  const base = { businessNameQuery: 'in beauty', category: 'barber', service: 'in beauty', searchV2: true }
  const row = partner([service('valid', 'Мъжко подстригване', 'barber'), service('expensive', 'Оформяне на брада', 'barber', { price: 40 }), service('long', 'Мъжко подстригване 60 мин', 'barber', { duration_min: 60 }), service('wrong', 'Маникюр', 'nails')])
  assert.deepEqual(matchingServices(row, { ...base, durationMin: 30, budget: { max: 25, currency: 'EUR' } }).map(row => row.id), ['valid'])
  const generic = partner([service('c', 'Индивидуална консултация', undefined)])
  assert.deepEqual(matchingServices(generic, { ...base, category: 'other' }), [])
  assert.equal(matchingServices({ ...generic, industry: 'other' }, { ...base, category: 'other' }).length, 1)
  assert.equal(matchingServices({ ...generic, businessCategory: 'other' }, { ...base, category: 'other' }).length, 1)
})

test('ordinary browsing and the existing specific catalogue health-massage exception are not broadened or removed', () => {
  const native = partner([service('n', 'Маникюр', 'nails'), service('h', 'Мъжко подстригване', 'barber')])
  assert.deepEqual(matchingServices(native, { browse: true, category: 'nails', service: 'маникюр', searchV2: true }).map(row => row.id), ['n'])
  assert.equal(matchingServices(native, { browse: true, searchV2: true }).length, 2)
  const catalogue = {
    id: 'sofia-synthetic-massage', name: 'Synthetic Massage', cityCode: '68134', neighborhood: null, address: 'София, измислен тестов адрес 2', locationKind: 'premises', coordinates: null,
    category: 'health', website: 'https://example.com/', phone: '+359888111222', booking: { kind: 'phone', phone: '+359888111222' },
    services: [{ name: 'Класически масаж', category: 'health', appointmentModel: 'appointment' }],
    verification: { status: 'approved', checkedOn: '2026-11-13', validUntil: '2027-02-11', booking: { url: 'https://example.com/', excerpt: 'Book a synthetic fixture massage appointment' }, contact: 'https://example.com/' },
  }
  const intent = { category: 'other', service: 'масаж', requirements: [], searchV2: true }
  assert.equal(normalizeCatalogueBusinesses([catalogue], intent, { now: now.toMillis() }).length, 1)
  assert.deepEqual(normalizeCatalogueBusinesses([catalogue], { ...intent, browse: true }, { now: now.toMillis() }), [])
})
