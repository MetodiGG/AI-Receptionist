import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildPublicEnglishInventory, writePublicEnglishInventory } from '../scripts/inventory-public-english.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'

const checkedOn = '2026-11-22'
const suggestions = { beauty: [{ key: 'hair', services: [
  { id: 'cut', bg: 'Подстригване', en: 'Haircut' },
  { id: 'other', bg: 'Подстригване', en: 'Grooming haircut' },
] }] }
const catalogue = [{
  id: 'source-one', category: 'hair', services: [
    { name: '  Подстригване  ', description: 'Точен вариант за 2 посещения.', price: { amount: 20, currency: 'EUR', unit: 'пакет 2 посещения' } },
    { name: 'Подстригване · дълга коса', description: 'Меню за посочения салон; вариантът и специалистът се потвърждават при записване.', price: { amount: 30, currency: 'EUR', unit: 'посещение' } },
  ],
}]
const partners = [{
  id: 'partner-one', industry: 'auto', phone: 'DO_NOT_EXPORT', address: 'DO_NOT_EXPORT', services: [
    { id: 'p1', name: 'Диагностика', description: 'Само за 1 автомобил.', price: 50, currency: 'EUR', price_details: { kind: 'from', unit: 'автомобил' } },
    { id: 'p2', name: 'Hidden service', active: false, price: 123 },
  ],
}, { id: 'hidden-partner', active: false, services: [{ name: 'Hidden business service' }] }]

test('offline inventory keeps exact source leaf keys, all price quantities, context and ambiguous seeds without changing any input', () => {
  const before = JSON.stringify({ catalogue, partners, suggestions })
  const result = buildPublicEnglishInventory({ catalogue, partners, suggestions, checkedOn, scope: 'all' })
  assert.equal(JSON.stringify({ catalogue, partners, suggestions }), before)
  assert.equal(result.entries.names.length, 3)
  const haircut = result.entries.names.find(row => row.text === '  Подстригване  ')
  assert.ok(haircut, 'source key is not trimmed or renamed')
  assert.equal(haircut.requiresEnglish, true)
  assert.deepEqual(haircut.seedCandidates.map(row => row.en), ['Grooming haircut', 'Haircut'])
  assert.equal(result.entries.names.find(row => row.text === 'Подстригване · дълга коса').seedCandidates, undefined, 'a qualified source is not replaced by a looser generic suggestion')
  assert.deepEqual(result.entries.units.map(row => row.text), ['автомобил', 'пакет 2 посещения', 'посещение'])
  assert.deepEqual(result.entries.descriptions.map(row => row.text), ['Само за 1 автомобил.', 'Точен вариант за 2 посещения.'])
  assert.equal(result.sourceCounts.catalogueServices, 2); assert.equal(result.sourceCounts.partnerServices, 1)
  assert.equal(result.sourceCounts.partnerBusinesses, 1)
  assert.doesNotMatch(JSON.stringify(result), /DO_NOT_EXPORT|Hidden service|Hidden business service/)
  assert.match(result.sourceFingerprints.catalogue, /^[a-f\d]{64}$/)
})

test('public scope uses actual catalogue publication eligibility while all scope remains an explicit authoring choice', () => {
  const current = SOFIA_CATALOGUE.find(row => row.id === 'sofia-mr-pet')
  const source = current || SOFIA_CATALOGUE[0]
  const expired = { ...structuredClone(source), id: 'sofia-expired-english-inventory', verification: { ...source.verification, checkedOn: '2020-01-01' } }
  const result = buildPublicEnglishInventory({ catalogue: [source, expired], checkedOn, scope: 'public' })
  assert.equal(result.sourceCounts.catalogueBusinesses, 2)
  assert.equal(result.sourceCounts.eligibleCatalogueBusinesses, 1)
  assert.equal(result.sourceCounts.selectedCatalogueBusinesses, 1)
  assert.ok(result.entries.names.every(row => row.examples.every(example => example.businessId !== expired.id)))
  assert.equal(buildPublicEnglishInventory({ catalogue: [source, expired], checkedOn, scope: 'all' }).sourceCounts.selectedCatalogueBusinesses, 2)
})

test('inventory rejects ambiguous dates/scopes and output can never overwrite checked-in business/source files', async () => {
  for (const date of ['2026-02-30', '22-11-2026', '', null]) assert.throws(() => buildPublicEnglishInventory({ checkedOn: date }), /date/)
  assert.throws(() => buildPublicEnglishInventory({ checkedOn, scope: 'live' }), /Scope/)
  await assert.rejects(writePublicEnglishInventory('relative.json', {}), /absolute JSON/)
  await assert.rejects(writePublicEnglishInventory(new URL('../lib/discovery/catalogue-data/english.json', import.meta.url).pathname, {}), /project\/source/)
  const directory = await mkdtemp(join(tmpdir(), 'gorez-english-inventory-test-'))
  const output = join(directory, 'inventory.json')
  try {
    await writePublicEnglishInventory(output, { verified: true })
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), { verified: true })
    await assert.rejects(writePublicEnglishInventory(output, { verified: false }), { code: 'EEXIST' })
    await writePublicEnglishInventory(output, { verified: false }, { overwrite: true })
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), { verified: false })
  } finally { await rm(directory, { recursive: true }) }
})
