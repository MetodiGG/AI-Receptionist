import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, lstat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-expiry-20261126-approval.json' with { type: 'json' }
import { posterGlassAllowsFileChange } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryAllowsFileChange, catalogueExpiryAllowsNewFile, catalogueExpiryMatchesPriorHash, catalogueExpiryPriorSource } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsFileChange, posterPolishAllowsNewFile } from './poster-polish-20261126-scope.mjs'
import { subcategoryDisclosureAllowsFileChange } from './sofia-location-image-integrity-20261124-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })

test('the standing expiry policy authorizes exactly its eight current paths and one new operational file', async () => {
  assert.equal(receipt.baseline, '90ecc8ea7fd74517f2c956ef93269072039f9995')
  const changedPaths = Object.keys(receipt.changed), addedPaths = Object.keys(receipt.added)
  assert.deepEqual(changedPaths, [
    'AGENTS.md',
    'README.md',
    'lib/discovery/business-details.mjs',
    'lib/discovery/catalogue-policy.mjs',
    'lib/discovery/catalogue-search.mjs',
    'lib/discovery/public-details.mjs',
    'scripts/check-catalogue-pricing.mjs',
    'scripts/check-sofia-catalogue.mjs',
  ])
  assert.deepEqual(addedPaths, ['lib/discovery/catalogue-expired-offer-holds.mjs'])
  const changed = git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--').toString('utf8').split('\0').filter(Boolean)
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString('utf8').split('\0').filter(Boolean)
  const runtimePaths = [...new Set([...changed, ...untracked])].filter(path => path !== 'node_modules' && !path.startsWith('tests/')
    && !subcategoryDisclosureAllowsFileChange(path)
    && !posterGlassAllowsFileChange(path) && !posterPolishAllowsFileChange(path) && !posterPolishAllowsNewFile(path))
  assert.deepEqual(runtimePaths.sort(), [...changedPaths, ...addedPaths].sort())
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    const original = git('show', receipt.baseline + ':' + path)
    assert.notEqual(before, after, path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.equal(catalogueExpiryAllowsFileChange(path), true, path)
    assert.equal(catalogueExpiryAllowsNewFile(path), false, path)
    assert.equal(catalogueExpiryMatchesPriorHash(path, before), true, path)
    assert.equal(catalogueExpiryMatchesPriorHash(path, after), false, path)
    assert.deepEqual(catalogueExpiryPriorSource(path, current), original, path)
    assert.equal(catalogueExpiryPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.deepEqual(catalogueExpiryPriorSource(path, original), original, path)
    assert.throws(() => catalogueExpiryPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), /Unreviewed 26 Nov catalogue expiry/u)
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    const url = new URL('../' + path, import.meta.url), stat = await lstat(url)
    assert.ok(stat.isFile() && !(stat.mode & 0o111), path)
    assert.equal(sha(await readFile(url)), hash, path)
    assert.equal(catalogueExpiryAllowsNewFile(path), true, path)
    assert.equal(catalogueExpiryAllowsFileChange(path), false, path)
  }
  for (const path of ['package.json', 'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/catalogue-pricing-review.mjs',
    'lib/discovery/catalogue-data/neighborhood-sport-west-20261111.mjs', 'lib/booking-engine.mjs', 'components/public-action.js']) {
    assert.equal(catalogueExpiryAllowsFileChange(path), false, path)
    assert.equal(catalogueExpiryAllowsNewFile(path), false, path)
    assert.equal(catalogueExpiryMatchesPriorHash(path, receipt.changed[changedPaths[0]].before), false, path)
    const untouched = Buffer.from('unrelated')
    assert.equal(catalogueExpiryPriorSource(path, untouched), untouched, path)
  }
})
