import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { normalizedSearchKey, searchTextEvidence } from '../lib/discovery/text-match.mjs'
import { identifySearchService, serviceSearchPhrase, serviceHasEvidence } from '../lib/discovery/service-lexicon.mjs'
import { normalizeCatalogueBusinesses, rankCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { normalizeInternalBusinesses, hydrateInternalCandidates } from '../lib/discovery/internal-search.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const now = DateTime.fromISO('2026-11-14T12:00:00Z')
const forbidden = () => assert.fail('Local discovery must not call a provider, charge a budget, or submit a booking')
const id = number => `123e4567-e89b-42d3-a456-${String(number).padStart(12, '0')}`
const native = (number, patch = {}) => ({ id: id(number), name: `Публичен салон ${number}`, slug: `public-salon-${number}`, active: true, platform_status: 'enabled',
  city_ekatte: '68134', city: 'София', address: 'ул. Пример 1', neighborhood: 'Борово', industry: 'beauty', public_profile: {},
  services: [{ id: `service-${number}`, name: 'Маникюр', category: 'nails', active: true, price: 30, currency: 'EUR', duration_min: 30 }], ...patch })
const catalogue = patch => ({ ...structuredClone(SOFIA_CATALOGUE[0]), id: 'sofia-core-reviewed', name: 'Проверен салон', category: 'nails',
  address: 'София, ул. Примерна 83', coordinates: null, services: [{ name: 'Маникюр', category: 'nails', appointmentModel: 'appointment' }], ...patch })
const dependencies = patch => ({ now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [], readCatalogue: async () => [],
  fetcher: forbidden, claimBudget: forbidden, getBusiness: forbidden, getSlots: forbidden, ...patch })
const search = (query, patch = {}, input = {}) => discoverBusinesses({ query, cityCode: '68134', ...input }, dependencies(patch))
const intent = patch => ({ category: 'nails', categoryFilter: false, cityCode: '68134', requirements: [], service: 'маникюр', searchV2: true, ...patch })

test('shared evidence is script/accent/punctuation insensitive, conservative, and requires all meaningful words', () => {
  assert.equal(normalizedSearchKey('  МАНИКЮР — Café  '), 'manikyur cafe')
  assert.equal(searchTextEvidence('Маникюр', 'manikyur')?.kind, 'exact')
  assert.equal(searchTextEvidence('Салон Aurelia', 'Aureliа')?.kind, 'words', 'mixed-script equivalent')
  assert.equal(searchTextEvidence('Aurelia Beauty', 'Aurelya')?.kind, 'typo')
  assert.equal(searchTextEvidence('Aurelia Beauty', 'Axxxlia'), null)
  assert.equal(searchTextEvidence('Мъжко подстригване', 'детско подстригване'), null)
  assert.equal(searchTextEvidence('Aurelia Beauty', 'Aurelia missing'), null)
})

test('finite reviewed aliases canonicalize common casual BG/EN/transliterated requests without erasing qualifiers', () => {
  for (const [query, service] of [['manikiur', 'маникюр'], ['frizior', 'фризьор'], ['avtoserviz', 'автосервиз'], ['barber', 'барбершоп'], ['гумаджия', 'смяна на гуми']]) {
    assert.equal(identifySearchService(query)?.service, service, query)
  }
  assert.equal(serviceSearchPhrase('искам да се подстрижа', identifySearchService('искам да се подстрижа')), 'подстригване')
  assert.equal(serviceSearchPhrase('котешки груминг', identifySearchService('котешки груминг')), 'котешки груминг')
  assert.equal(serviceSearchPhrase('пилатес реформър', identifySearchService('пилатес реформър')), 'пилатес реформър')
  assert.equal(serviceSearchPhrase('данъчен консултант', identifySearchService('данъчен консултант')), 'данъчен консултант')
  assert.equal(serviceHasEvidence('Боксови плитки', 'бокс'), false)
  assert.equal(serviceHasEvidence('Индивидуална тренировка по бокс', 'бокс'), true)
  assert.equal(serviceHasEvidence('Къпане и подстригване на кучета pets', 'подстригване'), false)
  assert.equal(serviceHasEvidence('Полиране на зъби other', 'автодетайлинг'), false)
  assert.equal(serviceHasEvidence('Полиране detailing', 'автодетайлинг'), true)
})

test('specific actual services cross parent categories, but an explicit category is still a hard filter and identifiers remain stable', () => {
  const record = catalogue({ category: 'beauty', services: [
    { name: 'Маникюр', category: 'nails', appointmentModel: 'appointment' },
    { name: 'Мъжко подстригване', category: 'barber', appointmentModel: 'appointment' },
  ] })
  const hair = intent({ category: 'hair', service: 'подстригване' })
  const rows = normalizeCatalogueBusinesses([record], hair, { now: now.toMillis() })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].services[0].id, 'sofia-core-reviewed-1')
  assert.equal(rows[0].services[0].category, 'barber')
  assert.equal(normalizeCatalogueBusinesses([record], { ...hair, categoryFilter: true }, { now: now.toMillis() }).length, 0)
  const direct = normalizeCatalogueBusinesses([record], intent({ category: 'barber', categoryFilter: true, service: 'подстригване' }), { now: now.toMillis() })
  assert.equal(direct[0].services[0].id, rows[0].services[0].id)
})

