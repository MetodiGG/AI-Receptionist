import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import test from 'node:test'
import receipt from './fixtures/provider-role-photo-approval.json' with { type: 'json' }
import { providerRolePhotosAllowsFileChange, providerRolePhotosAllowsNewFile,
  providerRolePhotosAllowsPath, providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const changed = ['lib/public-business-cover-photo.mjs', 'lib/service-detail-photo-presentation.mjs']
const before = ['862b0b040d92bf2aa8ba6f1a7fbc373f5b9c01f2843e358a5e6107edf01ed7fc',
  'f45821d4f3c34a14ed59372d099b61f17486b042657786807397e78ace35c6af']
const fixedAdded = ['docs/provider-role-illustrations-20261127.md', 'lib/provider-role-illustrations.json', 'lib/provider-role-illustrations.mjs']

test('the independently sealed role-matching release changes only the two exact resolvers and explicit additive artwork/policy', () => {
  assert.equal(receipt.baseline, 'f6cab3a9ea894b6b285dee886b549f1021400389')
  assert.deepEqual(Object.keys(receipt.changed), changed)
  const manifest = JSON.parse(readFileSync(new URL('../lib/provider-role-illustrations.json', import.meta.url)))
  const media = [...new Set([...manifest.cover, ...manifest.service].map(row => 'public' + row.src))]
  for (const path of media) assert.match(path, /^public\/(?:business-cover-photos|service-photos)\/role-matched-[a-z0-9-]+-20261127-v1\.webp$/u)
  const added = Object.keys(receipt.added)
  assert.deepEqual(added.sort(), [...fixedAdded, ...media].sort(), 'only individually sealed role-assigned art, policy and its documentation belong to this successor')
  const observed = [...new Set([...files(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])]
    .filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort()
  assert.deepEqual(observed, [...changed, ...added].sort(), 'business facts, original media, layout, booking and all settings remain frozen')
  for (const [index, path] of changed.entries()) {
    const current = readFileSync(new URL(path, cwd)), original = git('show', receipt.baseline + ':' + path)
    assert.equal(receipt.changed[path].before, before[index], path)
    assert.equal(sha(original), before[index], path)
    assert.match(receipt.changed[path].after ?? '', /^[a-f0-9]{64}$/u, 'an unfinished seal cannot authorize runtime changes')
    assert.notEqual(receipt.changed[path].before, receipt.changed[path].after, path)
    assert.equal(sha(current), receipt.changed[path].after, path)
    assert.equal(providerRolePhotosAllowsFileChange(path), true, path)
    assert.equal(providerRolePhotosAllowsNewFile(path), false, path)
    assert.deepEqual(providerRolePhotosPriorSource(path, current), original, path)
    assert.equal(providerRolePhotosPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(providerRolePhotosPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(providerRolePhotosPriorSource(path, tampered), tampered, 'unsealed source must never disappear into historical approval')
  }
  for (const path of added) {
    const info = lstatSync(new URL(path, cwd)), source = readFileSync(new URL(path, cwd))
    assert.ok(info.isFile() && !(info.mode & 0o111), path)
    assert.match(receipt.added[path], /^[a-f0-9]{64}$/u)
    assert.equal(sha(source), receipt.added[path], path)
    assert.equal(providerRolePhotosAllowsNewFile(path), true, path)
    assert.equal(providerRolePhotosAllowsFileChange(path), false, path)
    assert.equal(providerRolePhotosPriorSource(path, source), source, path)
    assert.deepEqual(files(git('ls-tree', '--name-only', '-r', '-z', receipt.baseline, '--', path)), [], path)
  }
})

test('role-matching seals do not authorize unrelated code, old/generated/original photographs, arbitrary adjacent paths or changed input', () => {
  const source = Buffer.from('unreviewed source')
  for (const path of ['lib/booking-engine.mjs', 'lib/discovery/sofia-catalogue.mjs', 'lib/locale/service-english.json',
    'lib/discovery/subcategories.mjs', 'lib/public-detail-photo-payload.mjs', 'components/business-cover-photo.js', 'app/service-photo-surfaces.css',
    'public/business-cover-photos/other-v1.webp', 'public/service-photos/legal-consultation-v1.webp',
    'public/business-cover-photos/role-matched-unreviewed-20261127-v1.webp',
    'public/service-photos/role-matched-unreviewed-20261127-v1.webp',
    'public/businesses/vesi-studio/interior-20261026.webp', 'supabase/config.toml', '../outside.mjs', '__proto__']) {
    assert.equal(providerRolePhotosAllowsPath(path), false, path)
    assert.equal(providerRolePhotosPriorSource(path, source), source, path)
  }
})
