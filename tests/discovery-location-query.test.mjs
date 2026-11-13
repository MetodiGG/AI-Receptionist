import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DateTime } from 'luxon'
import { BULGARIAN_CITIES, NEIGHBOURHOODS, transliterate } from '../lib/business-location.mjs'
import { normalizeSearchText } from '../lib/discovery/categories.mjs'
import { discoveryCitiesInQuery, neighborhoodChoices, neighborhoodIn, boundaryMatch } from '../lib/discovery/location-query.mjs'
import * as server from '../lib/discovery/intent.mjs'

test('existing server imports are the same pure helper functions, not a second location algorithm', () => {
  assert.equal(server.discoveryCitiesInQuery, discoveryCitiesInQuery)
  assert.equal(server.neighborhoodChoices, neighborhoodChoices)
})

test('all registered Bulgarian and English city names preserve boundary and longest-name matching', () => {
  for (const city of BULGARIAN_CITIES) for (const name of [city.name, city.nameEn]) {
    const matches = discoveryCitiesInQuery(`Маникюр (${name}) утре`)
    const sameName = BULGARIAN_CITIES.filter(other => normalizeSearchText(other.name) === normalizeSearchText(city.name) && [other.name, other.nameEn].some(value => normalizeSearchText(value) === normalizeSearchText(name)))
    // Preserve the pre-existing conservative handling of same-named cities:
    // the explicit city-code selector resolves these, not a guessed code.
    assert.equal(matches.some(match => match.code === city.code), sameName.length === 1, `${city.code} · ${name}`)
    assert.equal(discoveryCitiesInQuery(`prefix${name}suffix`).some(match => match.code === city.code), false, `boundaries · ${name}`)
  }
  assert.deepEqual(discoveryCitiesInQuery('маникюр в София и Пловдив').map(row => row.code).sort(), ['56784', '68134'])
  assert.deepEqual(discoveryCitiesInQuery('SOFIA manicure').map(row => row.code), ['68134'])
  assert.deepEqual(discoveryCitiesInQuery('Без избран град'), [])
})

test('all real quarters retain deduplication, numbered-district grouping and transliterated matching', () => {
  for (const [code, names] of Object.entries(NEIGHBOURHOODS)) {
    const choices = neighborhoodChoices(code)
    assert.equal(choices.length, new Set(choices).size)
    assert.deepEqual(choices, [...choices].sort((a, b) => a.localeCompare(b, 'bg')))
    for (const name of names) {
      assert.ok(choices.includes(name))
      assert.equal(neighborhoodIn(normalizeSearchText(`маникюр в ${name}`), code), name)
      assert.equal(neighborhoodIn(normalizeSearchText(`manicure ${transliterate(name)}`), code), name)
      const district = name.replace(/\s+\d+[\p{L}]?$/u, '')
      if (district) assert.ok(choices.includes(district))
    }
  }
  assert.deepEqual(neighborhoodChoices('invalid'), [])
  assert.equal(neighborhoodIn('not a neighbourhood', '68134'), null)
  assert.equal(boundaryMatch('маникюр днес', 'днес'), true)
  assert.equal(boundaryMatch('днеска', 'днес'), false)
})

test('server city, quarter, natural date/time and ambiguity semantics remain authoritative and unchanged', () => {
  const now = DateTime.fromISO('2026-11-12T10:00:00Z')
  for (const query of ['Маникюр в Пловдив утре след 13:00', 'Manicure in Plovdiv tomorrow after 1 PM']) {
    const result = server.parseIntent(server.discoveryRequestSchema.parse({ query }), now, { v2: true })
    assert.equal(result.cityCode, '56784'); assert.equal(result.date, '2026-11-13'); assert.equal(result.timeFrom, '13:00')
  }
  const nearby = server.parseIntent(server.discoveryRequestSchema.parse({ query: 'маникюр в Манастирски ливади', coordinates: { latitude: 42.66, longitude: 23.28, consent: true } }), now, { v2: true })
  assert.equal(nearby.neighborhood, 'Манастирски ливади')
  const ambiguous = server.parseIntent(server.discoveryRequestSchema.parse({ query: 'Маникюр в София и Пловдив' }), now, { v2: true })
  assert.equal(ambiguous.clarification.field, 'city')
})

async function graph(entry) {
  const seen = new Set(), packages = new Set()
  async function visit(file) {
    if (seen.has(file)) return
    const source = await readFile(file, 'utf8'); seen.add(file)
    for (const match of source.matchAll(/\b(?:import|export)\s+(?:(?!\()[^;\n]+?\s+from\s*)?['"]([^'"]+)['"]/g)) {
      const specifier = match[1]
      if (!specifier.startsWith('.')) { packages.add(specifier); continue }
      const base = path.resolve(path.dirname(file), specifier)
      for (const extension of ['', '.js', '.mjs']) {
        try { if ((await stat(base + extension)).isFile()) { await visit(base + extension); break } } catch {}
      }
    }
  }
  await visit(fileURLToPath(new URL(entry, import.meta.url)))
  return { files: [...seen], packages: [...packages] }
}

test('the lightweight helper and initial home graph no longer import the server intent parser/schema', async () => {
  const helper = await graph('../lib/discovery/location-query.mjs')
  assert.deepEqual(helper.packages, [])
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.ok(helper.files.every(file => !/intent\.mjs|internal-search|service-lexicon|catalogue|supabase|booking/.test(path.relative(root, file))))
  const home = await graph('../components/home-page.js')
  assert.ok(home.files.some(file => file.endsWith('/location-query.mjs')))
  assert.equal(home.files.some(file => file.endsWith('/intent.mjs')), false)
  // Pricing and booking safeguards still legitimately use Zod elsewhere;
  // this extraction intentionally does not rewrite or weaken those rules.
})
