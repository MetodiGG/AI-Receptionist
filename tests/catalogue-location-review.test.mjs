import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { catalogueLocationReviewRequest, reviewCatalogueLocation, CATALOGUE_LOCATION_CLOSE_METERS } from '../lib/discovery/catalogue-location-review.mjs'

const checkedOn = '2026-11-13'
const sourceAddress = 'София, ул. Примерна 12А'
const row = patch => ({ id: 'sofia-synthetic-address-review', name: 'Synthetic Studio', cityCode: '68134', neighborhood: null, address: sourceAddress, locationKind: 'premises',
  coordinates: { latitude: 42.665, longitude: 23.282, method: 'first_party_coordinates', source: 'https://example.org/contact', sourceAddress }, ...patch })
const candidate = patch => ({ osm_type: 'way', osm_id: 12345, lat: '42.665', lon: '23.282', category: 'building', type: 'commercial', addresstype: 'building',
  address: { road: 'улица Примерна', house_number: '12A', city: 'София', country_code: 'bg' }, boundingbox: ['42.6649', '42.6651', '23.2819', '23.2821'], ...patch })
const address = patch => ({ ...candidate().address, ...patch })
const latitudeAt = meters => 42.665 + meters / 1000 / 6371 * 180 / Math.PI
const displacedCandidate = meters => {
  const latitude = latitudeAt(meters)
  return candidate({ lat: String(latitude), boundingbox: [latitude - .00001, latitude + .00001, 23.28199, 23.28201] })
}

test('located source rows get only an unlocated parsing projection; originals and source binding remain intact', () => {
  const record = row(), before = JSON.stringify(record)
  assert.deepEqual(catalogueLocationReviewRequest(record), { id: record.id, road: 'Примерна', house: '12А', query: 'ул. Примерна 12А, София, България', sourceAddress })
  const report = reviewCatalogueLocation(record, [candidate()], checkedOn)
  assert.equal(report.id, record.id)
  assert.equal(report.sourceAddress, sourceAddress)
  assert.equal(report.currentPointBinding.bound, true)
  assert.equal(report.currentPointBinding.kind, 'explicit_source_address')
  assert.equal(report.currentPointBinding.point.source, record.coordinates.source)
  assert.equal(report.status, 'close')
  assert.equal(report.separationMeters, 0)
  assert.equal(report.matched.kind, 'address_point')
  assert.equal(report.matched.sourceAddress, sourceAddress)
  assert.match(report.matched.semantics, /not_verified_business_or_entrance/)
  assert.equal(report.automaticReplacement, false)
  assert.equal(report.spatialAccuracyVerifiedByThisReview, false)
  assert.equal(JSON.stringify(record), before)
})

test('separation has a strict 75m comparison, never an automatic replacement decision', () => {
  assert.equal(CATALOGUE_LOCATION_CLOSE_METERS, 75)
  for (const [meters, status] of [[74.99, 'close'], [75.01, 'needs_review'], [300, 'needs_review']]) {
    const report = reviewCatalogueLocation(row(), [displacedCandidate(meters)], checkedOn)
    assert.ok(Math.abs(report.separationMeters - meters) < .00001)
    assert.equal(report.status, status)
    assert.equal(report.automaticReplacement, false)
    assert.equal(report.currentPointBinding.point.latitude, 42.665)
    assert.notEqual(report.currentPointBinding.point.latitude, report.matched.latitude)
  }
})

