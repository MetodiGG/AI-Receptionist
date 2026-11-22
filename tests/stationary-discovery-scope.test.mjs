import { servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
import test from 'node:test'
import { PUBLIC_ENGLISH_BASE, publicEnglishAllowsFileChange, publicEnglishAllowsNewFile } from './public-english-scope.mjs'
import { publicActionAllowsFileChange, publicActionAllowsNewFile } from './public-action-scope.mjs'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import {
  STATIONARY_DISCOVERY_BASE, STATIONARY_DISCOVERY_HASHES, STATIONARY_DISCOVERY_NEW_HASHES,
  stationaryDiscoveryAllowsFileChange, stationaryDiscoveryAllowsNewFile,
} from './stationary-discovery-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const before = path => git('show', STATIONARY_DISCOVERY_BASE + ':' + path)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const tree = git('ls-tree', '-r', '-z', STATIONARY_DISCOVERY_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('stationary selection and truthful count authorization covers exactly ten reviewed existing paths and one offline inventory utility', async () => {
  assert.deepEqual(Object.keys(STATIONARY_DISCOVERY_HASHES).sort(), [
    'app/api/public/discovery/route.js', 'app/inline-discovery.css',
    'components/discovery-subcategories.js', 'components/inline-discovery-summary.js',
    'lib/discovery/catalogue-pagination.mjs', 'lib/discovery/catalogue-search.mjs',
    'lib/discovery/home.mjs', 'lib/discovery/inline-copy.mjs',
    'lib/discovery/internal-search.mjs', 'lib/discovery/public-search-inventory.mjs',
  ].sort())
  assert.deepEqual(Object.keys(STATIONARY_DISCOVERY_NEW_HASHES), ['scripts/inventory-public-english.mjs'])
  for (const [path, hash] of Object.entries({ ...STATIONARY_DISCOVERY_HASHES, ...STATIONARY_DISCOVERY_NEW_HASHES })) {
    assert.equal(sha256(publicEnglishAllowsFileChange(path) ? git('show', PUBLIC_ENGLISH_BASE + ':' + path) : await read(path)), hash, path + ': further edits require a new focused review, not a refreshed baseline')
  }
  for (const path of ['package.json', 'pnpm-lock.yaml', 'next.config.mjs', 'lib/discovery/subcategories.mjs', 'lib/discovery/sofia-catalogue.mjs', 'components/discovery-search.js', 'public/category-photos/beauty-v3.webp']) {
    assert.equal(stationaryDiscoveryAllowsFileChange(path), false, path)
    assert.equal(stationaryDiscoveryAllowsNewFile(path), false, path)
  }
  for (const path of ['tests/discovery-refinement-20261122-scope.mjs', 'tests/next-security-upgrade-scope.mjs']) assert.equal(await read(path), before(path), path + ': the historical authorizations remain byte-identical')
})

test('every other production path, original image, taxonomy/data record, main search, booking and analytics byte stays frozen to the approved Next security commit', async () => {
  const frozen = tree.filter(record => !stationaryDiscoveryAllowsFileChange(record.path) && !publicActionAllowsFileChange(record.path) && !publicEnglishAllowsFileChange(record.path) && !servicePriceCardsAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' remains unchanged from ' + STATIONARY_DISCOVERY_BASE)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path) && !(publicActionAllowsNewFile(path) || path === 'components/public-action.module.css' && publicEnglishAllowsFileChange(path)) && !publicEnglishAllowsNewFile(path) && !servicePriceCardsAllowsNewFile(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(STATIONARY_DISCOVERY_NEW_HASHES)].sort(), 'no new production/data/image path other than the separately reviewed offline inventory utility')
})

test('home changes only the authorized category display order, never image mappings, filtering, prices or defaults', async () => {
  const original = before('lib/discovery/home.mjs'), current = await read('lib/discovery/home.mjs')
  const oldOrder = "export const HOME_CATEGORY_IDS = Object.freeze(['hair', 'nails', 'beauty', 'barber', 'auto_repair', 'car_wash', 'fitness', 'education', 'pets', 'home_services', 'health', 'consulting', 'detailing', 'other'])"
  const newOrder = "export const HOME_CATEGORY_IDS = Object.freeze(['fitness', 'education', 'home_services', 'auto_repair', 'car_wash', 'hair', 'nails', 'beauty', 'barber', 'pets', 'health', 'consulting', 'detailing', 'other'])"
  assert.equal(original.split(oldOrder).length, 2)
  assert.equal(current, original.replace(oldOrder, newOrder))
})

