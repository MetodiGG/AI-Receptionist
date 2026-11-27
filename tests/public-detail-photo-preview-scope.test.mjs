import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import receipt from './fixtures/public-detail-photo-preview-approval.json' with { type: 'json' }
import { detailPreviewAllowsPath, detailPreviewPriorSource } from './public-detail-photo-preview-scope.mjs'
import { mopartIntakeAllowsPath } from './catalogue-mopart-20261127-scope.mjs'

test('the detail image and preview update leaves catalogue data, booking, calendars and existing assets unchanged', async () => {
  const cwd = fileURLToPath(new URL('../', import.meta.url))
  const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
  const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
  const runtime = [...new Set([...split(git('diff', '--name-only', '-z', receipt.baseline, '--')), ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])]
    .filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !mopartIntakeAllowsPath(path)).sort()
  assert.deepEqual(runtime, [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const path of runtime) {
    assert.ok(detailPreviewAllowsPath(path), path)
    assert.doesNotMatch(path, /booking|calendar|catalogue-data|^supabase\//u)
  }
  for (const path of Object.keys(receipt.changed)) {
    const bytes = await readFile(new URL('../' + path, import.meta.url))
    assert.deepEqual(detailPreviewPriorSource(path, bytes), git('show', receipt.baseline + ':' + path))
    const tampered = Buffer.concat([bytes, Buffer.from('\n')])
    assert.equal(detailPreviewPriorSource(path, tampered), tampered)
  }
})
