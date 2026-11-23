import test from 'node:test'
import assert from 'node:assert/strict'
import { auditEnglishInventory, englishQualificationIssues } from '../lib/locale/english-coverage.mjs'
import { readFile } from 'node:fs/promises'
import { checkPublicEnglish } from '../scripts/check-public-english.mjs'

const entry = (text, categories = []) => ({ text, categories })
const inventory = { entries: { names: [entry('Боя', ['barber', 'auto_repair']), entry('MEGAN')],
  descriptions: [entry('Не включва материалите; пакет 2 посещения по 30 минути.')], units: [entry('1,5 часа / 2 посещения')] } }
const dictionary = { names: { 'Боя': 'Hair colouring' }, contextual: { auto_repair: { 'Боя': 'Car paint' } },
  descriptions: { 'Не включва материалите; пакет 2 посещения по 30 минути.': 'Materials not included; package of 2 visits of 30 minutes.' },
  units: { '1,5 часа / 2 посещения': '1.5 hours / 2 visits' } }

test('English coverage accepts exact reviewed strings plus category overrides without changing source or dictionary', () => {
  const before = JSON.stringify({ inventory, dictionary }), result = auditEnglishInventory(inventory, dictionary)
  assert.equal(result.complete, true)
  assert.deepEqual(result.totals.names, { unique: 2, requiringEnglish: 1 })
  assert.equal(JSON.stringify({ inventory, dictionary }), before)
  assert.match(result.limitation, /do not establish semantic/u)
})

test('missing translations, copied Bulgarian, generic pending placeholders and dropped quantities fail the coverage check', () => {
  assert.equal(auditEnglishInventory(inventory, {}).complete, false)
  const bad = structuredClone(dictionary)
  bad.names['Боя'] = 'Боя'
  bad.contextual.auto_repair['Боя'] = 'Service · English translation pending'
  bad.descriptions[Object.keys(bad.descriptions)[0]] = 'Materials not included; 30 minute visit.'
  const result = auditEnglishInventory(inventory, bad)
  assert.equal(result.complete, false)
  assert.equal(result.invalid.length, 2)
  assert.equal(result.quantityChanges.length, 1)
  assert.deepEqual(result.quantityChanges[0].sourceQuantities, ['2', '30'])
  assert.deepEqual(result.quantityChanges[0].targetQuantities, ['30'])
})

test('source-condition markers catch a dropped exclusion, VAT qualification, total-package condition and confirmation requirement', () => {
  assert.deepEqual(englishQualificationIssues('Не включва материали. Без ДДС; обща цена. Часът се потвърждава предварително.', 'Materials included. Price. Appointment.'), ['total', 'confirmation', 'exclusion', 'VAT', 'negation'])
  assert.deepEqual(englishQualificationIssues('Не включва материали. Без ДДС; обща цена. Часът се потвърждава предварително.', 'Materials not included. Excluding VAT; total price. The appointment is confirmed in advance.'), [])
})

test('the actual static cache covers every checked-in public/all source name, remaining description and unit without numeric or condition-marker loss', async () => {
  const [all, published] = await Promise.all([checkPublicEnglish({ scope: 'all', checkedOn: '2026-11-22' }), checkPublicEnglish({ scope: 'public', checkedOn: '2026-11-22' })])
  assert.equal(all.complete, true)
  assert.equal(published.complete, true)
  // The original audited source cohort stays intact. This release adds only
  // three Europe course names, two Elena/Europe descriptions, two explicitly
  // confirmed Azis hair names, two reviewed Suhodol in-person descriptions,
  // two exact Lyulin names/descriptions plus a price unit, and one new
  // source-reviewed Gorublyane description, one Dragalevtsi preparation note,
  // one Pavlovo title and description, an Obelya diagnostic explanation,
  // an Obelya course and description, a Lyulin dentist-specific note, and
  // two D-Bros titles and descriptions. Kabident reuses an existing name.
  // The next intake adds four exact titles, three descriptions and two package units.
  // The consultation and group HIIT add two titles and two descriptions, using an existing price unit.
  // The three additional venues add two titles, three precise descriptions and a ten-visit price unit.
  // The Lyulin 2 refresh adds one express-makeup condition; the dance class
  // and birthday package add two titles, two descriptions and one price unit.
  // The salt room, dentist, workshop and dance school add three titles and four exact descriptions.
  // The party venue and distinct central workshop add one title and two descriptions.
  // Simeonovo, Knyazhevo and Republika add five titles, five descriptions and one package unit.
  // These manual additions leave the frozen historical review metadata below
  // intact; supplements do not silently become extra original-cohort reviews.
  // Salt Home, Logos 152, Emika and Silver Star Ring Mall add two titles and five descriptions.
  // The gymnastics class and the two workshops add two titles and three descriptions.
  assert.deepEqual(Object.fromEntries(Object.entries(all.totals).map(([key, value]) => [key, value.unique])), { names: 6051 + 4 + 2 + 1 + 2 + 2 + 2 + 3 + 1 + 5 + 2 + 2, descriptions: 1804 + 3 + 2 + 1 + 2 + 3 + 3 + 4 + 2 + 5 + 5 + 3, units: 661 + 2 + 1 + 1 + 1 })
  for (const result of [all, published]) for (const key of ['missing', 'invalid', 'quantityChanges', 'qualificationChanges']) assert.equal(result[key].length, 0, key)
  const cache = JSON.parse(await readFile(new URL('../lib/locale/service-english.json', import.meta.url), 'utf8'))
  assert.equal(cache.metadata.review.nameSourcesIndividuallyAgentReviewed, 6040)
  assert.equal(cache.metadata.review.unitSourcesIndividuallyAgentReviewed, 660)
  assert.equal(cache.metadata.review.descriptionSourcesIndividuallyAgentReviewed, 495)
  assert.equal(cache.metadata.review.descriptionSourcesAutomatedConditionAndAlignmentReviewOnly, 1295)
  assert.equal(cache.metadata.review.certifiedHumanTranslation, false)
  assert.equal(cache.names['Изпиляване'], 'Filing')
  assert.equal(cache.contextual.other['Изпиляване'], 'Tooth preparation')
  assert.equal(cache.names['Силант'], 'Sealant')
  assert.equal(cache.contextual.other['Силант'], 'Fissure sealant')
  assert.equal(cache.metadata.provenance.license, 'CC BY 4.0')
  assert.match(cache.metadata.provenance.modifications, /No model\/runtime is shipped/u)
})
