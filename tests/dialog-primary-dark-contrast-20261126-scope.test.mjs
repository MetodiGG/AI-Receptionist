import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/dialog-primary-dark-contrast-20261126-approval.json' with { type: 'json' }
import { dialogPrimaryDarkContrastAllowsFileChange, preDialogPrimaryDarkContrastSource } from './dialog-primary-dark-contrast-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)

test('dark detail links retain their general accent except the primary booking action which keeps its own ink', async () => {
  assert.equal(receipt.baseline, 'b70918e442401daa721ac8cfebd8dd38488ac2c1')
  assert.equal(receipt.path, 'app/dark-mode.css')
  const changed = split(git('diff', '--no-renames', '--name-only', '-z', receipt.baseline, '--'))
  const untracked = split(git('ls-files', '--others', '--exclude-standard', '-z'))
  const actual = [...new Set([...changed, ...untracked])].filter(path => path !== 'node_modules' && !path.startsWith('tests/'))
  assert.deepEqual(actual, [receipt.path])

  const current = await readFile(new URL('../' + receipt.path, import.meta.url))
  const original = git('show', receipt.baseline + ':' + receipt.path)
  assert.equal(sha(original), receipt.before)
  assert.ok(receipt.after && receipt.after !== receipt.before)
  assert.equal(sha(current), receipt.after)
  const oldSelector = '.discovery-business-details a,'
  const newSelector = '.discovery-business-details a:not(:where([data-public-action="primary"])),'
  const previousCss = original.toString('utf8')
  assert.equal(previousCss.split(oldSelector).length, 2, 'only the known broad selector is replaced')
  assert.equal(current.toString('utf8'), previousCss.replace(oldSelector, newSelector), 'all declarations and unrelated links remain unchanged')
  assert.equal(dialogPrimaryDarkContrastAllowsFileChange(receipt.path), true)
  assert.deepEqual(preDialogPrimaryDarkContrastSource(receipt.path, current), original)
  assert.equal(preDialogPrimaryDarkContrastSource(receipt.path, current.toString('utf8')), previousCss)
  const tampered = Buffer.concat([current, Buffer.from('\n')])
  assert.equal(preDialogPrimaryDarkContrastSource(receipt.path, tampered), tampered)
  for (const path of ['components/public-action.js', 'components/public-action.module.css', 'components/discovery-business-details.js',
    'app/service-thumbnail.css', 'lib/booking-engine.mjs']) assert.equal(dialogPrimaryDarkContrastAllowsFileChange(path), false)
})
