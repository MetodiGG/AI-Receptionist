import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import priorLyulin from './fixtures/catalogue-verified-lyulin-batch-20261127.json' with { type: 'json' }
import priorMopart from './fixtures/catalogue-mopart-20261127-approval.json' with { type: 'json' }
import receipt from './fixtures/catalogue-verified-sofia-cross-quarter-20261127.json' with { type: 'json' }
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { crossQuarterAllowsFileChange, crossQuarterAllowsNewFile, crossQuarterAllowsPath, crossQuarterPriorSource, crossQuarterPriorCatalogue } from './catalogue-verified-sofia-cross-quarter-20261127-scope.mjs'
import { nearbyAddressReviewAllowsNewFile, nearbyAddressReviewPriorSource } from './catalogue-verified-nearby-addresses-20261127-scope.mjs'
import { appointmentGrowthAllowsFileChange, appointmentGrowthAllowsNewFile, appointmentGrowthPriorSource } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const changed = [
  'lib/catalogue-service-photo-keys.mjs',
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
  'lib/discovery/sofia-catalogue.mjs',
  'lib/locale/service-english.json',
]
const added = [
  'docs/catalogue-coverage/verified-sofia-cross-quarter-20261127.json',
  'lib/discovery/catalogue-data/neighborhood-verified-sofia-cross-quarter-20261127.mjs',
]
const ids = [
  'sofia-as-vavilon-vrabnitsa2-block632d',
  'sofia-best-moments-photography-lyulin6-block641',
  'sofia-bs-wrap-studio-studentski-stranski3b',
]

test('the latest intake seals only its six catalogue paths and restores both earlier receipts exactly', () => {
  assert.equal(receipt.baseline, '2e02e5bd7f00e549231799c5df0a76079da606d0')
  assert.deepEqual(Object.keys(receipt.changed).sort(), changed)
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const actual = [...new Set([
    ...split(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z')),
  ])].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !nearbyAddressReviewAllowsNewFile(path) &&
    !appointmentGrowthAllowsNewFile(path) && (changed.includes(path) || !appointmentGrowthAllowsFileChange(path))).sort()
  assert.deepEqual(actual, [...changed, ...added].sort())
  for (const path of changed) {
    const actual = readFileSync(new URL(path, cwd))
    const current = nearbyAddressReviewPriorSource(path, appointmentGrowthPriorSource(path, actual))
    const preBatch = git('show', receipt.baseline + ':' + path)
    const preMopart = git('show', priorMopart.baseline + ':' + path)
    const { before, after } = receipt.changed[path]
    assert.notEqual(before, after, path)
    assert.equal(before, priorLyulin.changed[path].after, path)
    assert.equal(sha(current), after, path)
    assert.equal(crossQuarterAllowsFileChange(path), sha(actual) === after, path)
    assert.equal(crossQuarterAllowsNewFile(path), false, path)
    assert.deepEqual(crossQuarterPriorSource(path, current), preBatch, path)
    assert.deepEqual(catalogueIntakePriorSource(path, actual), preMopart, path)
    const tampered = Buffer.concat([actual, Buffer.from('\n')])
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  for (const path of added) {
    assert.deepEqual(split(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [], path)
    assert.ok(crossQuarterAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(crossQuarterAllowsFileChange(path), false, path)
  }
  for (const path of ['app/layout.js', 'lib/booking-engine.mjs', 'package.json', 'public/logo.svg', 'supabase/config.toml']) {
    assert.equal(crossQuarterAllowsPath(path), false, path)
    assert.equal(catalogueIntakeAllowsPath(path), false, path)
    assert.equal(catalogueIntakePriorSource(path, 'unrelated bytes'), 'unrelated bytes', path)
  }
})

test('only exact current copies of the new branches can be removed from historical catalogue inputs', () => {
  assert.deepEqual(receipt.records.map(row => row.id).sort(), ids)
  const rows = SOFIA_CATALOGUE.filter(row => ids.includes(row.id))
  assert.deepEqual(rows.map(row => row.id).sort(), ids)
  assert.deepEqual(crossQuarterPriorCatalogue(rows), [])
  assert.throws(() => crossQuarterPriorCatalogue([...rows, rows[0]]), /Duplicate verified Sofia cross-quarter intake record/u)
  for (const row of rows) {
    assert.equal(sha(JSON.stringify(row)), receipt.records.find(item => item.id === row.id).sha256)
    assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'А' }]), /Unreviewed verified Sofia cross-quarter intake record/u)
  }
  const earlier = SOFIA_CATALOGUE.filter(row => row.id === priorMopart.record.id || priorLyulin.records.some(item => item.id === row.id))
  assert.equal(earlier.length, priorLyulin.records.length + 1)
  assert.deepEqual(crossQuarterPriorCatalogue([...earlier, ...rows]), earlier)
  assert.deepEqual(catalogueIntakePriorCatalogue([...earlier, ...rows]), [])
})
