import { pr81LocationPriorSource, pr81LocationAllowsFileChange, pr81LocationAllowsNewFile, pr81LocationMatchesPriorHash } from "./pr81-location-only-scope.mjs"
import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import { catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import { sportsMobilePhotoFitAllowsFileChange } from './sports-mobile-photo-fit-scope.mjs'
import { SERVICE_PRICE_CARDS_NEW_HASHES, servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
import test from 'node:test'
import { PUBLIC_ENGLISH_NEW_HASHES, publicEnglishAllowsFileChange, publicEnglishAllowsNewFile, publicEnglishSearchSource } from './public-english-scope.mjs'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import sharp from 'sharp'
import { COMPACT_SELECTION_CHANGED_FILES, CAR_WASH_REFINEMENT_NEW_MEDIA } from './discovery-refinement-20261122-scope.mjs'
import { nextSecurityUpgradeAllowsFileChange } from './next-security-upgrade-scope.mjs'
import { stationaryDiscoveryAllowsFileChange, stationaryDiscoveryAllowsNewFile } from './stationary-discovery-scope.mjs'
import { publicActionAllowsFileChange, publicActionAllowsNewFile } from './public-action-scope.mjs'

const BASE = 'eb36f6718141b9e616170a0b3d90bfcc868ad58b'
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, pr81LocationPriorSource(path, source))))))))
// This suite audits the old photo release, not the later five navigation-only
// scenes. Restore only the exact receipt-pinned follow-up before evaluating
// its metadata; keep the original historical receipt and expected photos.
const subcategoryPath = 'lib/discovery/subcategories.mjs'
const priorSubcategories = pr81LocationPriorSource(subcategoryPath, await readFile(new URL('../' + subcategoryPath, import.meta.url), 'utf8'))
const categoryImport = new URL('../lib/discovery/categories.mjs', import.meta.url).href
const { DISCOVERY_SUBCATEGORIES } = await import('data:text/javascript;base64,' + Buffer.from(priorSubcategories.replace("from './categories.mjs'", `from '${categoryImport}'`)).toString('base64'))
const reviewed = {
  'app/inline-discovery.css': '8cabfbed094969cd7d4942d943c5d16afc43de55b0e19546621d8f60fca36706',
  'app/premium-discovery-cards.css': '96ad3432d6d93a083bfd5a5e783972a80d7ed09ad64d7bbc6d90c16be4de109b',
  'components/discovery-business-card.js': 'f7d488df5789416d1c934dc939878968b71d9c937cade3642a963ac02cd31a01',
  'components/discovery-subcategories.js': '180d30995f9f803dd33530a29033bd9c0aad1fe1cb24d7682afd18350641e7f3',
  'components/inline-discovery-summary.js': 'a7f2cfa1cd1c95a5017d49508160b78c0e51ad6e86cff66da0e3097c958bbd73',
  'lib/discovery/inline-copy.mjs': 'b29a40d5482a963f1cfaf99e834c54a71501cbb4e1863c74ef3365023737866b',
  'lib/discovery/home.mjs': 'ddd0650f96cb2c1fa8e4addc5a9f3793008a5c19c48aff02218e1eafeee4a81e',
  'lib/discovery/subcategories.mjs': 'f2dbe83bcb2723d9da4e365d02afc6d2b0f108a73a40b74122509c31b6d8030e',
  'components/partner-categories.js': '0bab4622619a20f6630de9d5f268af8e5c9c1df5024258b8b8d90eaf69c2215a',
  'app/solar.css': '3b1c95fcf125a067f526cb7de22f64927774373303c2fbbb4b21ca008eea823a',
}
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const baseline = git('ls-tree', '-r', '-z', BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('the compact-selection/photo follow-up has exactly ten reviewed source hashes and three new car-wash media paths; all other production bytes stay frozen', async () => {
  assert.deepEqual([...COMPACT_SELECTION_CHANGED_FILES].sort(), Object.keys(reviewed).sort())
  for (const [path, hash] of Object.entries(reviewed)) if (!pr81LocationAllowsFileChange(path) && !stationaryDiscoveryAllowsFileChange(path) && !publicActionAllowsFileChange(path) && !publicEnglishAllowsFileChange(path) && !servicePriceCardsAllowsFileChange(path) && !catalogueRevalidationAllowsFileChange(path) && !sportsMobilePhotoFitAllowsFileChange(path)) assert.equal(createHash('sha256').update(await read(path)).digest('hex'), hash, `${path}: any further change needs its own focused review, never a refreshed data baseline`)
  const frozen = baseline.filter(record => !pr81LocationAllowsFileChange(record.path) && !COMPACT_SELECTION_CHANGED_FILES.has(record.path) && !nextSecurityUpgradeAllowsFileChange(record.path) && !stationaryDiscoveryAllowsFileChange(record.path) && !publicActionAllowsFileChange(record.path) && !publicEnglishAllowsFileChange(record.path) && !servicePriceCardsAllowsFileChange(record.path) && !catalogueRevalidationAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), record.oid, `${record.path} stays unchanged from ${BASE}`)
  }))
  const current = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => !pr81LocationAllowsNewFile(path) && path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && !priority30ReportAllowsNewFile(path) && !regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path)) && productionPath(path) && !(publicActionAllowsNewFile(path) || path === 'components/public-action.module.css' && publicEnglishAllowsFileChange(path)) && !publicEnglishAllowsNewFile(path) && !pr81LocationMatchesPriorHash(path, PUBLIC_ENGLISH_NEW_HASHES[path]) && !(path === 'scripts/check-public-english.mjs' && (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path))) && !(path === 'lib/locale/service-english.json' && (suhodolIntakeAllowsFileChange(path) || catalogueRevalidationAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path)))) && !servicePriceCardsAllowsNewFile(path) && !(stationaryDiscoveryAllowsNewFile(path) || path === 'scripts/inventory-public-english.mjs' && (publicEnglishAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path)))))
  // A formerly new service-menu file can now have the separately pinned
  // gallery follow-up. Recognize only its exact reconstructed original hash.
  const historicalFiles = current.filter(path => !pr81LocationMatchesPriorHash(path, SERVICE_PRICE_CARDS_NEW_HASHES[path]))
  assert.deepEqual([...new Set(historicalFiles)].sort(), [...baseline.map(record => record.path), ...CAR_WASH_REFINEMENT_NEW_MEDIA].sort())
})

