import { discoveryPerformanceAllowsPath } from './discovery-performance-scope.mjs'
import { detailPreviewPriorSource } from './public-detail-photo-preview-scope.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/service-photo-marker-20261126-approval.json' with { type: 'json' }
import { preServicePhotoMarkerSource, servicePhotoMarkerAllowsFileChange } from './service-photo-marker-20261126-scope.mjs'
import { serviceDetailPhotoExpansionAllowsPath } from './service-detail-photo-expansion-20261126-scope.mjs'
import { dialogPrimaryDarkContrastAllowsFileChange } from './dialog-primary-dark-contrast-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)

test('only the service-photo component and its own stylesheet change for the compact AI marker', async () => {
  assert.equal(receipt.baseline, '3ba08bb076a5243752257233b3107af051baa5d4')
  const paths = Object.keys(receipt.changed)
  assert.deepEqual(paths, ['app/service-thumbnail.css', 'components/service-thumbnail.js'])
  const changed = split(git('diff', '--no-renames', '--name-only', '-z', receipt.baseline, '--'))
  const untracked = split(git('ls-files', '--others', '--exclude-standard', '-z'))
  const actual = [...new Set([...changed, ...untracked])].filter(path => path !== 'node_modules' &&
    !path.startsWith('tests/') && (paths.includes(path) || !discoveryPerformanceAllowsPath(path)) && !serviceDetailPhotoExpansionAllowsPath(path) && !dialogPrimaryDarkContrastAllowsFileChange(path))
  assert.deepEqual(actual.sort(), paths)
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = detailPreviewPriorSource(path, await readFile(new URL('../' + path, import.meta.url)))
    const original = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.ok(after && after !== before, path)
    assert.equal(sha(current), after, path)
    assert.equal(servicePhotoMarkerAllowsFileChange(path), true, path)
    assert.deepEqual(preServicePhotoMarkerSource(path, current), original, path)
    assert.equal(preServicePhotoMarkerSource(path, current.toString('utf8')), original.toString('utf8'), path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(preServicePhotoMarkerSource(path, tampered), tampered, path)
  }
  for (const path of ['components/business-cover-photo.js', 'components/public-service-menu.js',
    'components/discovery-subcategories.js', 'lib/service-detail-photo-presentation.mjs', 'lib/booking-engine.mjs']) {
    assert.equal(servicePhotoMarkerAllowsFileChange(path), false, path)
  }
})
