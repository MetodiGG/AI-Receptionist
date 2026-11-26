import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/poster-polish-20261126-approval.json' with { type: 'json' }
import { posterPolishAllowsFileChange, posterPolishAllowsNewFile, posterPolishPriorSource } from './poster-polish-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url))

test('poster polish does not alter booking, catalogue data, assets, APIs, or deployment settings', async () => {
  assert.equal(receipt.baseline, '3aad461166534fe2b73492359fa878ec4da033e5')
  const changed = git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--').toString().split('\0')
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString().split('\0')
  const sourcePaths = [...new Set([...changed, ...untracked])].filter(p => p && p !== 'node_modules' && !p.startsWith('tests/')).sort()
  assert.deepEqual(sourcePaths, [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const bytes = await read(path), original = git('show', `${receipt.baseline}:${path}`)
    assert.equal(hash(bytes), after, path)
    assert.equal(hash(original), before, path)
    assert.notEqual(before, after, path)
    assert.ok(posterPolishAllowsFileChange(path), path)
    assert.deepEqual(posterPolishPriorSource(path, bytes), original, path)
    assert.throws(() => posterPolishPriorSource(path, Buffer.concat([bytes, Buffer.from('\n')])), /Unreviewed 26 Nov poster polish/u)
  }
  for (const [path, expected] of Object.entries(receipt.added)) {
    assert.equal(hash(await read(path)), expected, path)
    assert.ok(posterPolishAllowsNewFile(path), path)
  }
})
