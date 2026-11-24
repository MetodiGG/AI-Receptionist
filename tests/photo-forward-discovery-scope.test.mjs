import { pr81LocationPriorSource, pr81LocationAllowsFileChange, pr81LocationAllowsNewFile, pr81LocationMatchesPriorHash } from "./pr81-location-only-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import { catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import { sportsMobilePhotoFitAllowsFileChange, sportsMobilePhotoFitPriorCss } from './sports-mobile-photo-fit-scope.mjs'
import { servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { PUBLIC_ENGLISH_NEW_HASHES, publicEnglishAllowsFileChange, publicEnglishAllowsNewFile, publicEnglishSearchSource } from './public-english-scope.mjs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, readlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { reviewedDiscoveryFileChange, refinementAllowsNewMedia } from './discovery-refinement-20261122-scope.mjs'
import { nextSecurityUpgradeAllowsFileChange } from './next-security-upgrade-scope.mjs'
import { stationaryDiscoveryAllowsFileChange } from './stationary-discovery-scope.mjs'
import { publicActionAllowsFileChange, publicActionAllowsNewFile } from './public-action-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const BASE = '3858c4e5f7e96d8a53db09bc09dc3a014be7658b'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, pr81LocationPriorSource(path, source)))))))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const baseTree = git('ls-tree', '-r', '-z', BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob')
const protectedRoot = path => /^(?:app\/api|hooks|lib|public)\//.test(path)
function frozenPath(path) {
  return protectedRoot(path)
    || /^components\//.test(path) && !['components/inline-category-grid.js', 'components/discovery-subcategories.js'].includes(path)
    || /^app\/.*\.css$/.test(path) && path !== 'app/inline-discovery.css'
    || /^(?:package\.json|pnpm-lock\.yaml|next\.config\.mjs)$/.test(path)
}
const frozen = baseTree.filter(record => frozenPath(record.path))

test('the historical photo-forward baseline freezes everything outside the exact 2026-11-22 presentation/navigation exception list', async () => {
  assert.equal(frozen.length, 2625)
  assert.equal(sha256(JSON.stringify(frozen)), '5ca0ccae56c0a003d91c4d37e43a8f286d8fcf455527a11ddcc82d3b9c728278')
  const stillFrozen = frozen.filter(record => !pr81LocationAllowsFileChange(record.path) && !reviewedDiscoveryFileChange(record.path) && !nextSecurityUpgradeAllowsFileChange(record.path) && !stationaryDiscoveryAllowsFileChange(record.path) && !publicActionAllowsFileChange(record.path) && !publicEnglishAllowsFileChange(record.path) && !servicePriceCardsAllowsFileChange(record.path) && !catalogueRevalidationAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < stillFrozen.length; offset += 32) {
    await Promise.all(stillFrozen.slice(offset, offset + 32).map(async record => {
      const path = new URL('../' + record.path, import.meta.url)
      const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
      const oid = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
      assert.equal(oid, record.oid, `${record.path} must remain byte-identical to ${BASE}`)
    }))
  }
  const expected = baseTree.filter(record => protectedRoot(record.path)).map(record => record.path).sort()
  assert.equal(expected.length, 2492)
  const actual = git('ls-files', '--cached', '--others', '-z', '--', 'app/api', 'hooks', 'lib', 'public').split('\0').filter(path => !pr81LocationAllowsNewFile(path) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && !regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path)) && !refinementAllowsNewMedia(path) && !publicEnglishAllowsNewFile(path) && !pr81LocationMatchesPriorHash(path, PUBLIC_ENGLISH_NEW_HASHES[path]) && !(path === 'scripts/check-public-english.mjs' && (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path))) && !(path === 'lib/locale/service-english.json' && (suhodolIntakeAllowsFileChange(path) || catalogueRevalidationAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path)))) && !servicePriceCardsAllowsNewFile(path))
  assert.deepEqual([...new Set(actual)].sort(), expected, 'Only the exact fifteen authorized versioned category-media siblings may be new; no new or renamed data/API/taxonomy paths')
})

test('the unchanged main search form and summary/presence sources retain their reviewed byte hashes', async () => {
  const files = {
    'components/inline-discovery-panel.js': '814c7f1d82b28b2743630c86118b7cf184995512921c4a937d922fd63342d6db',
    'app/inline-discovery-panel.css': '5982be44f3705c226a76b0ed9f260d3501b0d90ba28eec7ae038b94c45fb0b60',
  }
  for (const [path, hash] of Object.entries(files)) assert.equal(sha256(await read(path)), hash, path)
  const source = publicEnglishSearchSource(await read('components/discovery-search.js'))
  const start = source.indexOf('<form className="discovery-form"'), end = source.indexOf('</form>', start) + 7
  assert.ok(start >= 0 && end > start)
  assert.equal(sha256(source.slice(start, end)), '8ba0c17fc09aede40e70af62f168f90ec900f5f3e08870d4ac0ef22090f6c89a')
})

