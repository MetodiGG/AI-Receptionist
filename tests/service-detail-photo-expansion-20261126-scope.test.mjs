import { discoveryPerformanceAllowsPath } from './discovery-performance-scope.mjs'
import { detailPreviewPriorSource } from './public-detail-photo-preview-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-detail-photo-expansion-20261126-approval.json' with { type: 'json' }
import {
  preServiceDetailPhotoExpansionSource, serviceDetailPhotoExpansionAddedPath,
  serviceDetailPhotoExpansionAllowsNewFile, serviceDetailPhotoExpansionAllowsPath,
} from './service-detail-photo-expansion-20261126-scope.mjs'
import { dialogPrimaryDarkContrastAllowsFileChange } from './dialog-primary-dark-contrast-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)

test('the additional service artwork changes only the reviewed detail resolver, variants and new service-only media', async () => {
  assert.equal(receipt.baseline, '38e2278a34a0710b1f18dd79cae609fa3b5ca57d')
  assert.deepEqual(Object.keys(receipt.changed), ['lib/service-detail-photo-presentation.mjs', 'lib/service-detail-photo-variants.mjs'])
  const additions = Object.keys(receipt.added)
  for (const path of [
    'lib/service-detail-photo-expansion-20261126.json',
    'docs/service-detail-photo-beauty-20261126.json',
    'docs/service-detail-photo-auto-home-20261126.json',
    'docs/service-detail-photo-activity-education-20261126.json',
  ]) assert.ok(additions.includes(path), path)
  assert.ok(additions.some(path => path.startsWith('public/service-photos/')), 'new authorized image bytes must be present')
  const changed = split(git('diff', '--no-renames', '--name-only', '-z', receipt.baseline, '--'))
  const untracked = split(git('ls-files', '--others', '--exclude-standard', '-z'))
  const actual = [...new Set([...changed, ...untracked])].filter(path => path !== 'node_modules' &&
    !path.startsWith('tests/') && (Object.hasOwn(receipt.changed, path) || !discoveryPerformanceAllowsPath(path)) && !dialogPrimaryDarkContrastAllowsFileChange(path))
  assert.deepEqual(actual.sort(), [...Object.keys(receipt.changed), ...additions].sort())
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = detailPreviewPriorSource(path, await readFile(new URL('../' + path, import.meta.url)))
    const original = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.ok(after && after !== before, path)
    assert.equal(sha(current), after, path)
    assert.ok(serviceDetailPhotoExpansionAllowsPath(path), path)
    assert.deepEqual(preServiceDetailPhotoExpansionSource(path, current), original, path)
    assert.equal(preServiceDetailPhotoExpansionSource(path, current.toString('utf8')), original.toString('utf8'), path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(preServiceDetailPhotoExpansionSource(path, tampered), tampered, path)
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    assert.ok(serviceDetailPhotoExpansionAddedPath(path), path)
    assert.equal(sha(await readFile(new URL('../' + path, import.meta.url))), hash, path)
    assert.ok(serviceDetailPhotoExpansionAllowsNewFile(path), path)
    assert.deepEqual(split(git('ls-tree', '--name-only', '-r', '-z', receipt.baseline, '--', path)), [], path)
  }
  for (const path of ['components/business-cover-photo.js', 'components/service-thumbnail.js', 'app/service-thumbnail.css',
    'lib/discovery/subcategories.mjs', 'public/service-photos/go-detail-dental-exam-20261126-v1.webp', 'lib/booking-engine.mjs']) {
    assert.equal(serviceDetailPhotoExpansionAllowsPath(path), false, path)
  }
})
