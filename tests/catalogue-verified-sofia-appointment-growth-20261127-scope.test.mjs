import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import manifest from '../docs/catalogue-coverage/verified-sofia-appointment-growth-20261127.json' with { type: 'json' }
import { RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE } from '../lib/discovery/sofia-catalogue.mjs'
import { catalogueIntakeAllowsPath, catalogueIntakePriorCatalogue, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { detailPreviewAllowsNewFile } from './public-detail-photo-preview-scope.mjs'
import { appointmentGrowthAllowsFileChange, appointmentGrowthAllowsNewFile, appointmentGrowthAllowsPath, appointmentGrowthPriorSource,
  appointmentGrowthPriorCatalogue } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'
import earlierAddresses from './fixtures/catalogue-verified-nearby-addresses-20261127.json' with { type: 'json' }
import earlierIntake from './fixtures/catalogue-verified-sofia-cross-quarter-20261127.json' with { type: 'json' }
import earlierPhotos from './fixtures/public-detail-photo-preview-approval.json' with { type: 'json' }
import receipt from './fixtures/catalogue-verified-sofia-appointment-growth-20261127.json' with { type: 'json' }
import { lateOwnerPointsAllowsNewFile, lateOwnerPointsPriorCatalogue, lateOwnerPointsPriorSource } from './catalogue-verified-owner-civic-points-20261127-scope.mjs'

const cwd = new URL('../', import.meta.url), cataloguePath = 'lib/discovery/sofia-catalogue.mjs'
const photoPath = 'lib/service-detail-existing-photo-coverage.mjs'
const changed = [
  'lib/catalogue-service-photo-keys.mjs',
  'lib/discovery/catalogue-data/pricing-booking-review-v1.mjs',
  cataloguePath,
  'lib/locale/service-english.json',
  photoPath,
]
const added = [
  'docs/catalogue-coverage/verified-sofia-appointment-growth-20261127.json',
  'lib/discovery/catalogue-data/neighborhood-verified-banisha-salon-20261127.mjs',
  'lib/discovery/catalogue-data/neighborhood-verified-consultations-20261127.mjs',
  'lib/discovery/catalogue-data/neighborhood-verified-education-growth-20261127.mjs',
]
const verifiedIds = [
  'sofia-art-academy-banishora-kozloduy128',
  'sofia-essentisimo-banishora-karlovo7',
  'sofia-reya-kids-ovcha-kupel2-ivan-hadzhiyski3',
  'sofia-va-consulting-lyulin10-block135',
]
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const hashRow = row => sha(JSON.stringify(row))
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const priorCatalogueDigest = 'bde34e395f9d3a368cfe72a604f812dd098e13d6ef66a58885f8c9116020d596'

test('appointment growth authorizes only exact catalogue paths while preserving older address and photo receipts', () => {
  assert.equal(receipt.baseline, '5648815d6d7f73dad5ebdb6702f75530073ac967')
  assert.deepEqual(Object.keys(receipt.changed).sort(), changed)
  assert.deepEqual(Object.keys(receipt.added).sort(), added)
  const actual = [...new Set([
    ...split(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z')),
  ])].filter(path => path !== 'node_modules' && !path.startsWith('tests/') && !lateOwnerPointsAllowsNewFile(path)).sort()
  assert.deepEqual(actual, [...added, ...changed].sort())
  for (const path of changed) {
    const live = readFileSync(new URL(path, cwd)), current = lateOwnerPointsPriorSource(path, live)
    const original = git('show', receipt.baseline + ':' + path)
    const predecessor = path === cataloguePath ? earlierAddresses.changed[path].after
      : path === photoPath ? earlierPhotos.added[path] : earlierIntake.changed[path].after
    assert.equal(sha(original), predecessor, path)
    assert.equal(sha(original), receipt.changed[path].before, path)
    assert.equal(sha(current), receipt.changed[path].after, path)
    assert.notEqual(sha(current), sha(original), path)
    assert.equal(appointmentGrowthAllowsFileChange(path), sha(live) === receipt.changed[path].after, path)
    assert.ok(catalogueIntakeAllowsPath(path), path)
    assert.equal(appointmentGrowthAllowsNewFile(path), false, path)
    assert.deepEqual(appointmentGrowthPriorSource(path, current), original, path)
    const tampered = Buffer.concat([live, Buffer.from('\n')])
    assert.equal(appointmentGrowthPriorSource(path, tampered), tampered, path)
    assert.equal(catalogueIntakePriorSource(path, tampered), tampered, path)
  }
  assert.equal(detailPreviewAllowsNewFile(photoPath), true)
  for (const path of added) {
    assert.deepEqual(split(git('ls-tree', '--name-only', '-z', receipt.baseline, '--', path)), [], path)
    assert.ok(appointmentGrowthAllowsNewFile(path) && catalogueIntakeAllowsPath(path), path)
    assert.equal(appointmentGrowthAllowsFileChange(path), false, path)
  }
  for (const path of ['lib/discovery/catalogue-policy.mjs', 'lib/booking-engine.mjs', 'public/logo.svg', 'app/layout.js',
    'package.json', 'supabase/config.toml']) assert.equal(appointmentGrowthAllowsPath(path), false, path)
})

test('only the exact verified new premises can be omitted; all earlier rows are unchanged and ordered', () => {
  const ids = receipt.records.map(row => row.id).sort()
  assert.deepEqual(ids, verifiedIds)
  assert.deepEqual(manifest.verified.map(row => row.id).sort(), ids)
  for (const catalogue of [RAW_SOFIA_CATALOGUE, SOFIA_CATALOGUE].map(lateOwnerPointsPriorCatalogue)) {
    const matched = catalogue.filter(row => ids.includes(row.id))
    assert.deepEqual(matched.map(row => row.id).sort(), ids)
    const previous = appointmentGrowthPriorCatalogue(catalogue)
    assert.equal(previous.length, catalogue.length - ids.length)
    assert.equal(hashRow(previous), priorCatalogueDigest)
    assert.deepEqual(appointmentGrowthPriorCatalogue(matched), [])
    for (const row of matched) {
      assert.equal(hashRow(row), receipt.records.find(item => item.id === row.id).sha256, row.id)
      assert.throws(() => appointmentGrowthPriorCatalogue([row, row]), /Duplicate verified Sofia appointment growth record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, address: row.address + 'A' }]), /Unreviewed verified Sofia appointment growth record/u)
      assert.throws(() => catalogueIntakePriorCatalogue([{ ...row, services: [] }]), /Unreviewed verified Sofia appointment growth record/u)
    }
  }
})
