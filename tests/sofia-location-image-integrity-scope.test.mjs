import { discoveryPerformanceAllowsPath } from './discovery-performance-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }
import subcategoryReceipt from './fixtures/subcategory-photo-disclosure-20261126-approval.json' with { type: 'json' }
import { preSubcategoryDisclosureSource, sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile, sofiaIntegrityPriorSource, subcategoryDisclosureAllowsFileChange } from './sofia-location-image-integrity-20261124-scope.mjs'
import { sofiaRpcPriorSource } from './sofia-location-rpc-isolation-20261125-scope.mjs'
import { posterGlassAllowsFileChange } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryAllowsFileChange } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsFileChange } from './poster-polish-20261126-scope.mjs'
import { serviceDetailPhotoCoverageAllowsPath } from './service-detail-photo-coverage-20261126-scope.mjs'
import { servicePhotoMarkerAllowsFileChange } from './service-photo-marker-20261126-scope.mjs'
import { serviceDetailPhotoExpansionAllowsNewFile } from './service-detail-photo-expansion-20261126-scope.mjs'
import { dialogPrimaryDarkContrastAllowsFileChange } from './dialog-primary-dark-contrast-20261126-scope.mjs'
import { staticWebpCacheCpuAllowsFileChange } from './discovery-static-webp-cache-cpu-scope.mjs'
import { catalogueIntakeAllowsFileChange } from './catalogue-mopart-20261127-scope.mjs'

test('the 24 Nov scope seals only explicitly reviewed Sofia and image files with their prior bytes', async () => {
  const hash = value => createHash('sha256').update(value).digest('hex')
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(hash(sofiaRpcPriorSource(path, preSubcategoryDisclosureSource(path, current))), after, path)
    assert.equal(sofiaIntegrityAllowsFileChange(path), true, path)
    assert.equal(hash(sofiaIntegrityPriorSource(path, current)), before, path)
    const expected = posterPolishAllowsFileChange(path) ? /Unreviewed 26 Nov poster polish/u : catalogueExpiryAllowsFileChange(path) ? /Unreviewed 26 Nov catalogue expiry/u
      : posterGlassAllowsFileChange(path) ? /Unreviewed 26 Nov poster\/glass/u : /Unreviewed (?:24|25) Nov/u
    assert.throws(() => sofiaIntegrityPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), expected)
  }
  for (const path of Object.keys(receipt.added)) assert.equal(sofiaIntegrityAllowsNewFile(path), true, path)
  for (const path of ['package.json', 'next.config.mjs', 'pnpm-lock.yaml', 'lib/booking-engine.mjs', 'lib/discovery/sofia-catalogue.mjs']) {
    assert.equal(Object.hasOwn(receipt.changed, path), false, path)
    assert.equal(Object.hasOwn(receipt.added, path), false, path)
    const laterReceipt = path === 'lib/discovery/sofia-catalogue.mjs' && catalogueIntakeAllowsFileChange(path)
      || path === 'next.config.mjs' && staticWebpCacheCpuAllowsFileChange(path)
    assert.equal(sofiaIntegrityAllowsFileChange(path), laterReceipt, path)
    assert.equal(sofiaIntegrityAllowsNewFile(path), false, path)
  }
})

test('only the two public subcategory navigation views lose the AI display, without changing business photo renderers or media', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const hash = value => createHash('sha256').update(value).digest('hex')
  const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
  const paths = Object.keys(subcategoryReceipt.changed)
  assert.deepEqual(paths, ['components/discovery-subcategories.js', 'components/inline-discovery-summary.js'])
  const changed = git('diff', '--name-only', '--no-renames', '-z', subcategoryReceipt.baseline, '--').toString().split('\0')
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString().split('\0')
  assert.deepEqual([...new Set([...changed, ...untracked])].filter(path => path && path !== 'node_modules'
    && !path.startsWith('tests/') && !discoveryPerformanceAllowsPath(path) && !serviceDetailPhotoCoverageAllowsPath(path) && !servicePhotoMarkerAllowsFileChange(path)
    && !serviceDetailPhotoExpansionAllowsNewFile(path) && !dialogPrimaryDarkContrastAllowsFileChange(path)).sort(), paths)
  for (const [path, { before, after }] of Object.entries(subcategoryReceipt.changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    const original = git('show', subcategoryReceipt.baseline + ':' + path)
    assert.equal(hash(original), before, path)
    assert.equal(hash(current), after, path)
    assert.ok(subcategoryDisclosureAllowsFileChange(path), path)
    assert.deepEqual(preSubcategoryDisclosureSource(path, current), original, path)
    const modified = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(preSubcategoryDisclosureSource(path, modified), modified, 'unreviewed bytes are not normalized')
  }
})
