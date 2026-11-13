import test from 'node:test'
import assert from 'node:assert/strict'
import { indexOfficialSofiaAddresses, matchOfficialSofiaAddress, normalizeOfficialSofiaRoad, officialSofiaAddressRequest } from '../lib/discovery/official-sofia-address.mjs'

const feature = (rn, patch = {}, pair = [23.3, 42.7]) => ({ type: 'Feature', properties: { rn, region: 'Тестов район', settlement: 'гр. София', lareaunit: '', block: '', street: 'ул. Примерна', streetnum: '2', entrance: '', ...patch }, geometry: { type: 'Point', coordinates: pair } })
const index = (...features) => indexOfficialSofiaAddresses({ type: 'FeatureCollection', features })
const venue = (address, patch = {}) => ({ id: 'synthetic-offline-address', cityCode: '68134', locationKind: 'premises', address, ...patch })

test('official roads normalize type abbreviations, quotes, punctuation and honorifics without deleting identity words', () => {
  assert.equal(normalizeOfficialSofiaRoad('УЛ.„Ген.Иван Колев“'), normalizeOfficialSofiaRoad('улица Генерал Иван Колев'))
  assert.equal(normalizeOfficialSofiaRoad('ул. Проф. Д-р Иван Тестов'), normalizeOfficialSofiaRoad('улица професор доктор Иван Тестов'))
  assert.equal(normalizeOfficialSofiaRoad('бул. Св. Св. Кирил и Методий'), normalizeOfficialSofiaRoad('булевард Свети Свети Кирил и Методий'))
  assert.notEqual(normalizeOfficialSofiaRoad('ул. Ген. Иван Колев'), normalizeOfficialSofiaRoad('ул. Иван Колев'))
  assert.notEqual(normalizeOfficialSofiaRoad('ул. Пирин'), normalizeOfficialSofiaRoad('ул. Пирински проход'))
  assert.notEqual(normalizeOfficialSofiaRoad('ул. България'), normalizeOfficialSofiaRoad('бул. България'))
  assert.equal(normalizeOfficialSofiaRoad('улов Примерна'), null)
})

test('index uses exact Sofia settlement, validated WGS84 Point and unique rn; never load or fetch a source itself', () => {
  const collection = { type: 'FeatureCollection', features: [feature('1'), feature('2', { settlement: 'гр. Банкя' }), feature('3', { settlement: '' })] }
  const snapshot = JSON.stringify(collection), built = indexOfficialSofiaAddresses(collection)
  assert.deepEqual(built.counts, { total: 3, sofia: 1, otherSettlement: 2, streetIndexed: 1, blockIndexed: 0 })
  assert.equal(JSON.stringify(collection), snapshot)
  for (const broken of [feature('4', {}, [42.7, 23.3]), feature('5', {}, ['23.3', 42.7]), { ...feature('6'), geometry: { type: 'Polygon', coordinates: [] } }]) assert.throws(() => index(broken), TypeError)
  assert.throws(() => index(feature('7'), feature('7', { streetnum: '3' })), TypeError)
  assert.throws(() => indexOfficialSofiaAddresses({ ...collection, crs: { name: 'projected' } }), TypeError)
})

test('unique exact street/house returns an address reference only, never an approved replacement or invented entrance', () => {
  const built = index(feature('10', { street: 'ул. Ген. Иван Колев' }))
  const row = venue('София, ул. Генерал Иван Колев 2'), snapshot = JSON.stringify(row)
  const match = matchOfficialSofiaAddress(built, row)
  assert.equal(match.status, 'unique'); assert.equal(match.unique.rn, '10')
  assert.equal(match.request.roadKey, 'улица|генерал иван колев')
  assert.equal(match.candidates.length, 1); assert.equal(match.unique.entrance, '')
  assert.equal(match.automaticReplacement, false); assert.equal(match.corroboration, 'not_compared')
  assert.equal(match.separationMeters, null); assert.equal(match.coordinates, undefined)
  assert.equal(JSON.stringify(row), snapshot)
})