test('road, house suffix, city and country must match; number ranges and block-only venues remain unresolved', () => {
  for (const badAddress of [{ house_number: '12Б' }, { house_number: '12' }, { house_number: '12A-14' }, { road: 'Друга улица' }, { city: 'Пловдив' }, { city: '', suburb: 'София' }, { country_code: 'ro' }]) {
    assert.equal(reviewCatalogueLocation(row(), [candidate({ address: address(badAddress) })], checkedOn).status, 'unresolved')
  }
  const latinB = row({ address: 'София, ул. Примерна 12B', coordinates: null })
  assert.equal(reviewCatalogueLocation(latinB, [candidate({ address: address({ house_number: '12В' }) })], checkedOn).matched, null)
  for (const street of ['София, ул. Примерна 12–14', 'София, ул. Примерна 12/14', 'София, ул. Примерна 12А-14Б', 'София, Люлин 7, бл. 731Б', 'София, кв. Примерен', 'София, ул. Примерна без номер']) {
    const current = row({ address: street })
    assert.equal(catalogueLocationReviewRequest(current), null, street)
    assert.equal(reviewCatalogueLocation(current, [candidate()], checkedOn).status, 'unresolved', street)
  }
  assert.equal(catalogueLocationReviewRequest(row({ locationKind: 'service_area', address: sourceAddress })), null)
  assert.equal(catalogueLocationReviewRequest(row({ cityCode: '56784' })), null, 'the Sofia parser must not invent a different-city lookup')
})

test('the existing conservative road abbreviation variants are reused, not a fuzzy alternative-street search', () => {
  for (const [ownRoad, osmRoad] of [['Ген. Иван Колев', 'Генерал Иван Колев'], ['Проф. Иван Георгиев', 'Професор Иван Георгиев'], ['Акад. Иван Петров', 'Академик Иван Петров'], ['Д-р Иван Симеонов', 'Доктор Иван Симеонов']]) {
    const currentAddress = `София, ул. ${ownRoad} 12А`
    const current = row({ address: currentAddress, coordinates: { ...row().coordinates, sourceAddress: currentAddress } })
    assert.equal(reviewCatalogueLocation(current, [candidate({ address: address({ road: `улица ${osmRoad}` }) })], checkedOn).status, 'close', ownRoad)
    assert.equal(reviewCatalogueLocation(current, [candidate({ address: address({ road: `улица ${osmRoad} Друга` }) })], checkedOn).matched, null, ownRoad)
  }
})

test('no exact hit or multiple exact hits are held, including identical near-coincident candidates', () => {
  const missing = reviewCatalogueLocation(row(), [], checkedOn)
  assert.equal(missing.reason, 'no_exact_address_candidate')
  for (const hits of [[candidate(), candidate({ osm_type: 'node', osm_id: 54321 })], [candidate(), displacedCandidate(200)]]) {
    const report = reviewCatalogueLocation(row(), hits, checkedOn)
    assert.equal(report.status, 'unresolved')
    assert.equal(report.reason, 'multiple_exact_address_candidates')
    assert.equal(report.exactCandidateCount, 2)
    assert.equal(report.matched, null)
  }
  const oneExact = reviewCatalogueLocation(row(), [candidate(), candidate({ address: address({ house_number: '13' }) })], checkedOn)
  assert.equal(oneExact.rawCandidateCount, 2)
  assert.equal(oneExact.exactCandidateCount, 1)
  assert.equal(oneExact.status, 'close')
})

test('a same-address shop is not the venue; an address/building node is not an entrance claim', () => {
  for (const patch of [{ name: 'Different supermarket' }, { name: '' }, { name: 'Synthetic Studio Supermarket' }]) {
    const report = reviewCatalogueLocation(row(), [candidate({ category: 'shop', type: 'supermarket', addresstype: 'shop', ...patch })], checkedOn)
    assert.equal(report.status, 'unresolved')
    assert.equal(report.reason, 'unrelated_or_unnamed_poi_at_same_address')
    assert.equal(report.matched, null)
  }
  const named = reviewCatalogueLocation(row(), [candidate({ category: 'shop', type: 'beauty', addresstype: 'shop', name: 'SYNTHETIC · STUDIO' })], checkedOn)
  assert.equal(named.matched.kind, 'exact_named_business_point')
  assert.match(named.matched.semantics, /not_verified_entrance/)
  const house = reviewCatalogueLocation(row(), [candidate({ osm_type: 'node', category: 'place', type: 'house', addresstype: 'house' })], checkedOn)
  assert.equal(house.status, 'close')
  assert.equal(house.matched.kind, 'address_point')
  assert.match(house.matched.semantics, /not_verified_business_or_entrance/)
})

