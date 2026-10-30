// These 172 checks assert category/selected intent fields, NOT live relevance.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { parseIntent, discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoverySearchInput } from '../lib/discovery/search-ui.mjs'

const corpus = JSON.parse(await readFile(new URL('./fixtures/search-regression-172.json', import.meta.url)))
const labels = JSON.parse(await readFile(new URL('./fixtures/search-quality-category-labels.json', import.meta.url)))
assert.equal(corpus.cases.length, 172); assert.equal(labels.categoriesByCaseOrder.length, 172)
const now = DateTime.fromISO('2026-10-30T12:00:00', { zone: 'Europe/Sofia' })
const fields = {
  'GZ-002': { neighborhood: 'Младост 1' }, 'GZ-011': { date: '2026-10-31', timeFrom: '17:00' },
  'GZ-012': { neighborhood: 'Дружба 2' }, 'GZ-022': { neighborhood: 'Младост 4' },
  'GZ-041': { neighborhood: 'Манастирски ливади' }, 'GZ-051': { date: null, timeFrom: '13:00', clarification: null },
  'GZ-112': { neighborhood: 'Младост 1' }, 'GZ-113': { neighborhood: 'Младост 4' },
  'GZ-114': { neighborhood: 'Обеля 2' }, 'GZ-119': { neighborhood: 'Люлин 5' }, 'GZ-120': { neighborhood: 'Дружба 1' },
  'GZ-121': { city: 'Варна' }, 'GZ-127': { date: '2026-10-31', timeTo: '12:00' },
  'GZ-128': { date: '2026-11-02' }, 'GZ-130': { date: null, timeFrom: '19:00', timeTo: '21:00' },
  'GZ-132': { timeFrom: '14:30', timeTo: '14:30' }, 'GZ-137': { date: '2026-11-20' },
  'GZ-138': { date: '2026-10-31' }, 'GZ-140': { neighborhood: 'Младост 4' },
}
for (const [index, row] of corpus.cases.entries()) test(`${row.id}: offline labelled category and selected intent fields`, () => {
  const intent = parseIntent(discoveryRequestSchema.parse(discoverySearchInput({ query: row.query })), now, { v2: true })
  assert.equal(intent.category, labels.categoriesByCaseOrder[index], row.query)
  for (const [key, value] of Object.entries(fields[row.id] || {})) assert.equal(intent[key], value, `${row.id}.${key}`)
  if (row.id === 'GZ-134') assert.equal(intent.clarification.field, 'date')
  if (['GZ-010', 'GZ-023', 'GZ-122', 'GZ-124', 'GZ-158'].includes(row.id)) assert.equal(intent.clarification.field, 'coordinates')
  if (row.id === 'GZ-133') assert.equal(intent.appointmentClarification.field, 'date')
})