test('approved tile markup cannot change category/service filtering, image failure behavior or the legacy non-home menu', async () => {
  const current = await read('components/discovery-subcategories.js')
  const original = git('show', BASE + ':components/discovery-subcategories.js')
  const between = (source, startMarker, endMarker) => {
    const start = source.indexOf(startMarker), end = source.indexOf(endMarker, start)
    assert.ok(start >= 0 && end > start)
    return source.slice(start, end)
  }
  for (const [start, end] of [
    ['function SubcategoryPhoto(', '\n}\n'],
    ['export function DiscoverySubcategories(', '  if (inline) {'],
  ]) assert.equal(between(current, start, end), between(original, start, end))
  const legacyStart = '  if (!category ||'
  assert.ok(current.includes(legacyStart) && original.includes(legacyStart))
  assert.equal(current.slice(current.indexOf(legacyStart)), original.slice(original.indexOf(legacyStart)))
  assert.ok(current.includes("const needsWideLabels = choices.some(item => /\\p{L}{14,}/u.test(item[language] || item.label || ''))"), 'the only narrow-layout flag is derived from complete visible localized labels')
  assert.match(current, /data-long-label=\{needsWideLabels \? 'true' : undefined\}/)
  const category = await read('components/inline-category-grid.js')
  const categoryBefore = git('show', BASE + ':components/inline-category-grid.js')
  const originalPhoto = between(categoryBefore, 'function CategoryPhoto(', '// A persistent')
  const approvedPhoto = originalPhoto
    .replace('  const [failed, setFailed] = useState(null)\n', '  const [failed, setFailed] = useState(null)\n  const source = category.photoLarge || category.photo2x\n  const sources = `${category.photo} 160w, ${category.photo2x} 240w${category.photoLarge ? `, ${category.photoLarge} 640w` : \'\'}`\n')
    .replace('failed !== category.photo', 'failed !== source')
    .replace('src={category.photo}', 'src={source}')
    .replace('srcSet={`${category.photo} 1x, ${category.photo2x} 2x`}', 'srcSet={sources} sizes="(max-width:699px)50vw,(max-width:999px)33vw,280px"')
    .replace('width={80} height={80}', "width={240} height={category.photoHeight || 240} style={category.photoPosition ? { objectFit: 'cover', objectPosition: category.photoPosition } : undefined}")
    .replace('setFailed(category.photo)', 'setFailed(source)')
  assert.notEqual(approvedPhoto, originalPhoto)
  assert.equal(between(category, 'function CategoryPhoto(', '// A persistent'), approvedPhoto, 'only explicitly approved responsive metadata, optional 640w sibling, real Beauty portrait framing and actual primary-source error key may differ')
})

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
function summaryRules(source) {
  const found = []
  parse(source).walkRules(rule => {
    const selectors = rule.selectors.filter(selector => /\.inline-summary(?:\b|[.-])/.test(selector))
    if (!selectors.length) return
    const conditions = []
    for (let parent = rule.parent; parent?.type !== 'root'; parent = parent.parent) {
      if (parent.type === 'atrule') conditions.unshift([parent.name, parent.params])
    }
    found.push({
      selectors, conditions,
      declarations: rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value, Boolean(node.important)]),
    })
  })
  return found
}

test('the historical sticky baseline is preserved as evidence, while only the exact separately reviewed stationary summary replaces its old contract', async () => {
  const before = summaryRules(git('show', BASE + ':app/inline-discovery.css'))
  assert.ok(before.length > 15, 'freeze the actual responsive, dark, sticky, focus and reduced-motion summary rules')
  const stickyRules = rules => rules.filter(rule => rule.selectors.includes('.inline-summary[data-sticky-safe="true"]'))
  assert.equal(stickyRules(before).length, 1)
  assert.equal(stationaryDiscoveryAllowsFileChange('app/inline-discovery.css') || sportsMobilePhotoFitAllowsFileChange('app/inline-discovery.css'), true)
  const css = await read('app/inline-discovery.css')
  assert.deepEqual(summaryRules(css), summaryRules(sportsMobilePhotoFitPriorCss(css)), 'the exact phone sports delta cannot alter any stationary summary rule')
  assert.deepEqual(stickyRules(summaryRules(css)), [])
  const current = await read('components/inline-discovery-summary.js')
  const original = git('show', BASE + ':components/inline-discovery-summary.js')
  const effect = source => source.slice(source.indexOf('  useEffect(() => {'), source.indexOf('  const parent = categoryById(category)'))
  assert.ok(effect(original).length > 1400)
  assert.equal(pr81LocationAllowsFileChange('components/inline-discovery-summary.js') || stationaryDiscoveryAllowsFileChange('components/inline-discovery-summary.js'), true)
  assert.doesNotMatch(current, /data-sticky-safe|setStickySafe/)
  assert.match(effect(current), /Math\.min\(Math\.ceil\(height\) \+ 24, Math\.max\(0, viewport - 240\)\)/)
  assert.match(effect(current), /observer\?\.disconnect\(\)/)
})
