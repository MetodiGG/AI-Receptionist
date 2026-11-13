import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogueRecordSchema, approvedCatalogueRecord, validateCatalogue } from '../lib/discovery/catalogue-policy.mjs'
import { catalogueBoundCoordinates, applyCatalogueCoordinateBindings } from '../lib/discovery/catalogue-coordinate-binding.mjs'
import { normalizeCatalogueBusinesses } from '../lib/discovery/catalogue-search.mjs'
import { OFFICIAL_SOFIA_SOURCE_URL, OFFICIAL_SOFIA_ATTRIBUTION } from '../lib/discovery/official-sofia-address-source.mjs'

const now = Date.parse('2026-11-13T10:00:00Z')
const intent = { cityCode: '68134', browse: true, requirements: [] }
function fixture(patch = {}) {
  const row = { id: 'sofia-official-coordinate-fixture', name: 'Synthetic official address fixture', cityCode: '68134', neighborhood: 'Тестов квартал',
    address: 'София, ул. Примерна 2', locationKind: 'premises', category: 'barber', website: 'https://example.com/', phone: '+359888111222',
    booking: { kind: 'phone', phone: '+359888111222' }, services: [{ name: 'Мъжко подстригване', category: 'barber', appointmentModel: 'appointment' }],
    verification: { status: 'approved', checkedOn: '2026-11-13', validUntil: '2027-02-11', booking: { url: 'https://example.com/', excerpt: 'Synthetic fixture requires a phone appointment' }, contact: 'https://example.com/' } }
  return { ...row, coordinates: { latitude: 42.7, longitude: 23.3, method: 'verified_official_address', source: OFFICIAL_SOFIA_SOURCE_URL,
    sourceAddress: row.address, sourceCityCode: row.cityCode, sourceNeighborhood: row.neighborhood, sourceWebsite: row.website,
    checkedOn: '2026-11-13', licence: 'CC-BY-4.0', attribution: OFFICIAL_SOFIA_ATTRIBUTION, addressId: '12345' }, ...patch }
}

test('official address points require their exact municipal source, licence, attribution, date and rn metadata', () => {
  const row = fixture()
  assert.equal(catalogueRecordSchema.safeParse(row).success, true)
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.ok(approvedCatalogueRecord(row, now))
  for (const field of ['source', 'licence', 'attribution', 'checkedOn', 'addressId', 'sourceAddress', 'sourceCityCode', 'sourceNeighborhood', 'sourceWebsite']) {
    const coordinates = { ...row.coordinates }; delete coordinates[field]
    assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates }).success, false, field)
    assert.equal(catalogueBoundCoordinates({ ...row, coordinates }), null, field)
  }
  for (const patch of [{ source: `${OFFICIAL_SOFIA_SOURCE_URL}?unreviewed=1` }, { source: 'https://example.org/dataset' }, { licence: 'ODbL-1.0' },
    { attribution: '' }, { checkedOn: '2026-02-30' }, { checkedOn: '2026-11-13T10:00:00Z' }, { addressId: '0' }, { addressId: 12345 }, { addressId: '123/45' }]) {
    const changed = { ...row, coordinates: { ...row.coordinates, ...patch } }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, JSON.stringify(patch))
    assert.equal(catalogueBoundCoordinates(changed), null, JSON.stringify(patch))
  }
})

test('official point binding expires on any address/city/quarter/website edit at schema and final-reader boundaries', () => {
  const row = fixture()
  for (const patch of [{ address: 'София, ул. Примерна 3' }, { cityCode: '56784' }, { neighborhood: 'Друг квартал' }, { neighborhood: null }, { website: 'https://example.org/' }]) {
    const changed = { ...row, ...patch }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false, JSON.stringify(patch))
    assert.equal(catalogueBoundCoordinates(changed), null)
    assert.equal(approvedCatalogueRecord(changed, now), null)
    assert.deepEqual(normalizeCatalogueBusinesses([changed], intent, { now }), [])
    assert.equal(applyCatalogueCoordinateBindings([changed])[0].coordinates, null)
  }
  const nameOnly = { ...row, name: 'Renamed same physical venue' }
  assert.equal(catalogueRecordSchema.safeParse(nameOnly).success, true)
  assert.equal(catalogueBoundCoordinates(nameOnly), row.coordinates)
})