test('centroids, invalid or inverted boxes, points outside their box and invalid OSM IDs cannot be accepted', () => {
  for (const patch of [{ addresstype: 'road' }, { addresstype: 'suburb' }, { addresstype: 'city' }, { boundingbox: ['42.6', '42.8', '23.2', '23.4'] }, { boundingbox: ['42.6651', '42.6649', '23.2819', '23.2821'] }, { boundingbox: ['42.6649', '42.6651', '23.2821', '23.2819'] }, { lat: '42.666' }, { lat: 0, lon: 0 }, { lat: 'NaN' }, { boundingbox: ['', '', '', ''] }, { osm_id: 0 }, { osm_id: '../123' }, { osm_type: 'search' }]) {
    const report = reviewCatalogueLocation(row(), [candidate(patch)], checkedOn)
    assert.equal(report.status, 'unresolved', JSON.stringify(patch))
    assert.equal(report.matched, null, JSON.stringify(patch))
  }
})

test('missing, stale-address and unknown current bindings stay unresolved even with a separately matched address point', () => {
  for (const current of [row({ coordinates: null }), row({ coordinates: { ...row().coordinates, sourceAddress: 'София, ул. Друг адрес 1' } }), row({ coordinates: { ...row().coordinates, sourceAddress: undefined } })]) {
    const report = reviewCatalogueLocation(current, [candidate()], checkedOn)
    assert.equal(report.status, 'unresolved')
    assert.equal(report.currentPointBinding.bound, false)
    assert.ok(report.matched)
    assert.equal(report.automaticReplacement, false)
  }
})

