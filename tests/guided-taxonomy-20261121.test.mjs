import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile, access } from 'node:fs/promises'
import { DateTime } from 'luxon'
import { CATEGORY_IDS } from '../lib/discovery/categories.mjs'
import { DISCOVERY_SUBCATEGORIES, SUBCATEGORY_IDS, subcategoryById, subcategoriesForCategory, matchesSubcategory, subcategoryOptionsForBusinesses, filterBusinessesBySubcategory } from '../lib/discovery/subcategories.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { approvedCatalogueRecord } from '../lib/discovery/catalogue-policy.mjs'
import { discoveryRequestSchema } from '../lib/discovery/intent.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'

const audit = JSON.parse(await readFile(new URL('../docs/guided-discovery-taxonomy-20261121.json', import.meta.url), 'utf8'))
const now = DateTime.fromISO(audit.asOf)
const revalidatedIds = new Set(['sofia-svetlinki-sheynovo13a', 'sofia-artizba-cherni-vrah33e'])
const oldEducationText = execFileSync('git', ['show', 'b8dcdf4:lib/discovery/catalogue-data/neighborhood-home-education-2000-006-20261113.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' })
const oldEducation = (await import('data:text/javascript;base64,' + Buffer.from(oldEducationText).toString('base64'))).default.records
// Audit counts and service examples describe November 21. Keep exactly the
// two prior source versions instead of pretending their November 22 reviews
// already existed or changing the immutable taxonomy audit to a newer date.
const historicalCatalogue = SOFIA_CATALOGUE.map(row => revalidatedIds.has(row.id)
  ? { ...oldEducation.find(item => item.id === row.id), coordinates: row.coordinates } : row)
const approved = historicalCatalogue.map(row => approvedCatalogueRecord(row, now.toMillis())).filter(Boolean)
const addedIds = audit.additions.map(item => item.id)
const noProvider = () => assert.fail('Taxonomy filtering must not contact a metered provider, Maps, availability or booking endpoint')
const deps = {
  config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), now,
  readCatalogue: async () => historicalCatalogue, readInternal: async () => [],
  claimBudget: noProvider, fetcher: noProvider, authorizeGoogle: noProvider, getBusiness: noProvider, getSlots: noProvider,
}

test('guided taxonomy keeps all104 legacy IDs in their order, all14 category relationships and the folk dance option', () => {
  assert.equal(SUBCATEGORY_IDS.length, 113)
  assert.equal(new Set(SUBCATEGORY_IDS).size, 113)
  assert.deepEqual(SUBCATEGORY_IDS.filter(id => !addedIds.includes(id)), audit.preservedIds)
  assert.deepEqual([...new Set(DISCOVERY_SUBCATEGORIES.map(item => item.category))].sort(), [...CATEGORY_IDS].sort())
  assert.equal(subcategoryById('fitness-folk-dance').bg, 'Народни танци')
  assert.equal(subcategoryById('hair-extensions').photo, '/service-photos/hair-extension-row-v1.webp')
  assert.equal(subcategoryById('barber-children').category, 'barber')
  assert.equal(subcategoryById('hair-children').category, 'hair')
  assert.equal(approved.length, 1708, 'As-of21Nov audit does not refresh an expired18Nov listing')
})

for (const addition of audit.additions) {
  test(`new ${addition.id} has real approved service support, a correct parent and unchanged bilingual existing photo`, async () => {
    const definition = subcategoryById(addition.id)
    assert.deepEqual(definition, Object.fromEntries(Object.entries(addition).filter(([key]) => !['businessCount', 'serviceCount', 'examples'].includes(key))))
    assert.ok(definition.bg && definition.en)
    for (const locale of ['bg', 'en']) {
      assert.equal(subcategoriesForCategory(definition.category, locale).find(item => item.id === addition.id).label, definition[locale])
    }
    await access(new URL('../public' + definition.photo, import.meta.url))
    const bytes = await readFile(new URL('../public' + definition.photo, import.meta.url))
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF')
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP')
    const hits = approved.flatMap(row => row.services.filter(service => matchesSubcategory(service, addition.id, row)).map(service => ({ row, service })))
    assert.equal(hits.length, addition.serviceCount)
    assert.equal(new Set(hits.map(item => item.row.id)).size, addition.businessCount)
    assert.ok(hits.length > 0)
    for (const example of addition.examples) {
      const row = approved.find(row => row.id === example.businessId)
      assert.ok(row, example.businessId)
      const service = row.services.find(service => service.name === example.serviceName)
      assert.ok(service, example.serviceName)
      assert.ok(matchesSubcategory(service, addition.id, row))
      assert.equal(service.category, definition.category)
    }
    assert.equal(matchesSubcategory({ name: addition.bg, category: definition.category, active: false }, addition.id), false)
    assert.equal(matchesSubcategory({ name: addition.examples[0].serviceName, category: definition.category === 'hair' ? 'barber' : 'other' }, addition.id), false)
    assert.equal(matchesSubcategory({ name: 'Консултация', category: definition.category }, addition.id, { name: addition.examples[0].serviceName }), false, 'business name alone cannot fabricate a selected service')
  })

  test(`new ${addition.id} uses the shared server filter/facets without provider calls or unrelated services`, async () => {
    const input = discoveryRequestSchema.parse({ query: '', browse: true, cityCode: '68134', category: addition.category, subcategory: addition.id })
    const result = await discoverBusinesses(input, deps)
    assert.ok(result.results.length > 0, addition.id)
    assert.equal(result.intent.subcategory, addition.id)
    const option = result.subcategoryOptions.find(item => item.id === addition.id)
    assert.ok(option?.count > 0)
    assert.ok(result.subcategoryOptions.every(item => item.category === addition.category && item.count > 0))
    assert.ok(result.results.every(row => row.services.length > 0 && row.services.every(service => matchesSubcategory(service, addition.id, row))))
    assert.equal(result.external, null)
    assert.equal(discoveryRequestSchema.safeParse({ query: '', browse: true, category: addition.category === 'hair' ? 'barber' : 'hair', subcategory: addition.id }).success, false)
  })
}

