import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstat, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/public-first-load-optimization-approval.json' with { type: 'json' }
import { publicFirstLoadAllowsFileChange, publicFirstLoadPriorSource } from './public-first-load-optimization-scope.mjs'
import { locationActionFitAllowsFileChange } from './public-location-action-fit-scope.mjs'
import { approvedCatalogueMatches } from './catalogue-only-release-scope.mjs'

test('only image scheduling and native discovery reads change; no new production file, setting, data, design or booking files', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd: root })
  const sha = bytes => createHash('sha256').update(bytes).digest('hex')
  const paths = bytes => bytes.toString('utf8').split('\0').filter(path => path && path !== 'node_modules' && !path.startsWith('tests/'))
  const expected = ['components/inline-category-grid.js', 'lib/discovery/internal-search.mjs', 'lib/discovery/public-search-inventory.mjs']
  assert.equal(receipt.baseline, 'f6b09ae2e93a866f08b34848a49d81dcb7533d84')
  assert.deepEqual(Object.keys(receipt.changed), expected)
  const actual = [...new Set([...paths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...paths(git('ls-files', '--others', '--exclude-standard', '-z'))])].filter(path =>
      expected.includes(path) || (!locationActionFitAllowsFileChange(path) && !approvedCatalogueMatches(path))).sort()
  assert.deepEqual(actual, expected)
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const url = new URL('../' + path, import.meta.url), stat = await lstat(url)
    assert.ok(stat.isFile() && !(stat.mode & 0o111), path)
    const current = await readFile(url), original = git('show', receipt.baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.notEqual(before, after, path)
    assert.equal(publicFirstLoadAllowsFileChange(path), true, path)
    assert.deepEqual(publicFirstLoadPriorSource(path, current), original, path)
    assert.equal(publicFirstLoadPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(publicFirstLoadPriorSource(path, tampered), tampered, path)
  }
})