test('only explicit valid review dates are accepted; the helper has no transport, persistence or side-effect surface', async () => {
  for (const date of [undefined, '', '2026-11-32', '2026-02-30', '13-11-2026']) assert.throws(() => reviewCatalogueLocation(row(), [candidate()], date))
  const source = await readFile(new URL('../lib/discovery/catalogue-location-review.mjs', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /fetch\s*\(|process\.env|writeFile|appendFile|supabase|localStorage|navigator|google\.com|https?\.request/)
  assert.match(source, /catalogueStreetAddress/)
  assert.match(source, /matchCatalogueGeocode/)
})

test('joined street houses and the explicitly named bare ring road keep the original source address and cache query', () => {
  for (const [original, road, house] of [
    ['София, ул.Казбек59', 'Казбек', '59'],
    ['София, кв. Манастирски ливади, ул. Казбек59А, салон Synthetic', 'Казбек', '59А'],
    ['София, Околовръстен път 110', 'Околовръстен път', '110'],
    ['София, Околовръстенпът110', 'Околовръстен път', '110'],
  ]) {
    const current = row({ address: original, coordinates: { ...row().coordinates, sourceAddress: original } })
    const request = catalogueLocationReviewRequest(current)
    assert.equal(request.sourceAddress, original)
    assert.equal(request.query, original + ', България', 'offline reclassification must reuse the former literal lookup key')
    const hit = candidate({ address: address({ road, house_number: house }) })
    const report = reviewCatalogueLocation(current, [hit], checkedOn)
    assert.equal(report.status, 'close', original)
    assert.equal(report.matched.sourceAddress, original)
    assert.equal(report.matched.addressEvidence, 'exact_street_and_house')
    assert.equal(reviewCatalogueLocation(current, [candidate({ address: address({ road, house_number: '111' }) })], checkedOn).matched, null)
  }
  assert.equal(catalogueLocationReviewRequest(row({ address: 'София, Околовръстен път 110–112' })), null)
  assert.equal(catalogueLocationReviewRequest(row({ address: 'София, ул.Казбек59–61' })), null)
})

test('only native rows can parse a bare street after exact separately published Sofia and quarter segments', () => {
  const original = 'София, Манастирски ливади, Пирин42'
  const current = row({ source: 'gorez', neighborhood: 'Манастирски ливади', address: original, coordinates: { ...row().coordinates, sourceAddress: original } })
  const request = catalogueLocationReviewRequest(current)
  assert.equal(request.road, 'Пирин')
  assert.equal(request.house, '42')
  assert.equal(request.query, original + ', България')
  const report = reviewCatalogueLocation(current, [candidate({ address: address({ road: 'улица Пирин', house_number: '42' }) })], checkedOn)
  assert.equal(report.status, 'close')
  assert.equal(report.sourceAddress, original)
  assert.equal(report.matched.sourceAddress, original)
  for (const patch of [{ source: 'catalogue' }, { neighborhood: null }, { neighborhood: 'Борово' }, { address: 'Пловдив, Манастирски ливади, Пирин42' }, { address: 'София, Манастирски ливади, Пирин42–44' }, { address: 'София, Манастирски ливади, М1-30' }, { address: 'София, Манастирски ливади, офис30' }]) {
    assert.equal(catalogueLocationReviewRequest({ ...current, ...patch }), null, JSON.stringify(patch))
  }
})

test('a public block number needs an exact candidate number and exact quarter, never a nearby block or office number', () => {
  const original = 'София, кв. Левски Г, ул. Могилите, бл. 2Б, М1-30'
  const current = row({ neighborhood: 'Левски Г', address: original, coordinates: { ...row().coordinates, sourceAddress: original } })
  const request = catalogueLocationReviewRequest(current)
  assert.equal(request.kind, 'block_quarter')
  assert.equal(request.block, '2Б')
  assert.equal(request.quarter, 'Левски Г')
  assert.equal(request.query, original + ', България')
  const blockHit = candidate({ address: address({ road: 'улица Могилите', house_number: '2Б', quarter: 'ж.к. Левски Г' }) })
  const report = reviewCatalogueLocation(current, [blockHit], checkedOn)
  assert.equal(report.status, 'close')
  assert.equal(report.matched.addressEvidence, 'exact_block_number_and_quarter')
  assert.equal(report.matched.sourceAddress, original)
  assert.match(report.matched.semantics, /not_verified_business_or_entrance/)
  for (const change of [{ house_number: '2В' }, { house_number: '2B' }, { house_number: '30' }, { house_number: '1-30' }, { house_number: '2' }, { house_number: '2Б-4' }, { quarter: 'Левски В' }, { quarter: '', suburb: 'Левски' }, { quarter: null }, { city: 'Пловдив' }]) {
    assert.equal(reviewCatalogueLocation(current, [{ ...blockHit, address: { ...blockHit.address, ...change } }], checkedOn).matched, null, JSON.stringify(change))
  }
  for (const originalAddress of ['София, кв. Левски Г, бл. 2–4, М1-30', 'София, кв. Левски Г, М1-30']) {
    assert.equal(catalogueLocationReviewRequest({ ...current, address: originalAddress }), null)
  }
  assert.equal(reviewCatalogueLocation(current, [blockHit, { ...blockHit, osm_id: 99999 }], checkedOn).reason, 'multiple_exact_address_candidates')
  assert.equal(reviewCatalogueLocation(current, [{ ...blockHit, category: 'shop', type: 'supermarket', addresstype: 'shop', name: 'Different shop' }], checkedOn).matched, null)
})

test('a source block suffix A may match Latin A, but a house number from an office range never substitutes', () => {
  const original = 'София, жк. Люлин 10, бл. 153 А'
  const current = row({ neighborhood: 'Люлин 10', address: original, coordinates: { ...row().coordinates, sourceAddress: original } })
  const hit = candidate({ address: address({ road: undefined, house_number: '153A', suburb: 'Люлин 10' }) })
  assert.equal(reviewCatalogueLocation(current, [hit], checkedOn).status, 'close')
  assert.equal(reviewCatalogueLocation(current, [{ ...hit, address: { ...hit.address, house_number: '153B' } }], checkedOn).matched, null)
  const streetAndOffice = 'София, ул. Примерна 12А, офис М1-30'
  const streetRow = row({ address: streetAndOffice, coordinates: { ...row().coordinates, sourceAddress: streetAndOffice } })
  const report = reviewCatalogueLocation(streetRow, [candidate()], checkedOn)
  assert.equal(report.status, 'close')
  assert.equal(report.request.house, '12А')
  assert.equal(report.request.query, streetAndOffice + ', България')
  assert.equal(report.matched.sourceAddress, streetAndOffice)
})
