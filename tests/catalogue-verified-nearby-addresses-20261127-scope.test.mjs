import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import manifest from '../docs/catalogue-coverage/verified-nearby-addresses-20261127.json' with { type: 'json' }
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { crossQuarterAllowsFileChange } from './catalogue-verified-sofia-cross-quarter-20261127-scope.mjs'
import { nearbyAddressReviewAllowsFileChange, nearbyAddressReviewAllowsNewFile, nearbyAddressReviewAllowsPath, nearbyAddressReviewPriorSource,
  nearbyAddressReviewPriorCatalogue } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'
import prior from './fixtures/catalogue-verified-sofia-cross-quarter-20261127.json' with { type: 'json' }
import receipt from './fixtures/catalogue-verified-nearby-addresses-20261127.json' with { type: 'json' }

const cwd = new URL('../', import.meta.url), cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const added = [
  'docs/catalogue-coverage/verified-nearby-addresses-20261127.json',
  'lib/discovery/catalogue-data/sofia-address-points-nov27.mjs',
]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const hashRow = row => sha(JSON.stringify(row))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const priorCatalogueDigest = '3b3a8529f71b21fc2e641084b3df5471493c7408a13f6657e095a2768eb3b2fd'

test('nearby review seals only exact location source paths and preserves the previous file receipt', () => {
  assert.equal(receipt.baseline, '7030fa84dbb46ad1dc75be00c0373b6fa22593be')
  assert.deepEqual(Object.keys(receipt.changed), [cataloguePath])
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const actual = [...new Set([
    ...split(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z')),
  ])].filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort()
  assert.deepEqual(actual, [...added, cataloguePath].sort())
  const current = readFileSync(new URL(cataloguePath, cwd))
  const original = git('show', receipt.baseline + ':' + cataloguePath)
  assert.equal(sha(original), prior.changed[cataloguePath].after)
  assert.equal(sha(original), receipt.changed[cataloguePath].before)
  assert.equal(sha(current), receipt.changed[cataloguePath].after)
  assert.notEqual(sha(current), sha(original))
  assert.ok(nearbyAddressReviewAllowsFileChange(cataloguePath) && catalogueIntakeAllowsPath(cataloguePath))
  assert.equal(crossQuarterAllowsFileChange(cataloguePath), false)
  assert.deepEqual(nearbyAddressReviewPriorSource(cataloguePath, current), original)
  const tampered = Buffer.concat([current, Buffer.from('\n')])
  assert.equal(nearbyAddressReviewPriorSource(cataloguePath, tampered), tampered)
  assert.equal(catalogueIntakePriorSource(cataloguePath, tampered), tampered)
  for (const path of added) {
    assert.deepEqual(split(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [])
    assert.ok(nearbyAddressReviewAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(nearbyAddressReviewAllowsFileChange(path), false, path)
  }
  for (const path of ['lib/discovery/catalogue-policy.mjs', 'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
    'lib/booking-engine.mjs', 'lib/locale/service-english.json', 'app/layout.js', 'package.json', 'supabase/config.toml']) {
    assert.equal(nearbyAddressReviewAllowsPath(path), false, path)
  }
})

test('only approved address fields change and every previous effective and raw row is restored in order', () => {
  const approvedIds = receipt.records.map(row => row.id).sort()
  assert.ok(approvedIds.length)
  assert.deepEqual(manifest.verified.map(row => row.id).sort(), approvedIds)
  for (const catalogue of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE]) {
    const matched = catalogue.filter(row => approvedIds.includes(row.id))
    assert.deepEqual(matched.map(row => row.id).sort(), approvedIds)
    const previous = nearbyAddressReviewPriorCatalogue(catalogue)
    assert.equal(hashRow(previous), priorCatalogueDigest)
    assert.equal(previous.length, catalogue.length)
    for (const [index, row] of catalogue.entries()) {
      const record = receipt.records.find(item => item.id === row.id)
      if (!record) {
        assert.equal(previous[index], row, row.id)
        continue
      }
      const original = previous[index]
      assert.equal(hashRow(row), record.after, row.id)
      assert.equal(hashRow(original), record.before, row.id)
      const revisedFields = Object.keys(row).filter(key => !isDeepStrictEqual(row[key], original[key])).sort()
      assert.deepEqual(revisedFields, Object.keys(record.previous).sort(), row.id)
      assert.equal(original.services, row.services)
      assert.equal(original.booking, row.booking)
      assert.equal(original.verification, row.verification)
      assert.equal(nearbyAddressReviewPriorCatalogue([original])[0], original)
      assert.throws(() => nearbyAddressReviewPriorCatalogue([row, row]), /Duplicate verified nearby address record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'A' }]), /Unreviewed verified nearby address record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, services: [] }]), /Unreviewed verified nearby address record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, booking: { ...row.booking, extra: 'not approved' } }]),
        /Unreviewed verified nearby address record/u)
    }
  }
})