test('a new literal public service and a real street resolve without a pre-programmed category or invented menu', async () => {
  const record = catalogue({ services: [{ name: 'Хромотерапия', category: 'beauty', appointmentModel: 'appointment' }] })
  for (const query of ['Хромотерапия', 'Примерна 83']) {
    const result = await search(query, { readCatalogue: async () => [record] })
    assert.equal(result.clarification, null, query)
    assert.deepEqual(result.results.map(row => row.id), [record.id], query)
    assert.deepEqual(result.results[0].services.map(service => service.name), ['Хромотерапия'])
  }
  const absent = await search('Несъществуваща услуга 987', { readCatalogue: async () => [record] })
  assert.equal(absent.results.length, 0)
  assert.equal(absent.clarification?.field, 'category')
})

test('exact service relevance precedes a nearby partner advantage, with the bounded partner tie retained for comparable services', () => {
  const origin = { latitude: 42.67, longitude: 23.29 }
  const base = { source: 'catalogue', name: 'Факт', coordinates: origin, booking: { kind: 'phone' }, services: [{ name: 'Маникюр с гел лак' }] }
  const nearPartner = { ...base, id: 'near', source: 'gorez', name: 'Близък партньор' }
  const exact = { ...base, id: 'exact', name: 'Точна услуга', coordinates: { latitude: 42.7, longitude: 23.3 }, services: [{ name: 'Маникюр' }] }
  const ranked = rankCatalogueBusinesses([nearPartner], [exact], intent({ coordinates: origin, radiusKm: 10 }))
  assert.equal(ranked[0].id, 'exact')
  const comparable = rankCatalogueBusinesses([{ ...nearPartner, services: [{ name: 'Маникюр' }] }], [exact], intent({ coordinates: origin, radiusKm: 10 }))
  assert.equal(comparable[0].id, 'near')
})

test('actual name typos are conservative, and private/inactive/pending profiles never become name evidence', async () => {
  const partner = native(1, { name: 'Aurelia Beauty' })
  const result = await search('Aurelya Beauty', { readInternal: async () => [partner] })
  assert.deepEqual(result.results.map(row => row.id), [partner.id])
  for (const state of [{ active: false }, { platform_status: 'pending' }, { platform_status: 'suspended' }]) {
    assert.equal((await search(partner.name, { readInternal: async () => [{ ...partner, ...state }] })).results.length, 0)
  }
  assert.equal((await search('Aure', { readInternal: async () => [partner] })).results.length, 0)
})

test('published external, phone-only and service-less profiles remain discoverable by actual name without fabricated slots', async () => {
  for (const booking_mode of ['external', 'phone', 'gorez']) {
    const partner = native(1, { name: 'Aurelia Beauty', booking_mode, ...(booking_mode === 'gorez' ? { services: [] } : {}) })
    const result = await search(partner.name, { readInternal: async () => [partner] })
    assert.deepEqual(result.results.map(row => row.id), [partner.id], booking_mode)
    assert.deepEqual(result.results[0].availability.slots, [])
    assert.notEqual(result.results[0].availability.status, 'verified')
  }
})

test('the global native inventory is ranked before pagination rather than silently limited to the first100', async () => {
  const partners = Array.from({ length: 150 }, (_, index) => native(index + 1))
  const target = partners.at(-1)
  target.name = 'Последен действителен бизнес'
  const result = await search(target.name, { readInternal: async () => partners })
  assert.deepEqual(result.results.map(row => row.id), [target.id])
})

test('native final hydration fails closed on publication revocation and errors; cursor consumes the examined page', async () => {
  const partners = Array.from({ length: 20 }, (_, index) => native(index + 1))
  const result = await search('маникюр', { readInternal: async () => partners, hydrateInternalCandidates: async () => [] })
  assert.equal(result.results.length, 0)
  assert.equal(result.cataloguePage.total, 20)
  assert.equal(result.cataloguePage.nextOffset, 15)
  const failed = await search('маникюр', { readInternal: async () => partners, hydrateInternalCandidates: async () => { throw Error('database unavailable') } })
  assert.equal(failed.results.length, 0)
  assert.ok(failed.warnings.includes('internal_unavailable'))
})

test('an actual native business with zero slots remains discoverable; empty availability is not an invented slot', async () => {
  const partner = native(1)
  const result = await search('маникюр утре', { readInternal: async () => [partner], getBusiness: async () => ({ ...partner, timezone: 'Europe/Sofia' }), getSlots: async () => [] })
  assert.equal(result.results[0].availability.status, 'none')
  assert.deepEqual(result.results[0].availability.slots, [])
})

test('rich native hydration rechecks explicit publication with bound IDs and public eligibility', async () => {
  const calls = []
  const db = { from(table) { assert.equal(table, 'businesses'); return this }, select() { return this },
    in(field, ids) { calls.push([field, ids]); return this }, eq() { return this }, limit() { return this },
    then(resolve) { return Promise.resolve({ data: [native(1), native(2, { platform_status: 'pending' })], error: null }).then(resolve) } }
  assert.deepEqual((await hydrateInternalCandidates(db, [id(1), id(2), "x');drop table businesses;--"])).map(row => row.id), [id(1)])
  assert.deepEqual(calls, [['id', [id(1), id(2)]]])
})

test('explicit category evidence tolerates native freeform labels but does not accept a known conflicting category', () => {
  const row = native(1, { services: [{ id: 's', name: 'Мъжко подстригване', category: 'Бръснарски услуги', active: true }] })
  const barber = intent({ category: 'barber', categoryFilter: true, service: 'барбершоп' })
  assert.equal(normalizeInternalBusinesses([row], barber).length, 1)
  assert.equal(normalizeInternalBusinesses([{ ...row, services: [{ ...row.services[0], category: 'nails' }] }], barber).length, 0)
})
