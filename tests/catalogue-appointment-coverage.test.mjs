import test from 'node:test'
import assert from 'node:assert/strict'
import { DateTime } from 'luxon'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import batch8 from '../lib/discovery/catalogue-data/coverage-expansion-v8.mjs'
import batch9 from '../lib/discovery/catalogue-data/coverage-expansion-v9.mjs'
import batch10 from '../lib/discovery/catalogue-data/coverage-expansion-v10.mjs'
import { auditCatalogueBatch } from '../lib/discovery/catalogue-audit.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { discoverBusinesses } from '../lib/discovery/search.mjs'
import { discoveryConfig } from '../lib/discovery/config.mjs'
import { approvedCatalogueRecord, EXCLUDED_GENERAL_CLINIC_IDS } from '../lib/discovery/catalogue-policy.mjs'
const now = DateTime.fromISO('2026-11-06T12:00:00Z')
const forbidden = () => assert.fail('Catalogue appointment coverage must not call a provider or create an appointment')
const dependencies = rows => ({ now, config: discoveryConfig({ DISCOVERY_ENABLED: 'true' }), readInternal: async () => [], readCatalogue: async () => rows,
  fetcher: forbidden, claimBudget: forbidden, getSlots: forbidden, getBusiness: forbidden })

test('the latest 41 actual premises have source links without duplicate staff, cities or departments', () => {
  const rows = [...batch8, ...batch9, ...batch10], report = auditCatalogueBatch([], rows, now.toMillis())
  assert.equal(rows.length, 41)
  assert.equal(report.readyForReview.length, rows.filter(row => approvedCatalogueRecord(row, now.toMillis())).length)
  assert.deepEqual(report.rejected, [])
  assert.deepEqual(report.pending.map(row => row.id).sort(), rows.filter(row => EXCLUDED_GENERAL_CLINIC_IDS.includes(row.id)).map(row => row.id).sort())
  for (const row of rows) {
    assert.equal(row.cityCode, '68134')
    assert.equal(row.coordinates, null, 'an owner street address is not automatically a precise point')
    assert.ok(SOFIA_CATALOGUE.some(current => current.id === row.id))
    assert.equal(row.photo, undefined)
  }
})

test('veterinary queries stay veterinary; a sourced grooming menu is separate from a human dentist', async () => {
  const rows = SOFIA_CATALOGUE.filter(row => batch8.some(item => item.id === row.id))
  for (const query of ['ветеринар', 'ветеринарен преглед', 'vet clinic', 'veterinary clinic']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, dependencies(rows))
    assert.equal(result.intent.category, 'other')
    assert.equal(result.results.length, 6, query)
    // A reviewed veterinary menu also has contextual labels such as EKG,
    // named-practitioner consultations and imaging, not the word veterinary
    // repeated in every title. Keep only services from these vetted clinics
    // and never leak their separately filed grooming into a veterinary query.
    assert.ok(result.results.every(row => row.services.every(service =>
      rows.find(source => source.id === row.id)?.services.some(source =>
        source.name === service.name && source.category === 'other'))), query)
  }
  const vets = rows.filter(row => row.services.some(service => /ветеринар/iu.test(service.name)))
  // City now has an individually reviewed owner grooming tariff. That is
  // real service evidence, not a reason to widen every veterinary listing.
  const groomingIntent = { category: 'pets', service: 'груминг', searchV2: true, cityCode: '68134', requirements: [] }
  const grooming = normalizeCatalogueBusinesses(vets, groomingIntent, { now: now.toMillis() })
  assert.deepEqual(grooming.map(row => row.id), ['sofia-vet-city-nishava'])
  assert.ok(grooming.every(row => row.services.every(service => vets.find(source => source.id === row.id).services.find(source => source.name === service.name)?.category === 'pets')))
  assert.deepEqual(normalizeCatalogueBusinesses(vets.filter(row => !row.services.some(service => service.category === 'pets')), groomingIntent, { now: now.toMillis() }), [])
  assert.deepEqual(normalizeCatalogueBusinesses(vets, { category: 'other', service: 'зъболекар', searchV2: true, cityCode: '68134', requirements: [] }, { now: now.toMillis() }), [])
})

test('psychiatry vocabulary finds three actual offices, not a record per staff member', async () => {
  const rows = SOFIA_CATALOGUE.filter(row => row.id.startsWith('sofia-detsko-psihichno-zdrave-'))
  for (const query of ['психиатър', 'psychiatrist']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, dependencies(rows))
    assert.equal(result.intent.category, 'other')
    assert.equal(result.results.length, 3)
    assert.ok(result.results.every(row => row.services.some(service => /психиатър/iu.test(service.name))))
  }
})

test('tattoo queries find real reserved tattoo sessions rather than every Other business', async () => {
  const rows = SOFIA_CATALOGUE.filter(row => batch10.some(item => item.id === row.id))
  for (const query of ['татуировка', 'tattoo']) {
    const result = await discoverBusinesses({ query, cityCode: '68134' }, dependencies(rows))
    assert.equal(result.intent.category, 'other')
    assert.equal(result.results.length, 2)
    assert.ok(result.results.every(row => row.services.every(service => /татуиров/iu.test(service.name))))
  }
})

test('trial lessons stay actual bookable venues, not unannounced sites or a fabricated price', async () => {
  assert.equal(batch9.length, 7)
  assert.equal(batch9.filter(row => row.website.includes('algorithmics')).length, 2)
  assert.equal(batch9.filter(row => row.website.includes('amakids')).length, 5)
  assert.ok(batch9.every(row => row.category === 'education' && row.services.every(service => service.price == null && /пробен урок/iu.test(service.name))))
  const result = await discoverBusinesses({ query: 'Algorithmics Питагор', cityCode: '68134' }, dependencies(SOFIA_CATALOGUE))
  assert.equal(result.results.length, 1)
  assert.equal(result.results[0].id, 'sofia-algorithmics-pitagor')
})