test('null neighborhoods are explicit valid bindings, not an omitted quarter wildcard', () => {
  const original = fixture(), row = { ...original, neighborhood: null, coordinates: { ...original.coordinates, sourceNeighborhood: null } }
  assert.equal(catalogueRecordSchema.safeParse(row).success, true)
  assert.equal(catalogueBoundCoordinates(row), row.coordinates)
  assert.equal(catalogueBoundCoordinates({ ...row, neighborhood: 'Нов квартал' }), null)
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: { ...row.coordinates, sourceNeighborhood: undefined } }).success, false)
})

test('binding metadata cannot make an invalid point, service area or the retired IN pin usable', () => {
  const row = fixture()
  for (const patch of [{ latitude: '42.7' }, { longitude: null }, { latitude: NaN }, { longitude: Infinity }, { latitude: 0 }, { longitude: 29 }]) {
    const changed = { ...row, coordinates: { ...row.coordinates, ...patch } }
    assert.equal(catalogueRecordSchema.safeParse(changed).success, false)
    assert.equal(catalogueBoundCoordinates(changed), null)
  }
  const serviceArea = { ...row, locationKind: 'service_area' }
  assert.equal(catalogueRecordSchema.safeParse(serviceArea).success, false)
  assert.equal(catalogueBoundCoordinates(serviceArea), null)
  const address = 'София, ул. Генерал Иван Колев 2'
  assert.equal(catalogueBoundCoordinates({ ...row, id: 'sofia-in-beauty', address, coordinates: { ...row.coordinates, latitude: 42.6852, longitude: 23.3245, sourceAddress: address } }), null)
})

test('approved official points expose only lat/lon with a separate municipal attribution, not internal review binding', () => {
  const row = fixture(), frozen = validateCatalogue([row])[0]
  assert.equal(catalogueBoundCoordinates(frozen), frozen.coordinates)
  const normalized = normalizeCatalogueBusinesses([frozen], intent, { now })[0]
  assert.deepEqual(normalized.coordinates, { latitude: 42.7, longitude: 23.3 })
  assert.deepEqual(normalized.coordinateAttribution, { label: OFFICIAL_SOFIA_ATTRIBUTION, url: OFFICIAL_SOFIA_SOURCE_URL })
  assert.doesNotMatch(JSON.stringify(normalized), /sourceAddress|sourceCityCode|sourceNeighborhood|sourceWebsite|addressId|verified_official_address/)
  assert.equal(normalizeCatalogueBusinesses([{ ...row, verification: { ...row.verification, status: 'draft' } }], intent, { now }).length, 0)
})

test('legacy OSM and owner coordinate provenance remain separate from the new official source method', () => {
  const row = fixture()
  const osm = { latitude: 42.7, longitude: 23.3, method: 'verified_address_geocode', source: 'https://www.openstreetmap.org/node/123', sourceAddress: row.address,
    checkedOn: '2026-11-13', licence: 'ODbL-1.0', attribution: '© OpenStreetMap contributors' }
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: osm }).success, true)
  assert.equal(catalogueBoundCoordinates({ ...row, coordinates: osm }), osm)
  assert.deepEqual(normalizeCatalogueBusinesses([{ ...row, coordinates: osm }], intent, { now })[0].coordinateAttribution, { label: '© OpenStreetMap contributors', url: 'https://www.openstreetmap.org/copyright' })
  const owner = { latitude: 42.7, longitude: 23.3, method: 'first_party_coordinates', source: row.website, sourceAddress: row.address }
  assert.equal(catalogueRecordSchema.safeParse({ ...row, coordinates: owner }).success, true)
  assert.equal(normalizeCatalogueBusinesses([{ ...row, coordinates: owner }], intent, { now })[0].coordinateAttribution, undefined)
})
