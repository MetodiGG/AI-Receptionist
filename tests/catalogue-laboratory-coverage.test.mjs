import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { laboratorySearchService } from '../lib/discovery/laboratories.mjs'
import { railExternalAction } from '../lib/discovery/rail.mjs'

const now = DateTime.fromISO('2026-11-06T12:00:00Z')
const forbidden = () => assert.fail('Catalogue laboratory discovery cannot call Google, a model or any external appointment API')
const deps = { now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [],
  readCatalogue: async () => SOFIA_CATALOGUE, fetcher: forbidden, claimBudget: forbidden, authorizeGoogle: forbidden, getSlots: forbidden, getBusiness: forbidden }

test('the four requested lab brands find only individually reviewed appointment services, in BG and EN', async () => {
  for (const [terms, id] of [
    [['Геника', 'Genica'], 'sofia-genica-ami-bue'], [['Синево', 'Synevo'], 'sofia-synevo-home-visits'],
    [['Рамус', 'Ramus'], 'sofia-ramus-home-visits'], [['Цибалаб', 'Cibalab'], 'sofia-cibalab-home-visits'],
  ]) for (const query of terms) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps)
    assert.deepEqual(result.results.map(row => row.id), [id], query)
    assert.ok(railExternalAction(result.results[0], now.toMillis()))
    assert.equal(result.results[0].availability.status, 'external')
    assert.deepEqual(result.results[0].availability.slots, [])
  }
})

test('mobile labs are not fake nearby branches, unknown prices do not become free blood tests', async () => {
  for (const id of ['sofia-ramus-home-visits', 'sofia-synevo-home-visits', 'sofia-cibalab-home-visits']) {
    const row = SOFIA_CATALOGUE.find(record => record.id === id)
    assert.equal(row.locationKind, 'service_area'); assert.equal(row.address, null); assert.equal(row.coordinates, null)
    assert.ok(row.services.every(service => service.appointmentModel === 'booked_lab_visit' && !service.price))
  }
  const genica = SOFIA_CATALOGUE.find(row => row.id === 'sofia-genica-ami-bue')
  assert.match(genica.address, /Ами Буе 84/)
  assert.ok(genica.services.every(service => /NIFTY Pro/.test(service.name)))
  const near = await discoverBusinesses({ query: 'медицинска лаборатория', coordinates: { latitude: 42.67, longitude: 23.29, consent: true }, radiusKm: 2 }, deps)
  assert.ok(near.results.every(row => row.coordinates && row.distanceKm <= 2))
  const budget = await discoverBusinesses({ query: 'медицинска лаборатория до 30 евро', cityCode: '68134' }, deps)
  assert.equal(budget.results.length, 0, 'a published transport/handling fee is not a complete test price')
})

test('a lab brand must be a complete word, not an arbitrary substring', () => {
  for (const query of ['Xgenica', 'предгеника', 'genicaX', 'Cibalab123', 'псинево', 'синевото']) assert.equal(laboratorySearchService(query), null, query)
})

test('duplicate source discoveries enrich the existing car-wash ID rather than increasing the record count', () => {
  const records = SOFIA_CATALOGUE.filter(row => row.phone === '+359894405887')
  assert.deepEqual(records.map(row => row.id), ['sofia-lux-mbal-sveta-sofia-carwash'])
  assert.equal(records[0].openingHours.days.length, 5)
})

test('GTP vocabulary finds an actual appointment inspection, never assumes the co-located car wash books', async () => {
  for (const query of ['ГТП', 'годишен технически преглед', 'technical inspection']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps)
    assert.equal(result.intent.category, 'auto_repair')
    const arena = result.results.find(row => row.id === 'sofia-arena-isaev-gtp')
    assert.ok(arena, query)
    assert.ok(arena.services.every(service => !/автомивка/iu.test(service.name)))
  }
})
