import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/discovery-performance-approval.json' with { type: 'json' }
import { discoveryPerformanceAllowsPath, discoveryPerformancePriorSource } from './discovery-performance-scope.mjs'
import { detailPreviewAllowsPath } from './public-detail-photo-preview-scope.mjs'
import { preparedPhotosAllowsPath } from './mobile-details-prepared-photos-scope.mjs'

test('the performance patch does not change booking, settings, catalogue records or original photography', async () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd })
  const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
  const expected = [
    'app/inline-discovery-panel.css', 'app/inline-discovery.css', 'components/business-cover-photo.js',
    'components/discovery-search.js', 'components/inline-discovery-panel.js', 'components/marketing-navigation.js',
    'components/public-action.module.css', 'lib/discovery-photo-cover-owners.json', 'lib/discovery-photo-presentation.mjs',
    'lib/discovery/catalogue-search.mjs', 'lib/public-action-motion.mjs', 'lib/public-business-cover-photo.mjs',
  ].sort()
  assert.deepEqual([...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort(), expected)
  const paths = new Set([...split(git('diff', '--name-only', '-z', receipt.baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...paths].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && (expected.includes(path) || (!detailPreviewAllowsPath(path) && !preparedPhotosAllowsPath(path)))).sort(), expected)
  for (const path of expected) assert.ok(discoveryPerformanceAllowsPath(path), path)
  for (const path of [...Object.keys(receipt.changed), ...Object.keys(receipt.adapters)]) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    assert.deepEqual(discoveryPerformancePriorSource(path, current), git('show', receipt.baseline + ':' + path))
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(discoveryPerformancePriorSource(path, tampered), tampered)
  }
})
