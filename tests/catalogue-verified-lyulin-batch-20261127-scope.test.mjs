import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import prior from './fixtures/catalogue-mopart-20261127-approval.json' with { type: 'json' }
import receipt from './fixtures/catalogue-verified-lyulin-batch-20261127.json' with { type: 'json' }
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { verifiedLyulinBatchAllowsFileChange, verifiedLyulinBatchAllowsNewFile, verifiedLyulinBatchAllowsPath, verifiedLyulinBatchPriorCatalogue, verifiedLyulinBatchPriorSource } from './catalogue-verified-lyulin-batch-20261127-scope.mjs'
import { crossQuarterAllowsNewFile, crossQuarterPriorSource } from './catalogue-verified-sofia-cross-quarter-20261127-scope.mjs'
import { nearbyAddressReviewAllowsNewFile, nearbyAddressReviewPriorSource } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const asPaths = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const changed = [
  'lib/catalogue-service-photo-keys.mjs',
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
  'lib/discovery/sofia-catalogue.mjs',
  'lib/locale/service-english.json',
]
const added = [
  'docs/catalogue-coverage/verified-lyulin-batch-20261127.json',
  'lib/discovery/catalogue-data/neighborhood-verified-lyulin-batch-20261127.mjs',
]

test('the verified Lyulin batch seals exactly its six catalogue paths before normalizing older approvals', () => {
  assert.equal(receipt.baseline, 'de3e0724cdd111a0b0ac57aaf911624d1b2071bb')
  assert.deepEqual(Object.keys(receipt.changed).sort(), changed)
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const actual = [...new Set([
    ...asPaths(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...asPaths(git('ls-files', '--others', '--exclude-standard', '-z')),
  ])].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !crossQuarterAllowsNewFile(path) &&
    !nearbyAddressReviewAllowsNewFile(path)).sort()
  assert.deepEqual(actual, [...changed, ...added].sort())
  for (const path of changed) {
    const actual = readFileSync(new URL(path, cwd))
    const current = crossQuarterPriorSource(path, nearbyAddressReviewPriorSource(path, actual))
    const preBatch = git('show', receipt.baseline + ':' + path)
    const preMopart = git('show', prior.baseline + ':' + path)
    const { before, after } = receipt.changed[path]
    assert.notEqual(before, after, path)
    assert.equal(before, prior.changed[path].after, path)
    assert.equal(sha(current), after, path)
    assert.equal(verifiedLyulinBatchAllowsFileChange(path), sha(actual) === after, path)
    assert.equal(verifiedLyulinBatchAllowsNewFile(path), false, path)
    assert.deepEqual(verifiedLyulinBatchPriorSource(path, current), preBatch, path)
    assert.deepEqual(catalogueIntakePriorSource(path, actual), preMopart, path)
    const tampered = Buffer.concat([actual, Buffer.from('\n')])
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(asPaths(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [], path)
    assert.ok(verifiedLyulinBatchAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(verifiedLyulinBatchAllowsFileChange(path), false, path)
  }
  for (const path of ['app/layout.js', 'lib/booking-engine.mjs', 'package.json', 'public/logo.svg', 'supabase/config.toml']) {
    assert.equal(verifiedLyulinBatchAllowsPath(path), false, path)
    assert.equal(catalogueIntakeAllowsPath(path), false, path)
    assert.equal(catalogueIntakePriorSource(path, 'unrelated bytes'), 'unrelated bytes', path)
  }
})

test('new row identities must match exactly before hiding them from historical snapshots', () => {
  const ids = receipt.records.map(row => row.id)
  assert.ok(ids.length >= 2)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(ids.every(id => /^sofia-[a-z0-9-]+$/u.test(id) && id !== prior.record.id))
  const rows = SOFIA_CATALOGUE.filter(row => ids.includes(row.id))
  assert.deepEqual(rows.map(row => row.id).sort(), [...ids].sort())
  assert.deepEqual(verifiedLyulinBatchPriorCatalogue(rows), [])
  assert.throws(() => verifiedLyulinBatchPriorCatalogue([...rows, rows[0]]), /Duplicate verified Lyulin batch record/u)
  for (const row of rows) {
    assert.equal(sha(JSON.stringify(row)), receipt.records.find(item => item.id === row.id).sha256)
    assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'А' }]), /Unreviewed verified Lyulin batch record/u)
  }
  const mopart = SOFIA_CATALOGUE.find(row => row.id === prior.record.id)
  const original = SOFIA_CATALOGUE.find(row => !ids.includes(row.id) && row.id !== prior.record.id)
  assert.deepEqual(verifiedLyulinBatchPriorCatalogue([original, ...rows, mopart]), [original, mopart])
  assert.deepEqual(catalogueIntakePriorCatalogue([original, ...rows, mopart]), [original])
})
