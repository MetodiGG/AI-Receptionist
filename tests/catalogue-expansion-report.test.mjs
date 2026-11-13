import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogueExpansionReport, reportBusinessType, reportLocationCoverage } from '../scripts/catalogue-expansion-report.mjs'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { NEIGHBORHOOD_20261111_RECORDS } from '../lib/discovery/catalogue-data/neighborhood-expansion-20261111.mjs'
import { readFile } from 'node:fs/promises'

test('report distinguishes real specialties without mutating underlying categories or inventing qualifications', () => {
  assert.equal(reportBusinessType({ name: 'Частна практика', category: 'other', services: [{ name: 'Психологична консултация' }] }), 'Психология и психотерапия')
  assert.equal(reportBusinessType({ name: 'Dental House', category: 'other', services: [{ name: 'Преглед' }] }), 'Стоматология')
  assert.equal(reportBusinessType({ name: 'Дентална практика', category: 'other', services: [{ name: 'Психологична подготовка за дентален преглед' }] }), 'Стоматология')
  assert.equal(reportBusinessType({ name: 'Студио', category: 'other', services: [{ name: 'Лична консултация' }] }), 'Друга услуга')
  assert.equal(reportBusinessType({ name: 'Nana', category: 'other', services: [{ name: 'Семейна фотосесия' }] }), 'Фотография')
  assert.equal(reportBusinessType({ name: 'Headshot Studio', category: 'other', services: [{ name: 'Бизнес портрети' }] }), 'Фотография')
  assert.equal(reportBusinessType({ name: 'Dental', category: 'other', services: [{ name: 'Дентална фотография' }] }), 'Стоматология')
  assert.equal(reportBusinessType({ name: 'Tattoo Studio Arty', category: 'other', services: [{ name: 'Пиърсинг хеликс' }] }), 'Татуировки и пиърсинг')
  assert.equal(reportBusinessType({ name: 'Sofia Dog Walks', category: 'other', services: [{ name: 'Индивидуално обучение на куче' }] }), 'Обучение на кучета')
  assert.equal(reportBusinessType({ name: 'Студио', category: 'other', services: [{ name: 'Лична консултация' }] }), 'Друга услуга', 'unknown types are not guessed from a generic studio')
})

test('expansion report counts unique new businesses separately from services, prices, mobile providers and excluded clinics', async () => {
  const baseline = JSON.parse(await readFile(new URL('../docs/catalogue-pricing/expansion-baseline-20261111.json', import.meta.url), 'utf8'))
  const report = catalogueExpansionReport(SOFIA_CATALOGUE, { baseline, now: Date.parse('2026-11-11T12:00:00Z') })
  assert.equal(report.comparison.addedBusinesses, NEIGHBORHOOD_20261111_RECORDS.length)
  assert.equal(report.comparison.addedPremises + report.comparison.addedMobileProviders, report.comparison.addedBusinesses)
  assert.equal(report.comparison.addedByNeighborhood.reduce((sum, row) => sum + row.businesses, 0), report.comparison.addedBusinesses)
  assert.equal(report.comparison.addedPremisesByNeighborhood.reduce((sum, row) => sum + row.businesses, 0), report.comparison.addedPremises)
  assert.equal(report.comparison.addedCitywideMobileProviders.length, report.comparison.addedMobileProviders)
  assert.equal(new Set(report.comparison.addedCitywideMobileProviders.map(row => row.id)).size, report.comparison.addedMobileProviders)
  assert.ok(report.comparison.addedCitywideMobileProviders.every(row =>
    SOFIA_CATALOGUE.find(record => record.id === row.id).locationKind === 'service_area'))
  assert.equal(Object.values(report.comparison.addedByBusinessType).reduce((sum, count) => sum + count, 0), report.comparison.addedBusinesses)
  assert.ok(report.comparison.addedCurrentPriceFacts >= report.comparison.addedBusinesses)
  assert.equal(report.comparison.additions.filter(row => row.currentPriceFacts === 0).length, 0)
  assert.ok(report.excludedGeneralClinics.length >= 13)
  assert.ok(report.comparison.additions.every(row => row.website && row.priceSources.length))
  assert.equal(SOFIA_CATALOGUE.find(row => row.id === 'sofia-dental-house-zdravka-asenova').category, 'other')
})

test('reporting groups explicit Manastirski east/west wording without changing sourced neighborhoods', () => {
  const seed = SOFIA_CATALOGUE.find(row => row.id === 'sofia-ginka-georgieva-healing-words')
  const rows = [
    { ...seed, id: 'sofia-report-east', coordinates: null, neighborhood: 'Манастирски ливади Изток' },
    { ...seed, id: 'sofia-report-west', coordinates: null, neighborhood: 'Манастирски ливади – Запад' },
  ]
  const report = catalogueExpansionReport(rows, { now: Date.parse('2026-11-11T12:00:00Z') })
  assert.equal(report.neighborhoods.length, 1)
  assert.equal(report.neighborhoods[0].neighborhood, 'Манастирски ливади')
  assert.equal(report.neighborhoods[0].businesses, 2)
  assert.equal(rows[0].neighborhood, 'Манастирски ливади Изток')
})

test('official points count as located separately from owner and OSM metadata, without adding businesses or weakening source binding', () => {
  const find = method => SOFIA_CATALOGUE.find(row => row.coordinates?.method === method && row.id !== 'sofia-in-beauty')
  const official = find('verified_official_address'), owner = find('first_party_coordinates'), osm = find('verified_address_geocode')
  const mobile = SOFIA_CATALOGUE.find(row => row.locationKind === 'service_area')
  const unknown = { ...official, id: 'sofia-report-unlocated', coordinates: null }
  const moved = { ...official, id: 'sofia-report-stale-point', neighborhood: official.neighborhood === 'Борово' ? 'Изгрев' : 'Борово' }
  const before = JSON.stringify([official, owner, osm, mobile, unknown, moved])
  assert.deepEqual(reportLocationCoverage([official, owner, osm, mobile, unknown, moved]), {
    located: 3, unlocatedPremises: 2, serviceAreaProviders: 1, heldCoordinates: 1,
    firstPartyPoints: 1, reviewedOsmAddressPoints: 1, officialSofiaAddressPoints: 1,
  })
  assert.equal(JSON.stringify([official, owner, osm, mobile, unknown, moved]), before)
  const current = catalogueExpansionReport(SOFIA_CATALOGUE, { now: Date.parse('2026-11-13T12:00:00Z') })
  assert.equal(current.locations.officialSofiaAddressPoints, 366)
  assert.equal(current.locations.firstPartyPoints + current.locations.reviewedOsmAddressPoints + current.locations.officialSofiaAddressPoints, current.locations.located)
  assert.equal(current.locations.located + current.locations.unlocatedPremises + current.locations.serviceAreaProviders, current.currentlyEligible)
})
