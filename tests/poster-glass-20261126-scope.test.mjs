import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/poster-glass-20261126-approval.json' with { type: 'json' }
import { posterGlassAllowsFileChange, posterGlassMatchesPriorHash, posterGlassPriorSource } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryAllowsFileChange, catalogueExpiryAllowsNewFile } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsFileChange, posterPolishAllowsNewFile, posterPolishPriorSource } from './poster-polish-20261126-scope.mjs'
import { subcategoryDisclosureAllowsFileChange } from './sofia-location-image-integrity-20261124-scope.mjs'
import { serviceDetailPhotoCoverageAllowsPath } from './service-detail-photo-coverage-20261126-scope.mjs'
import { servicePhotoMarkerAllowsFileChange } from './service-photo-marker-20261126-scope.mjs'
import { serviceDetailPhotoExpansionAllowsNewFile } from './service-detail-photo-expansion-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })

test('poster, glass and the AI marker change only four presentation paths from the pinned production source', async () => {
  assert.equal(receipt.baseline, '90ecc8ea7fd74517f2c956ef93269072039f9995')
  const paths = Object.keys(receipt.changed)
  assert.deepEqual(paths, [
    'app/premium-discovery-cards.css',
    'components/business-cover-photo.js',
    'components/discovery-business-card.js',
    'components/public-action.module.css',
  ])
  const changed = git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--').toString('utf8').split('\0').filter(Boolean)
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString('utf8').split('\0').filter(Boolean)
  const runtimePaths = [...new Set([...changed, ...untracked])].filter(path => path !== 'node_modules' && !path.startsWith('tests/')
    && !subcategoryDisclosureAllowsFileChange(path) && !serviceDetailPhotoCoverageAllowsPath(path) && !servicePhotoMarkerAllowsFileChange(path)
    && !serviceDetailPhotoExpansionAllowsNewFile(path)
    && !catalogueExpiryAllowsFileChange(path) && !catalogueExpiryAllowsNewFile(path)
    && (paths.includes(path) || (!posterPolishAllowsFileChange(path) && !posterPolishAllowsNewFile(path))))
  assert.deepEqual(runtimePaths.sort(), paths)
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = posterPolishPriorSource(path, await readFile(new URL('../' + path, import.meta.url)))
    const original = git('show', receipt.baseline + ':' + path)
    assert.notEqual(before, after, path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.equal(posterGlassAllowsFileChange(path), true, path)
    assert.equal(posterGlassMatchesPriorHash(path, before), true, path)
    assert.equal(posterGlassMatchesPriorHash(path, after), false, path)
    assert.deepEqual(posterGlassPriorSource(path, current), original, path)
    assert.equal(posterGlassPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.deepEqual(posterGlassPriorSource(path, original), original, path)
    assert.throws(() => posterGlassPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), /Unreviewed 26 Nov poster\/glass/u)
  }
  for (const path of ['package.json', 'scripts/check-catalogue-pricing.mjs', 'lib/discovery/sofia-catalogue.mjs', 'lib/booking-engine.mjs', 'components/public-action.js']) {
    assert.equal(posterGlassAllowsFileChange(path), false, path)
    assert.equal(posterGlassMatchesPriorHash(path, receipt.changed[paths[0]].before), false, path)
    const untouched = Buffer.from('unrelated')
    assert.equal(posterGlassPriorSource(path, untouched), untouched, path)
  }
})
