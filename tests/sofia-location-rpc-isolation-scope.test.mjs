import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink, lstat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/sofia-location-rpc-isolation-20261125-approval.json' with { type: 'json' }
import previous from './fixtures/sofia-location-image-integrity-20261124-approval.json' with { type: 'json' }
import { sofiaRpcAllowsFileChange, sofiaRpcAllowsNewFile, sofiaRpcPriorSource } from './sofia-location-rpc-isolation-20261125-scope.mjs'
import { preSubcategoryDisclosureSource, sofiaIntegrityAllowsFileChange, sofiaIntegrityAllowsNewFile, sofiaIntegrityMatchesPriorHash, sofiaIntegrityPriorSource } from './sofia-location-image-integrity-20261124-scope.mjs'
import { mobileCatalogueAllowsNewFile } from './mobile-catalogue-hotfix-scope.mjs'
import { catalogueExpiryAllowsNewFile } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsNewFile } from './poster-polish-20261126-scope.mjs'
import { serviceDetailPhotoCoverageAllowsNewFile } from './service-detail-photo-coverage-20261126-scope.mjs'
import { serviceDetailPhotoExpansionAllowsNewFile } from './service-detail-photo-expansion-20261126-scope.mjs'
import { discoveryPerformanceAllowsNewFile } from './discovery-performance-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const pathUrl = path => new URL('../' + path, import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const staging = 'scripts/prepare-staging.mjs'
const registrations = 'lib/registration-address-server.js'
const operational = path => !path.startsWith('tests/') && path !== 'node_modules'

test('the 25 Nov receipt authorizes exactly two changed and two added operational files with unchanged 24 Nov approval', async () => {
  assert.equal(receipt.baseline, '30ea62a03cbb2febf22215693afd0daa430bb481')
  assert.deepEqual(Object.keys(receipt.changed), [registrations, staging])
  assert.deepEqual(Object.keys(receipt.added), [
    'docs/operations/20261125-location-rpc-isolation.md',
    'supabase/migrations/20261125001500_sofia_location_rpc_isolation.sql',
  ])
  assert.equal(sha(await readFile(pathUrl('tests/fixtures/sofia-location-image-integrity-20261124-approval.json'))),
    'd64e37e3cd53dfc9b14a29ac6a80141ef1f22fe590728703f8863d80e353c677')
  for (const [path, { before, after }] of Object.entries(receipt.changed)) {
    const current = await readFile(pathUrl(path))
    assert.notEqual(before, after, path)
    assert.equal(sha(git('show', receipt.baseline + ':' + path)), before, path)
    assert.equal(sha(current), after, path)
    assert.equal(sofiaRpcAllowsFileChange(path), true, path)
    assert.equal(sofiaIntegrityAllowsFileChange(path), true, path)
    assert.equal(sofiaRpcAllowsNewFile(path), false, path)
    assert.deepEqual(sofiaRpcPriorSource(path, current), git('show', receipt.baseline + ':' + path), path)
    assert.throws(() => sofiaRpcPriorSource(path, Buffer.concat([current, Buffer.from('\n')])), /Unreviewed 25 Nov/u)
  }
  for (const [path, hash] of Object.entries(receipt.added)) {
    assert.equal(sha(await readFile(pathUrl(path))), hash, path)
    assert.equal(sofiaRpcAllowsNewFile(path), true, path)
    assert.equal(sofiaIntegrityAllowsNewFile(path), true, path)
    assert.equal(sofiaRpcAllowsFileChange(path), false, path)
  }
  for (const path of ['package.json', 'pnpm-lock.yaml', 'lib/booking-engine.mjs', 'lib/registration-address-lookup.mjs']) {
    assert.equal(sofiaRpcAllowsFileChange(path), false, path)
    assert.equal(sofiaRpcAllowsNewFile(path), false, path)
  }
})

test('nested staging inversion matches each dated SHA and its preceding Git bytes', async () => {
  const text = await readFile(pathUrl(staging), 'utf8')
  const reverted25 = sofiaRpcPriorSource(staging, text)
  assert.equal(typeof reverted25, 'string')
  assert.equal(sha(reverted25), receipt.changed[staging].before)
  assert.equal(sha(reverted25), previous.changed[staging].after)
  assert.equal(sofiaRpcPriorSource(staging, reverted25), reverted25)
  assert.equal(sofiaIntegrityMatchesPriorHash(staging, previous.changed[staging].before), true)
  assert.equal(sofiaIntegrityMatchesPriorHash(registrations, receipt.changed[registrations].before), true)
  const reverted24 = sofiaIntegrityPriorSource(staging, text)
  assert.equal(reverted24, git('show', previous.baseline + ':' + staging).toString('utf8'))
  assert.equal(sha(reverted24), previous.changed[staging].before)
  assert.equal(sofiaIntegrityPriorSource(staging, reverted25), reverted24)
  assert.equal(sofiaIntegrityPriorSource(staging, reverted24), reverted24)
  assert.throws(() => sofiaIntegrityPriorSource(staging, text + '\n'), /Unreviewed 25 Nov/u)
})

test('every operational path, mode and every unrelated byte are identical to the pinned 24 Nov tree', async () => {
  const baseline = git('ls-tree', '-r', '-z', receipt.baseline).toString('utf8').split('\0').filter(Boolean).map(entry => {
    const [metadata, path] = entry.split('\t')
    const [mode, type, oid] = metadata.split(' ')
    return { mode, type, oid, path }
  }).filter(entry => operational(entry.path))
  const actual = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').toString('utf8')
    .split('\0').filter(path => path && operational(path))
  const laterApproved = path => discoveryPerformanceAllowsNewFile(path) || serviceDetailPhotoExpansionAllowsNewFile(path) || serviceDetailPhotoCoverageAllowsNewFile(path) || mobileCatalogueAllowsNewFile(path) || catalogueExpiryAllowsNewFile(path) || posterPolishAllowsNewFile(path)
  const laterApprovedFiles = actual.filter(laterApproved)
  assert.deepEqual([...new Set(actual.filter(path => !laterApproved(path)))].sort(),
    [...baseline.map(entry => entry.path), ...Object.keys(receipt.added)].sort())
  for (let offset = 0; offset < baseline.length; offset += 32) await Promise.all(baseline.slice(offset, offset + 32).map(async entry => {
    assert.equal(entry.type, 'blob', entry.path)
    const url = pathUrl(entry.path), stat = await lstat(url)
    const mode = stat.isSymbolicLink() ? '120000' : stat.isFile() ? stat.mode & 0o111 ? '100755' : '100644' : null
    assert.equal(mode, entry.mode, entry.path)
    const current = stat.isSymbolicLink() ? Buffer.from(await readlink(url)) : await readFile(url)
    const bytes = sofiaRpcPriorSource(entry.path, preSubcategoryDisclosureSource(entry.path, current))
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), entry.oid, entry.path)
  }))
  for (const path of [...Object.keys(receipt.added), ...laterApprovedFiles]) {
    const stat = await lstat(pathUrl(path))
    assert.equal(stat.isFile() && !(stat.mode & 0o111), true, path)
  }
})
