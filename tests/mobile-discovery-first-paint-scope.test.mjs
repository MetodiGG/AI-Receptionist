import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { DateTime } from 'luxon'
import { normalizeCatalogueBusinesses, searchFreeCatalogue } from '../lib/discovery/catalogue-search.mjs'
import { discoveryRequestSchema, parseIntent } from '../lib/discovery/intent.mjs'
import { PUBLIC_CATALOGUE } from '../lib/discovery/public-catalogue.mjs'
import receipt from './fixtures/mobile-discovery-first-paint-approval.json' with { type: 'json' }
import { mobileDiscoveryFirstPaintAllowsFileChange, mobileDiscoveryFirstPaintPriorSource } from './mobile-discovery-first-paint-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root })
const sha = source => createHash('sha256').update(source).digest('hex')
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const serverPath = 'lib/discovery/catalogue-search.mjs'
const clock = DateTime.fromISO('2026-11-27T11:00:00Z')
const publicFacts = response => {
  const { checkedAt, ...stable } = response
  return stable
}

test('the release changes only catalogue search presentation work and first-row image priority', async () => {
  const { baseline, changed } = receipt
  assert.equal(baseline, '773df2ad6657a54b0525c0751fe8e4318b20029f')
  const expected = ['components/inline-category-grid.js', serverPath]
  assert.deepEqual(Object.keys(changed), expected)
  const actual = new Set([...split(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...actual].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort(), expected)
  for (const [path, { before, after }] of Object.entries(changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url)), original = git('show', baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.notEqual(before, after, path)
    assert.equal(mobileDiscoveryFirstPaintAllowsFileChange(path), true, path)
    assert.deepEqual(mobileDiscoveryFirstPaintPriorSource(path, current), original, path)
    assert.equal(mobileDiscoveryFirstPaintPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(mobileDiscoveryFirstPaintPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(mobileDiscoveryFirstPaintPriorSource(path, tampered), tampered, 'unreviewed bytes are never normalized')
  }
  for (const path of ['app/inline-discovery.css', 'components/discovery-search.js', 'components/public-service-menu.js',
    'lib/discovery/public-details.mjs', 'lib/discovery/sofia-catalogue.mjs', 'lib/booking-engine.mjs', 'next.config.mjs', 'public/category-photos/fitness-v3.webp']) {
    assert.equal(mobileDiscoveryFirstPaintAllowsFileChange(path), false, path)
  }
})

test('lean catalogue candidate mode defers reviewed service artwork without changing public match evidence', () => {
  const intent = { cityCode: '68134', category: 'auto_repair', browse: true, searchV2: true }
  const options = { now: clock.toMillis(), includeDetails: false }
  const decorated = normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, intent, options)
  assert.ok(decorated.some(row => row.services.some(service => service.illustrativePhotoKey)), 'exercise real reviewed photo associations')
  const stripped = decorated.map(row => ({ ...row, services: row.services.map(({ illustrativePhotoKey, ...service }) => service) }))
  assert.deepEqual(normalizeCatalogueBusinesses(PUBLIC_CATALOGUE, intent, { ...options, includeServicePhotoFields: false }), stripped)
})

test('an edited mutable address is revalidated in the same Sofia-only catalogue process', async () => {
  const immutable = PUBLIC_CATALOGUE.find(row => row.id === 'sofia-alyoga-benkovski')
  assert.ok(immutable && Object.isFrozen(immutable))
  const edited = structuredClone(immutable)
  const input = discoveryRequestSchema.parse({ query: '', browse: true, cityCode: '68134', category: 'fitness' })
  const interpretation = () => ({ intent: parseIntent(input, clock, { v2: true }), mode: 'deterministic' })
  const dependencies = { now: clock, config: { maxResults: 15 }, sofiaOnly: true, readInternal: async () => [],
    readCatalogue: async () => [edited], readCataloguePhotos: async () => [] }
  const ids = async () => (await searchFreeCatalogue(input, interpretation(), dependencies)).results.map(row => row.id)
  assert.deepEqual(await ids(), [edited.id])
  edited.address = 'София, ул. Георги Бенковски 11, с. Бистрица'
  assert.deepEqual(await ids(), [], 'a conflicting locality cannot retain a previously accepted city result')
  edited.address = immutable.address
  assert.deepEqual(await ids(), [edited.id])
})

test('paged and filtered catalogue requests remain identical to production, including reviewed card photos', async () => {
  // Import the exact old search module against the same unchanged dependencies.
  // Only its location moves into a data URL, so resolve the relative imports.
  const originalUrl = new URL('../' + serverPath, import.meta.url)
  const source = git('show', receipt.baseline + ':' + serverPath).toString('utf8')
    .replace(/from '([.]{1,2}\/[^'\n]+)'/gu, (_match, relative) => `from '${new URL(relative, originalUrl).href}'`)
  const deployed = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
  const noCalendar = () => assert.fail('discovering a public catalogue must not read live booking calendars')
  const dependencies = { now: clock, config: { maxResults: 15 }, readInternal: async () => [],
    readCatalogue: async () => PUBLIC_CATALOGUE, readCataloguePhotos: async () => [],
    getBusiness: noCalendar, getSlots: noCalendar }
  const cases = [
    { query: '', browse: true, cityCode: '68134' },
    { query: '', browse: true, cityCode: '68134', category: 'auto_repair', catalogueOffset: 15, locale: 'en' },
    { query: '', browse: true, cityCode: '68134', category: 'nails', subcategory: 'nails-gel', locale: 'bg' },
    { query: '', browse: true, cityCode: '68134', category: 'fitness', subcategory: 'fitness-folk-dance' },
    { query: 'Beauty Studio 99', cityCode: '68134' },
    { query: 'Сглобяване на мебели', cityCode: '68134' },
    { query: 'несъществуваща тестова услуга', cityCode: '68134' },
    { query: '', browse: true, cityCode: '44238', category: 'hair' },
  ]
  let reviewedCardArtwork = false
  for (const raw of cases) {
    const input = discoveryRequestSchema.parse(raw)
    const interpretation = () => ({ intent: parseIntent(input, clock, { v2: true }), mode: 'deterministic' })
    const scope = { ...dependencies, sofiaOnly: raw.cityCode === '68134' }
    const before = await deployed.searchFreeCatalogue(input, interpretation(), scope)
    const after = await searchFreeCatalogue(input, interpretation(), scope)
    assert.deepEqual(publicFacts(after), publicFacts(before), JSON.stringify(raw))
    if (raw.catalogueOffset) {
      assert.equal(after.cataloguePage.offset, raw.catalogueOffset)
      assert.ok(after.results.length)
    }
    reviewedCardArtwork ||= after.results.some(result => result.services.some(service => service.illustrativePhotoKey))
  }
  assert.ok(reviewedCardArtwork, 'the paged-path comparison must observe approved service image labels')
})
