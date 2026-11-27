import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, writeFileSync } from 'node:fs'

// Mechanical finalization tool, run only after the reviewed runtime is frozen:
// node tests/seal-provider-role-photos-20261127.mjs
// It cannot admit another runtime scope, migrate data, stage or publish files.
const cwd = new URL('../', import.meta.url)
const baseline = 'f6cab3a9ea894b6b285dee886b549f1021400389'
const changedPaths = ['lib/public-business-cover-photo.mjs', 'lib/service-detail-photo-presentation.mjs']
const fixedAdded = ['docs/provider-role-illustrations-20261127.md', 'lib/provider-role-illustrations.json', 'lib/provider-role-illustrations.mjs']
const media = /^public\/(?:business-cover-photos|service-photos)\/role-matched-[a-z0-9-]+-20261127-v1\.webp$/u
const sha = source => createHash('sha256').update(source).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const currentBytes = path => {
  const file = new URL(path, cwd), info = lstatSync(file)
  assert.ok(info.isFile() && !(info.mode & 0o111), 'sealed source must be a regular nonexecutable file: ' + path)
  return readFileSync(file)
}
assert.equal(git('rev-parse', 'HEAD').toString('utf8').trim(), baseline, 'review the base again if the branch moved')
const changed = files(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')).filter(path => !path.startsWith('tests/'))
assert.deepEqual(changed.sort(), [...changedPaths].sort(), 'only the two approved existing photo resolvers may differ')
const added = files(git('ls-files', '--others', '--exclude-standard', '-z')).filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort()
assert.ok(fixedAdded.every(path => added.includes(path)), 'the final policy, manifest and provenance documentation must exist')
for (const path of added) assert.ok(fixedAdded.includes(path) || media.test(path), 'unexpected new runtime file: ' + path)
const receipt = { baseline, changed: Object.fromEntries(changedPaths.map(path => [path, {
  before: sha(git('show', baseline + ':' + path)), after: sha(currentBytes(path)),
}])), added: Object.fromEntries(added.map(path => [path, sha(currentBytes(path))])) }
for (const [path, record] of Object.entries(receipt.changed)) assert.notEqual(record.before, record.after, path)
const manifest = JSON.parse(currentBytes('lib/provider-role-illustrations.json'))
const referenced = [...manifest.cover, ...manifest.service].map(row => 'public' + row.src).sort()
assert.deepEqual([...new Set(referenced)].sort(), added.filter(path => media.test(path)), 'every new scene must have one explicit role assignment, with no orphan media')
writeFileSync(new URL('tests/fixtures/provider-role-photo-approval.json', cwd), JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify({ baseline, changed: changedPaths, added: added.length, media: referenced.length }, null, 2))
