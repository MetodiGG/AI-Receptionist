import { suhodolIntakeAllowsFileChange, suhodolIntakeAllowsNewFile, suhodolIntakePriorSource, suhodolIntakePriorCatalogue } from './suhodol-intake-20261122-scope.mjs'
import { nearbyPointsAllowsFileChange, nearbyPointsAllowsNewFile, nearbyPointsPriorSource, nearbyPointsPriorCatalogue } from './nearby-points-20261122-scope.mjs'
import { locationRecoveryAllowsFileChange, locationRecoveryAllowsNewFile, locationRecoveryPriorSource } from './location-recovery-20261122-scope.mjs'
import { priority30ReportAllowsFileChange, priority30ReportAllowsNewFile, priority30ReportPriorSource } from './priority30-catalogue-report-scope.mjs'
import { azisCatalogueAllowsFileChange, azisCatalogueAllowsNewFile, azisCataloguePriorSource } from './azis-style-catalogue-20261122-scope.mjs'
import { regionalCatalogueAllowsFileChange, regionalCatalogueAllowsNewFile, regionalCataloguePriorSource } from './regional-catalogue-20261122-scope.mjs'
import { catalogueRevalidationAllowsFileChange } from './catalogue-revalidation-20261122-scope.mjs'
import { sportsMobilePhotoFitAllowsFileChange } from './sports-mobile-photo-fit-scope.mjs'
import { servicePriceCardsAllowsFileChange, servicePriceCardsAllowsNewFile } from './services-price-cards-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PUBLIC_ENGLISH_BASE, PUBLIC_ENGLISH_HASHES, PUBLIC_ENGLISH_NEW_HASHES, publicEnglishAllowsFileChange, publicEnglishAllowsNewFile, publicEnglishSearchSource } from './public-english-scope.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8').then(source => regionalCataloguePriorSource(path, azisCataloguePriorSource(path, priority30ReportPriorSource(path, locationRecoveryPriorSource(path, nearbyPointsPriorSource(path, suhodolIntakePriorSource(path, source)))))))
const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const tree = git('ls-tree', '-r', '-z', PUBLIC_ENGLISH_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('English display follows its own exact reviewed byte inventory; historical scopes, raw catalogue, taxonomy, prices, media, booking engines and config remain frozen', async () => {
  for (const [path, hash] of Object.entries({ ...PUBLIC_ENGLISH_HASHES, ...PUBLIC_ENGLISH_NEW_HASHES })) {
    if (suhodolIntakeAllowsFileChange(path) || priority30ReportAllowsFileChange(path) || servicePriceCardsAllowsFileChange(path) || catalogueRevalidationAllowsFileChange(path) || (regionalCatalogueAllowsFileChange(path) || azisCatalogueAllowsFileChange(path))) continue
    assert.equal(createHash('sha256').update(await read(path)).digest('hex'), hash, path + ': later edits need a separate review')
  }
  for (const path of ['lib/discovery/sofia-catalogue.mjs', 'lib/discovery/subcategories.mjs', 'lib/discovery/rail.mjs', 'lib/booking-mode.mjs', 'lib/booking-engine.mjs', 'lib/product-events-client.js', 'app/api/public/discovery/route.js', 'components/public-action.js', 'package.json', 'pnpm-lock.yaml', 'next.config.mjs', 'public/category-photos/beauty-v3.webp']) {
    assert.equal(publicEnglishAllowsFileChange(path), false, path)
    assert.equal(publicEnglishAllowsNewFile(path), false, path)
  }
  for (const path of ['tests/discovery-refinement-20261122-scope.mjs', 'tests/next-security-upgrade-scope.mjs', 'tests/stationary-discovery-scope.mjs', 'tests/public-action-scope.mjs']) {
    assert.equal(await read(path), git('show', PUBLIC_ENGLISH_BASE + ':' + path), path + ': do not expand old authorizations')
  }
  const frozen = tree.filter(record => !publicEnglishAllowsFileChange(record.path) && !servicePriceCardsAllowsFileChange(record.path) && !catalogueRevalidationAllowsFileChange(record.path) && !regionalCatalogueAllowsFileChange(record.path) && !azisCatalogueAllowsFileChange(record.path) && !priority30ReportAllowsFileChange(record.path) && !suhodolIntakeAllowsFileChange(record.path) && !nearbyPointsAllowsFileChange(record.path) && !locationRecoveryAllowsFileChange(record.path) && !sportsMobilePhotoFitAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' stays unchanged from ' + PUBLIC_ENGLISH_BASE)
  }))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && !suhodolIntakeAllowsNewFile(path) && !nearbyPointsAllowsNewFile(path) && !locationRecoveryAllowsNewFile(path) && !priority30ReportAllowsNewFile(path) && !regionalCatalogueAllowsNewFile(path) && !azisCatalogueAllowsNewFile(path) && !(path === 'lib/discovery/public-catalogue.mjs' && azisCatalogueAllowsFileChange(path)) && productionPath(path) && !servicePriceCardsAllowsNewFile(path))
  assert.deepEqual([...new Set(actual)].sort(), [...tree.map(record => record.path), ...Object.keys(PUBLIC_ENGLISH_NEW_HASHES)].sort(), 'no unreviewed production path is added')
})

test('the existing search form changes only postal display labels, never values, handlers, query state, markup or keyboard behavior', async () => {
  const path = 'components/discovery-search.js'
  assert.equal(publicEnglishSearchSource(await read(path)), git('show', PUBLIC_ENGLISH_BASE + ':' + path))
})