test('public IN Beauty municipal mini-fixture stays ambiguous despite identical address fields and a closer current point', () => {
  const built = index(feature('113534', { region: 'Триадица', street: 'ул. Ген. Иван Колев' }, [23.31449726584672, 42.65564914279809]), feature('3883', { region: 'Триадица', street: 'ул. Ген. Иван Колев' }, [23.314359530469893, 42.65462108559693]))
  const match = matchOfficialSofiaAddress(built, venue('София, ул. Генерал Иван Колев 2', { coordinates: { latitude: 42.65564914279809, longitude: 23.31449726584672 } }))
  assert.equal(match.status, 'ambiguous'); assert.equal(match.unique, null)
  assert.deepEqual(match.candidates.map(candidate => candidate.rn), ['113534', '3883'])
  assert.equal(match.separationMeters, null); assert.equal(match.corroboration, 'not_compared')
})

test('even coincident duplicate addresses remain ambiguous; reversed input never chooses a different winner', () => {
  const rows = [feature('21'), feature('22')]
  for (const features of [rows, [...rows].reverse()]) {
    const match = matchOfficialSofiaAddress(index(...features), venue('ул. Примерна 2', { coordinates: { latitude: 42.7, longitude: 23.3 } }))
    assert.equal(match.status, 'ambiguous'); assert.equal(match.unique, null); assert.equal(match.candidates.length, 2)
  }
})

test('full exact road and house suffix are mandatory; ranges and partial roads never borrow a nearby address', () => {
  const built = index(feature('30', { street: 'ул. Пирин', streetnum: '81', entrance: 'А' }), feature('31', { street: 'ул. Пирински проход', streetnum: '83' }), feature('32', { street: 'ул. Пирин', streetnum: '83А' }))
  for (const address of ['ул. Пирин 83', 'ул. Пирин 8', 'ул. Пирински 83', 'ул. Пирин 81-83', 'ул. Пирин 81/83', 'ул. Пирин 81 – 83', 'ул. Пирин']) {
    const match = matchOfficialSofiaAddress(built, venue(address))
    assert.equal(match.unique, null, address); assert.equal(match.candidates.length, 0, address)
  }
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. „Пирин“ 83 а')).unique.rn, '32')
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Пирин 83A')).unique.rn, '32')
})

test('Latin B/C suffixes never become visually similar Cyrillic letters', () => {
  const built = index(feature('40', { streetnum: '2В' }), feature('41', { streetnum: '2С' }))
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2B')).unique, null)
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2C')).unique, null)
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2В')).unique.rn, '40')
})

test('explicit entrance is exact and cannot fall back to a blank or other entrance', () => {
  const built = index(feature('50', { entrance: 'А' }), feature('51', { entrance: 'Б' }), feature('52'))
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2')).status, 'ambiguous')
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2, вход А')).unique.rn, '50')
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2, вх.A')).unique.rn, '50')
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2, вход: А')).unique.rn, '50')
  assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2, вх. В')).unique, null)
  for (const address of ['ул. Примерна 2, вх.', 'ул. Примерна 2, вх', 'ул. Примерна 2, вх. А, вх. Б', 'ул. Примерна 2, вх. А-Б']) assert.equal(officialSofiaAddressRequest(venue(address)), null)
})

test('block matching requires the full explicit known quarter and entrance, never a bare number or guessed quarter alias', () => {
  const built = index(feature('60', { street: '', streetnum: '', lareaunit: 'ж.к. Примерен квартал', block: '96', entrance: 'Г' }), feature('61', { street: '', streetnum: '', lareaunit: 'ж.к. Друг квартал', block: '96', entrance: 'Г' }))
  const row = venue('София, ж.к. Примерен квартал, бл. 96, вх. Г', { neighborhood: 'Примерен квартал' })
  assert.equal(matchOfficialSofiaAddress(built, row).unique.rn, '60')
  for (const patch of [{ address: 'София, бл.96, вх.Г' }, { neighborhood: null }, { neighborhood: 'Друг квартал' }, { address: 'София, ж.к. Примерен квартал, бл.96-98, вх.Г' }]) assert.equal(matchOfficialSofiaAddress(built, { ...row, ...patch }).unique, null)
})

