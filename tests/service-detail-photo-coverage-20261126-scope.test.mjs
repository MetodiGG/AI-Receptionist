import { discoveryPerformanceAllowsPath, discoveryPerformancePriorSource } from './discovery-performance-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-detail-photo-coverage-20261126-approval.json' with { type: 'json' }
import {
  preServiceDetailPhotoCoverageSource, serviceDetailPhotoAddedPath, serviceDetailPhotoChangedPath,
  serviceDetailPhotoCoverageAllowsFileChange, serviceDetailPhotoCoverageAllowsNewFile, serviceDetailPhotoCoverageAllowsPath,
} from './service-detail-photo-coverage-20261126-scope.mjs'
import { preServicePhotoMarkerSource, servicePhotoMarkerAllowsFileChange } from './service-photo-marker-20261126-scope.mjs'
import { preServiceDetailPhotoExpansionSource, serviceDetailPhotoExpansionAllowsNewFile } from './service-detail-photo-expansion-20261126-scope.mjs'
import { dialogPrimaryDarkContrastAllowsFileChange } from './dialog-primary-dark-contrast-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const operational = path => path !== 'node_modules' && !path.startsWith('tests/')

test('detail-photo changes cannot alter category, subcategory or business covers, booking, or existing media', async () => {
  assert.equal(receipt.baseline, '58ca84d772d238ff85af67ae7fc45735a6c9c37f')
  assert.deepEqual(Object.keys(receipt.changed), ['components/service-thumbnail.js'])
  const changed = split(git('diff', '--no-renames', '--name-only', '-z', receipt.baseline, '--'))
  const untracked = split(git('ls-files', '--others', '--exclude-standard', '-z'))
  const actual = [...new Set([...changed, ...untracked])].filter(path => operational(path) && (Object.hasOwn(receipt.changed, path) || Object.hasOwn(receipt.added, path) || !discoveryPerformanceAllowsPath(path))
    && !serviceDetailPhotoExpansionAllowsNewFile(path) && !dialogPrimaryDarkContrastAllowsFileChange(path)
    && (serviceDetailPhotoChangedPath(path) || !servicePhotoMarkerAllowsFileChange(path))).sort()
  const reviewed = [...Object.keys(receipt.changed).filter(path => receipt.changed[path].after !== null), ...Object.keys(receipt.added)]
  assert.deepEqual(actual, reviewed.sort(), 'runtime changes must have independent SHA-256 review evidence')

  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    assert.ok(serviceDetailPhotoChangedPath(path), path)
    const baseline = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(baseline), before, path)
    if (after === null) {
      assert.equal(serviceDetailPhotoCoverageAllowsFileChange(path), false, 'an unfilled receipt never authorizes edits')
      continue
    }
    const current = discoveryPerformancePriorSource(path, await readFile(new URL('../' + path, import.meta.url)))
    assert.equal(sha(preServicePhotoMarkerSource(path, current)), after, path)
    assert.notEqual(before, after, path)
    assert.ok(serviceDetailPhotoCoverageAllowsPath(path), path)
    assert.deepEqual(preServiceDetailPhotoCoverageSource(path, current), baseline, path)
    assert.equal(preServiceDetailPhotoCoverageSource(path, current.toString('utf8')), baseline.toString('utf8'), path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(preServiceDetailPhotoCoverageSource(path, tampered), tampered, 'unreviewed source is not normalized')
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    assert.ok(serviceDetailPhotoAddedPath(path), path)
    const source = preServiceDetailPhotoExpansionSource(path, await readFile(new URL('../' + path, import.meta.url)))
    assert.equal(sha(source), hash, path)
    assert.ok(serviceDetailPhotoCoverageAllowsNewFile(path), path)
    const baseline = split(git('ls-tree', '--name-only', '-r', '-z', receipt.baseline, '--', path))
    assert.deepEqual(baseline, [], path + ' must be a new path')
  }
  for (const path of ['components/discovery-subcategories.js', 'lib/business-cover-photo.mjs',
    'public/category-photos/hair-v2.webp', 'public/service-photos/gel-manicure-v1.webp', 'lib/booking-engine.mjs']) {
    assert.equal(serviceDetailPhotoCoverageAllowsPath(path), false, path)
  }
})