test('the partner-photo stylesheet change cannot restyle any existing search, booking or business-card rules', async () => {
  const require = createRequire(import.meta.url), { parse } = require('next/dist/compiled/postcss-scss/scss-syntax')
  const permitted = new Set(['.partner-category-art', '.partner-category-art > .partner-category-photo', '.partner-category-selection-heading > .partner-category-art--heading', '.partner-category-art .business-category-art'])
  function canonical(node) {
    if (node.type === 'comment') return null
    const selectors = node.type === 'rule' ? node.selectors.filter(selector => !permitted.has(selector)) : null
    if (selectors && !selectors.length) return null
    const children = node.nodes?.map(canonical).filter(Boolean)
    if (children && !children.length) return null
    if (node.type === 'root') return children
    if (node.type === 'rule') return { type: node.type, selectors, children }
    if (node.type === 'atrule') return { type: node.type, name: node.name, params: node.params, children }
    if (node.type === 'decl') return { type: node.type, prop: node.prop, value: node.value, important: Boolean(node.important) }
    return { type: node.type, value: node.toString() }
  }
  assert.deepEqual(canonical(parse(await read('app/solar.css'))), canonical(parse(git('show', BASE + ':app/solar.css'))))
})

test('classification definitions, identifiers, labels, regexes and every matching function differ only at the three approved photo-slug positions', async () => {
  let expected = git('show', BASE + ':lib/discovery/subcategories.mjs')
  for (const [before, after] of [
    ["['car_wash','upholstery','Пране на салон','Upholstery cleaning','car-interior-detailing',", "['car_wash','upholstery','Пране на салон','Upholstery cleaning','interior-car-clean',"],
    ["['car_wash','mobile','Мобилна автомивка','Mobile car wash','sx-wash-mobile-van',", "['car_wash','mobile','Мобилна автомивка','Mobile car wash','sx-wash-mobile-exterior',"],
    ["['auto_repair','inspection','ГТП','Vehicle inspection','sx-auto-car-inspection',", "['auto_repair','inspection','ГТП','Vehicle inspection','vehicle-technical-inspection',"],
  ]) { assert.equal(expected.split(before).length, 2); expected = expected.replace(before, after) }
  assert.equal(await read('lib/discovery/subcategories.mjs'), expected)
  const audit = JSON.parse(await read('docs/subcategory-photo-audit-20261122.json'))
  assert.equal(audit.totalChoices, 113); assert.equal(audit.uniqueSources, 107)
  assert.equal(Object.keys(audit.categories).length, 14)
  assert.deepEqual(audit.definiteMismatches, ['car_wash-upholstery'])
  const replacements = { 'car_wash-upholstery': '/service-photos/interior-car-clean-v1.webp', 'car_wash-mobile': '/service-photos/sx-wash-mobile-exterior-v1.webp', 'auto_repair-inspection': '/service-photos/vehicle-technical-inspection-v1.webp' }
  assert.equal(DISCOVERY_SUBCATEGORIES.length, audit.items.length)
  for (const [index, actual] of DISCOVERY_SUBCATEGORIES.entries()) {
    const reviewed = audit.items[index]
    assert.equal(actual.id, reviewed.id); assert.equal(actual.category, reviewed.category)
    if (actual.id === 'fitness-pilates') {
      // Presentation-only rename is separately hash-pinned; keep the former
      // text in the original image audit and verify the live display labels.
      assert.equal(reviewed.bg, 'Пилатес и реформър'); assert.equal(reviewed.en, 'Pilates and reformer')
      assert.equal(actual.bg, 'Реформър пилатес'); assert.equal(actual.en, 'Reformer Pilates')
    } else {
      assert.equal(actual.bg, reviewed.bg); assert.equal(actual.en, reviewed.en)
    }
    assert.ok(reviewed.depicts.length > 20, `${actual.id}: retained actual visual review`)
    assert.equal(actual.photo, replacements[actual.id] || reviewed.source)
    if (replacements[actual.id]) assert.equal(reviewed.replacement, actual.photo)
  }
})