test('subcategory component removes only the duplicated inline parent control and its now-unused helpers; legacy menu and actual tiles remain exact', async () => {
  let expected = before('components/discovery-subcategories.js')
  const replaceOnce = (pattern, replacement) => {
    const next = expected.replace(pattern, replacement)
    assert.notEqual(next, expected, String(pattern)); expected = next
  }
  replaceOnce("import { categoryById } from '../lib/discovery/categories.mjs'\n", '')
  replaceOnce(/\nfunction ParentCategoryPhoto\(\{ src \}\) \{[\s\S]*?\n\}\n/, '')
  replaceOnce('    const parentTitle = categoryById(category)?.[language] || title\n', '')
  replaceOnce(/        <button type="button" className="inline-selected-parent"[^\n]+\n/, '')
  assert.equal(await read('components/discovery-subcategories.js'), expected)
})

const require = createRequire(import.meta.url), { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
function canonical(node) {
  if (node.type === 'comment') return null
  const presentation = /\.inline-(?:summary(?:\b|[.-])|subcategories-header\b|selected-parent\b|parent-photo\b)/
  const selectors = node.type === 'rule' ? node.selectors.filter(selector => !presentation.test(selector)) : null
  if (selectors && !selectors.length) return null
  if (node.type === 'decl') {
    const parent = node.parent?.selector || ''
    if (node.prop === 'text-align' && parent === '.customer-home.quick-choice :is(.inline-discovery-categories,.discovery-subcategories.is-inline) h2') return null
    if (node.prop === 'scroll-margin-top' && /^\.customer-home\.quick-choice:has\(\.inline-discovery-categories\) \.home-(?:business-grid > li|section-heading h2)/.test(parent)) return null
  }
  const children = node.nodes?.map(canonical).filter(Boolean)
  if (children && !children.length) return null
  if (node.type === 'root') return children
  if (node.type === 'rule') return { type: node.type, selectors, children }
  if (node.type === 'atrule') return { type: node.type, name: node.name, params: node.params, children }
  if (node.type === 'decl') return { type: node.type, prop: node.prop, value: node.value, important: Boolean(node.important) }
  return { type: node.type, value: node.toString() }
}
test('CSS changes only summary presentation/normal-flow clearance, the removed inline parent control and centered discovery headings', async () => {
  assert.deepEqual(canonical(parse(await read('app/inline-discovery.css'))), canonical(parse(before('app/inline-discovery.css'))))
})

test('the exact-count API adds only a server freshness option; autocomplete, rich hydration, source fields and cursor semantics remain bounded and unchanged', async () => {
  const route = 'app/api/public/discovery/route.js'
  const oldAdapter = 'readInternal: intent => readInternalCandidates(getSupabaseAdmin(), intent),'
  const newAdapter = 'readInternal: (intent, options) => readInternalCandidates(getSupabaseAdmin(), intent, options),'
  assert.equal(before(route).split(oldAdapter).length, 2)
  assert.equal(await read(route), before(route).replace(oldAdapter, newAdapter))
  const internal = await read('lib/discovery/internal-search.mjs'), previous = before('lib/discovery/internal-search.mjs')
  assert.equal(internal, previous
    .replace('export async function readInternalCandidates(db, intent) {', 'export async function readInternalCandidates(db, intent, { fresh = false } = {}) {')
    .replace("readPublishedSearchInventory(db, { cityCode: intent.cityCode || '' })", "readPublishedSearchInventory(db, { cityCode: intent.cityCode || '', fresh })"))
  const index = await read('lib/discovery/public-search-inventory.mjs'), originalIndex = before('lib/discovery/public-search-inventory.mjs')
  assert.equal(index.slice(0, index.indexOf('export async function readPublishedSearchInventory(')), originalIndex.slice(0, originalIndex.indexOf('export async function readPublishedSearchInventory(')), 'the selected public fields, 500-ID keyset reads, public service eligibility, 16-city limit and source completion do not change')
  const revalidation = '// Recheck publication and active services after a cached index match.'
  assert.equal(index.slice(index.indexOf(revalidation)), originalIndex.slice(originalIndex.indexOf(revalidation)))
  assert.match(index, /if \(previous\?\.pending\) return previous\.pending/)
  assert.match(index, /if \(fresh !== true && previous && previous\.expiresAt > time\) return previous\.rows/)
  assert.equal(await read('app/api/public/discovery/suggestions/route.js'), before('app/api/public/discovery/suggestions/route.js'))
  const search = await read('lib/discovery/catalogue-search.mjs'), originalSearch = before('lib/discovery/catalogue-search.mjs')
  const cursor = source => source.split('\n').find(line => line.includes('const cataloguePage ='))
  assert.equal(cursor(search), cursor(originalSearch), 'total/offset/nextOffset keep their original consumed-candidate pagination contract')
  assert.match(search, /readInternal\(searchIntent, \{ fresh: true \}\)/)
  assert.match(search, /exactTotal = exactCount \? ranked\.length : null/)
  for (const file of Object.keys(STATIONARY_DISCOVERY_HASHES).filter(path => /(?:app\/api|lib\/discovery)/.test(path))) {
    assert.doesNotMatch(await read(file), /\.from\([^)]*\)\.(?:insert|update|upsert|delete)\(|\b(?:createPublicBooking|sendEmail|sendNotification)\s*\(/)
  }
})