test('bare native roads require separately known city and matching explicit quarter; do not invent a house number', () => {
  const built = index(feature('70', { street: 'ул. Пирин', streetnum: '42' }))
  const native = venue('София, Манастирски ливади, Пирин 42', { source: 'gorez', neighborhood: 'Манастирски ливади' })
  assert.equal(matchOfficialSofiaAddress(built, native).unique.rn, '70')
  for (const patch of [{ source: 'catalogue' }, { neighborhood: null }, { neighborhood: 'Борово' }, { cityCode: '56784' }, { address: 'София, Манастирски ливади, Пирин' }, { address: 'Пирин 42' }, { address: 'София, Манастирски ливади, Пирин 40-42' }]) assert.equal(matchOfficialSofiaAddress(built, { ...native, ...patch }).unique, null)
  assert.equal(matchOfficialSofiaAddress(index(feature('71', { street: 'ул. Пирин', streetnum: '42' }), feature('72', { street: 'бул. Пирин', streetnum: '42' })), native).status, 'ambiguous')
})

test('non-Sofia and service-area requests fail closed even if a street exists in the index', () => {
  const built = index(feature('80'))
  for (const patch of [{ cityCode: '56784' }, { city_ekatte: '56784' }, { cityCode: undefined, city: 'Пловдив' }, { city: 'Пловдив' }, { locationKind: 'service_area' }, { address: 'гр. Пловдив, ул. Примерна 2' }, { address: 'Пловдив, ул. Примерна 2' }]) assert.equal(matchOfficialSofiaAddress(built, venue('ул. Примерна 2', patch)).unique, null)
})

test('a trailing unlabelled foreign locality is not silently dropped; ordinary building and floor suffixes remain parseable', () => {
  const built = index(feature('85'))
  for (const address of ['ул. Примерна 2, Пловдив', 'София, ул. Примерна 2, Пловдив', 'ул. Примерна 2, Plovdiv']) assert.equal(matchOfficialSofiaAddress(built, venue(address)).unique, null)
  for (const address of ['ул. Примерна 2, Trade House West, ет. 1', 'София, ул. Примерна 2, вх. А, офис 15', 'ул. Примерна 2, партер', 'ул. Примерна 2, София', 'София, ул. Примерна 2, НСА', 'София, ул. Примерна 2, ет. 4, БИНАП']) {
    const request = officialSofiaAddressRequest(venue(address))
    assert.ok(request, address)
    assert.equal(request.house, '2')
  }
})

test('old-point corroboration is separate, bounded at75m, and never resolves an ambiguous postal key', () => {
  const built = index(feature('90'))
  const close = matchOfficialSofiaAddress(built, venue('ул. Примерна 2', { coordinates: { latitude: 42.7, longitude: 23.3 } }))
  assert.equal(close.separationMeters, 0); assert.equal(close.corroboration, 'within_75m')
  const far = matchOfficialSofiaAddress(built, venue('ул. Примерна 2', { coordinates: { latitude: 42.71, longitude: 23.3 } }))
  assert.ok(far.separationMeters > 1000); assert.equal(far.corroboration, 'more_than_75m'); assert.equal(far.status, 'unique')
  const invalid = matchOfficialSofiaAddress(built, venue('ул. Примерна 2', { coordinates: { latitude: '42.7', longitude: 23.3 } }))
  assert.equal(invalid.separationMeters, null); assert.equal(invalid.corroboration, 'not_compared')
})

test('public Touch Pirin42 municipal mini-fixture corroborates its old business point within1m without borrowing Pirinski prohod42', () => {
  const built = index(feature('11818', { street: 'ул. Пирин', streetnum: '42' }, [23.282531212067777, 42.665030942360524]), feature('100', { street: 'ул. Пирински проход', streetnum: '42' }))
  const result = matchOfficialSofiaAddress(built, venue('София, Манастирски ливади, Пирин 42', { source: 'gorez', neighborhood: 'Манастирски ливади', coordinates: { latitude: 42.6650291, longitude: 23.2825296 } }))
  assert.equal(result.unique.rn, '11818'); assert.equal(result.candidates.length, 1)
  assert.ok(result.separationMeters > 0 && result.separationMeters < 1)
})