test('the additional home-category change is precisely the square car-wash illustration mapping, not filtering, prices or catalogue data', async () => {
  let expected = git('show', BASE + ':lib/discovery/home.mjs')
  expected = expected.replace("['fitness', 'pets', 'beauty', 'barber']", "['fitness', 'pets', 'beauty', 'barber', 'car_wash']")
  expected = expected.replace("id === 'other' ? 4 : refined ? 3 : 2", "id === 'car_wash' ? 5 : id === 'other' ? 4 : refined ? 3 : 2")
  const displayOrder = source => source.replace(/export const HOME_CATEGORY_IDS = Object\.freeze\(\[[^\n]+\]\)/, 'CATEGORY_DISPLAY_ORDER')
  assert.equal(stationaryDiscoveryAllowsFileChange('lib/discovery/home.mjs'), true, 'the separate exact stage guard proves only the authorized category display reorder')
  assert.equal(displayOrder(await read('lib/discovery/home.mjs')), displayOrder(expected))
})

test('the final car-wash image retains exact generated-illustration provenance/prompt and square compressed files without masquerading as real partner media', async () => {
  const manifest = JSON.parse(await read('docs/car-wash-photo-20261122.json'))
  assert.equal(manifest.category, 'car_wash'); assert.equal(manifest.origin, 'generated')
  assert.match(manifest.mode, /^built-in image_gen/)
  assert.equal(manifest.sourceFilename, 'exec-40e994b1-1712-4830-999a-1ccaaaef5fc6.png')
  assert.equal(manifest.author, undefined); assert.equal(manifest.photoUrl, undefined); assert.equal(manifest.licenseUrl, undefined)
  assert.match(manifest.prompt, /fictional generic business scene, NOT a real partner photograph/)
  assert.match(manifest.prompt, /entire warm burnt-orange compact car/)
  assert.match(manifest.usage, /never a real partner photograph/)
  assert.equal(manifest.sourceSha256, '041d28bfd6e282f0120b91e04495779b2f991e098314cf08c197a2fe90fd2b8c')
  assert.deepEqual(manifest.files.map(file => file.file), [...CAR_WASH_REFINEMENT_NEW_MEDIA])
  const hashes = ['1630669f5e49db2efaf703dac8347d5e66ced89b866189b821610ea75a0c3b2a', '647165fbd4c25b2522d8a067885d500d31789f07d4e2cf524f81fe7217a63dc9', 'a742a81a2f35f69cecb0bf787bcf985bffc1e3df4f3819bc1ee4df8e448cc13b']
  for (const [index, file] of manifest.files.entries()) {
    const bytes = await readFile(new URL('../' + file.file, import.meta.url))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hashes[index])
    assert.equal(file.sha256, hashes[index]); assert.equal(file.bytes, bytes.length)
    assert.equal(file.width, [160, 240, 640][index]); assert.equal(file.height, file.width)
    const metadata = await sharp(bytes).metadata()
    assert.equal(metadata.format, 'webp'); assert.equal(metadata.width, file.width); assert.equal(metadata.height, file.height)
    assert.equal(metadata.exif, undefined); assert.equal(metadata.xmp, undefined)
    assert.ok(bytes.length < (index === 2 ? 150000 : 30000))
  }
})
