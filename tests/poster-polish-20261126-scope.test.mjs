import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/poster-polish-20261126-approval.json' with { type: 'json' }
import priceReceipt from './fixtures/discovery-price-23px-20261126-approval.json' with { type: 'json' }
import { posterPolishAllowsFileChange, posterPolishAllowsNewFile, posterPolishPriorSource, prePriceTypographySource } from './poster-polish-20261126-scope.mjs'
import { subcategoryDisclosureAllowsFileChange } from './sofia-location-image-integrity-20261124-scope.mjs'
import { preServiceDetailPhotoCoverageSource, serviceDetailPhotoCoverageAllowsNewFile, serviceDetailPhotoCoverageAllowsPath } from './service-detail-photo-coverage-20261126-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url))

test('poster polish does not alter booking, catalogue data, assets, APIs, or deployment settings', async () => {
  assert.equal(receipt.baseline, '3aad461166534fe2b73492359fa878ec4da033e5')
  const changed = git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--').toString().split('\0')
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString().split('\0')
  const sourcePaths = [...new Set([...changed, ...untracked])].filter(p => p && p !== 'node_modules' && !p.startsWith('tests/')
    && !subcategoryDisclosureAllowsFileChange(p) && !serviceDetailPhotoCoverageAllowsNewFile(p)).sort()
  assert.deepEqual(sourcePaths, [...Object.keys(receipt.changed), ...Object.keys(receipt.added)].sort())
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const bytes = await read(path), original = git('show', `${receipt.baseline}:${path}`)
    assert.equal(hash(prePriceTypographySource(path, preServiceDetailPhotoCoverageSource(path, bytes))), after, path)
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

test('the 23px price choice changes only the existing preview price style', async () => {
  const { baseline, path, before, after } = priceReceipt
  assert.equal(path, 'app/premium-discovery-cards.css')
  const inventory = git('diff', '--name-only', '--no-renames', '-z', baseline, '--').toString().split('\0')
  const untracked = git('ls-files', '--others', '--exclude-standard', '-z').toString().split('\0')
  const sourcePaths = [...new Set([...inventory, ...untracked])].filter(p => p && p !== 'node_modules' && !p.startsWith('tests/')
    && !subcategoryDisclosureAllowsFileChange(p) && !serviceDetailPhotoCoverageAllowsPath(p)).sort()
  assert.deepEqual(sourcePaths, [path])
  const current = await read(path), original = git('show', baseline + ':' + path)
  assert.equal(hash(original), before)
  assert.equal(hash(current), after)
  assert.deepEqual(prePriceTypographySource(path, current), original)
  const style = /\.home-business-preview-price \{[^}]+\}/u
  assert.equal(current.toString().replace(style, ''), original.toString().replace(style, ''), 'the remaining stylesheet is unchanged')
})
