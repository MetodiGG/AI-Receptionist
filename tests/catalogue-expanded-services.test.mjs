import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
const now = DateTime.fromISO('2026-11-06T12:00:00Z')
const forbidden = () => assert.fail('Catalogue expansion must not call a metered provider or create an appointment')
const deps = { now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [],
  readCatalogue: async () => SOFIA_CATALOGUE, fetcher: forbidden, claimBudget: forbidden, getSlots: forbidden, getBusiness: forbidden }

test('a specific massage request finds actual published massage services filed under Therapies', () => {
  const massage = SOFIA_CATALOGUE.find(row => row.id === 'sofia-body-atelier')
  const intent = { category: 'other', service: 'релаксиращ масаж', searchV2: true, cityCode: '68134', requirements: [] }
  const results = normalizeCatalogueBusinesses([massage], intent, { now: now.toMillis() })
  assert.equal(results.length, 1)
  assert.equal(results[0].services[0].name, 'Релаксиращ масаж')
  assert.equal(normalizeCatalogueBusinesses([massage], { ...intent, service: 'зъболекар' }, { now: now.toMillis() }).length, 0)
  assert.equal(normalizeCatalogueBusinesses([massage], { ...intent, browse: true, service: null }, { now: now.toMillis() }).length, 0, 'explicit Other category browsing stays within its category')
})

test('Bulgarian and English squash requests find a real reserved squash court, not ordinary gym entry', async () => {
  for (const query of ['скуош', 'squash']) {
    const result = await discoverBusinesses({ query, cityCode: '68134', locale: 'bg' }, deps)
    assert.equal(result.intent.category, 'fitness')
    assert.ok(result.results.some(row => row.id === 'sofia-squash-club-bulgaria'), query)
    assert.ok(result.results.every(row => row.services.some(service => /скуош/iu.test(service.name))), query)
  }
})

test('photo-studio vocabulary finds actual photo sessions and rentals, not every Other service', async () => {
  for (const query of ['фотостудио', 'photo studio']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps)
    assert.equal(result.intent.category, 'other')
    for (const id of ['sofia-areab19', 'sofia-art-club-diplomat', 'sofia-fotosmagoria', 'sofia-6trak-studio']) assert.ok(result.results.some(row => row.id === id), `${query}: ${id}`)
    assert.ok(result.results.every(row => row.services.every(service => /фото|снимк/iu.test(service.name))))
  }
})

test('an explicit photo-studio rental must not become a request for a photographer', async () => {
  const result = await discoverBusinesses({ query: 'фотостудио под наем', cityCode: '68134' }, deps)
  assert.ok(result.results.some(row => row.id === 'sofia-areab19'))
  assert.ok(!result.results.some(row => row.id === 'sofia-6trak-studio'))
})

test('kinesitherapy vocabulary finds real treatments in the existing Therapies category', async () => {
  for (const query of ['кинезитерапия', 'kinesitherapy', 'kinesiotherapy']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps)
    assert.equal(result.intent.category, 'health')
    assert.ok(result.results.some(row => row.id === 'sofia-bodyflow'), query)
    assert.ok(result.results.every(row => row.services.every(service => /кинезитерап/iu.test(service.name))), query)
  }
})

test('escape-room vocabulary finds bookable games, never a clinic with a laboratory story', async () => {
  for (const query of ['ескейп стая', 'escape room']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, deps)
    assert.equal(result.intent.category, 'other')
    for (const id of ['sofia-escapeway-crystal-skull', 'sofia-escapeway-black-pearl', 'sofia-game-castle-centre', 'sofia-horror-house']) assert.ok(result.results.some(row => row.id === id), `${query}: ${id}`)
    assert.ok(result.results.every(row => row.services.every(service => /ескейп/iu.test(service.name))))
  }
})