test('new choices require the specific actual method, recipient, activity or format instead of a related word', () => {
  for (const [id, category, valid, invalid] of [
    ['hair-children', 'hair', 'Children’s haircut', 'Детска прическа за празник'],
    ['hair-children', 'hair', 'Подстригване на момиче', 'Дамско подстригване'],
    ['hair-braids', 'hair', 'Hair braiding', 'Прическа за повод'],
    ['nails-strengthening', 'nails', 'Natural nail strengthening', 'Сваляне на гел лак със заздравител'],
    ['nails-apparatus-pedicure', 'nails', 'Апаратен педикюр без лак', 'Класически педикюр'],
    ['nails-apparatus-pedicure', 'nails', 'Machine pedicure', 'Апаратен маникюр'],
    ['beauty-brow-lamination', 'beauty', 'Brow lamination', 'Ламиниране на мигли'],
    ['fitness-group-training', 'fitness', 'Group strength workout', 'Индивидуална функционална тренировка'],
    ['fitness-group-training', 'fitness', 'Групова тренировка по бокс', 'Силова тренировка с инструктор'],
    ['education-mathematics', 'education', 'Mathematics lesson', 'Урок по английски език'],
    ['education-exam-preparation', 'education', 'Exam preparation lesson', 'Годишен медицински преглед'],
    ['home_services-furniture-assembly', 'home_services', 'Сглобяване на гардероб', 'Преместване на мебели'],
    ['home_services-furniture-assembly', 'home_services', 'Furniture assembly', 'Монтаж на климатик'],
  ]) {
    assert.equal(matchesSubcategory({ name: valid, category }, id), true, valid)
    assert.equal(matchesSubcategory({ name: invalid, category }, id), false, invalid)
  }
  assert.equal(matchesSubcategory({ name: 'Подстригване на куче', category: 'hair' }, 'hair-children'), false)
  assert.equal(matchesSubcategory({ name: 'Индивидуална тренировка на куче', category: 'fitness' }, 'fitness-group-training'), false)
  assert.equal(matchesSubcategory({ name: 'Боядисване на детайл', category: 'auto_repair' }, 'hair-braids'), false)
})

test('new narrowing options are source-inventory filters, not mutations or broad fallback results', () => {
  const source = [
    { id: 'math', name: 'Урок по математика', category: 'education', price: { amount: 31, currency: 'EUR', kind: 'from', unit: '60 минути' }, description: 'Индивидуално; цена от31EUR.' },
    { id: 'english', name: 'Урок по английски език', category: 'education' },
  ]
  const rows = [{ id: 'school', name: 'Music School', services: source }]
  const before = JSON.stringify(rows)
  const narrowed = filterBusinessesBySubcategory(rows, 'education-mathematics')
  assert.deepEqual(narrowed[0].services, [source[0]])
  assert.equal(narrowed[0].services[0], source[0], 'literal price/conditions/service identity retained')
  assert.equal(JSON.stringify(rows), before)
  assert.deepEqual(filterBusinessesBySubcategory(rows, 'hair-braids'), [])
  assert.deepEqual(filterBusinessesBySubcategory(rows, 'not-a-real-option'), [])
  assert.deepEqual(subcategoryOptionsForBusinesses(rows, 'hair'), [], 'no empty public hair options are manufactured')
  assert.ok(subcategoryOptionsForBusinesses(rows, 'education').every(option => option.count > 0))
})

test('unsupported electrolysis is a future suggestion, not an empty public method or invented service', () => {
  assert.ok(audit.futureRecommendations.some(item => item.candidate === 'Електроепилация' && item.decision === 'not_added'))
  assert.equal(SUBCATEGORY_IDS.includes('beauty-electrolysis'), false)
  assert.equal(approved.flatMap(row => row.services).filter(service => service.category === 'beauty' && /електроепила|електролиз|electrolysis/iu.test(service.name)).length, 0)
})
