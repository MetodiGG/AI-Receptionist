import test from 'node:test'
import assert from 'node:assert/strict'
import { readOfficialSofiaCsv } from '../scripts/read-official-sofia-csv.mjs'
import { indexOfficialSofiaAddresses, matchOfficialSofiaAddress } from '../lib/discovery/official-sofia-address.mjs'
import { verifyOfficialCsvSubset } from '../scripts/verify-official-sofia-address-subset.mjs'

const header = 'rn;region;settlement;lareaunit;block;street;streetnum;entrance;n;e\n'
const line = '113534;Триадица;гр. София;Кръстова вада;"";ул. Генерал Иван Колев;2;"";42.65;23.32'

test('municipal CSV preserves exact string identifiers and maps e/n to longitude/latitude', () => {
  const collection = readOfficialSofiaCsv('\uFEFF' + header + line + '\n')
  const p = collection.features[0]
  assert.equal(p.properties.rn, '113534')
  assert.equal(p.properties.streetnum, '2')
  assert.equal(p.properties.block, '')
  assert.deepEqual(p.geometry.coordinates, [23.32, 42.65])
  const index = indexOfficialSofiaAddresses(collection)
  const result = matchOfficialSofiaAddress(index, { id: 'test', cityCode: '68134', locationKind: 'premises', address: 'София, ул. Генерал Иван Колев 2' })
  assert.equal(result.status, 'unique')
  assert.equal(result.unique.rn, '113534')
  assert.equal(result.automaticReplacement, false)
})

test('municipal CSV supports CRLF, escaped quotes and quoted separators without evaluating fields', () => {
  const source = header.replace('\n', '\r\n') + line.replace('ул. Генерал Иван Колев', '"ул. ""Иван""; Колев"') + '\r\n'
  assert.equal(readOfficialSofiaCsv(source).features[0].properties.street, 'ул. "Иван"; Колев')
  assert.equal(readOfficialSofiaCsv(header + line.replace('Кръстова вада', '=DO_NOT_EVALUATE()')).features[0].properties.lareaunit, '=DO_NOT_EVALUATE()')
})

test('municipal CSV rejects malformed headers, coordinates, duplicates and truncated rows', () => {
  for (const source of [header.replace(';n;e', ';e;n') + line, header + line + '\n' + line,
    header + line.replace('42.65', ''), header + line.replace('42.65', '42,65'), header + line.replace('42.65', '23.32').replace(/23\.32$/u, '42.65'),
    header + line + ';extra', header + line + '\n\n', header + line.replace('Триадица', '"Триадица'), header + line.replace('Триадица', '"Триадица"x')]) {
    assert.throws(() => readOfficialSofiaCsv(source))
  }
})

test('different municipal rn rows remain ambiguous even when their coordinates are identical', () => {
  const index = indexOfficialSofiaAddresses(readOfficialSofiaCsv(header + line + '\n' + line.replace('113534;', '113535;')))
  const result = matchOfficialSofiaAddress(index, { id: 'test', cityCode: '68134', locationKind: 'premises', address: 'София, ул. Генерал Иван Колев 2' })
  assert.equal(result.status, 'ambiguous')
  assert.equal(result.candidates.length, 2)
  assert.equal(result.unique, null)
})

test('missing source settlement stays missing and is not inferred to be Sofia', () => {
  const collection = readOfficialSofiaCsv(header + line.replace('гр. София;', ';'))
  assert.equal(collection.features[0].properties.settlement, '')
  const index = indexOfficialSofiaAddresses(collection)
  assert.equal(index.counts.sofia, 0)
  assert.equal(index.counts.otherSettlement, 1)
})

test('a relative landmark is never matched as the business own street or residential block', () => {
  const collection = readOfficialSofiaCsv(header + '1;Младост;гр. София;ж.к. Младост 3;353;"";"";"";42.65;23.38')
  const index = indexOfficialSofiaAddresses(collection)
  const result = matchOfficialSofiaAddress(index, { id: 'test', cityCode: '68134', neighborhood: 'Младост 3', locationKind: 'premises', address: 'София, Младост 3, срещу блок 353' })
  assert.equal(result.status, 'unresolved')
  assert.equal(result.request, null)
  assert.equal(result.unique, null)
})

test('offline municipal CSV verifier rejects an unrelated or changed source before matching', () => {
  assert.throws(() => verifyOfficialCsvSubset(Buffer.from(header + line)), /hash mismatch/)
})
