import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, writeFileSync } from 'node:fs'

// Mechanical finalization, only after the reviewed runtime is frozen:
// node tests/seal-business-onboarding-sofia-20261127.mjs
// No source, historical receipt, business data, Git or deployment changes.
const cwd = new URL('../', import.meta.url)
const baseline = '5c118d4f000b6a9bfdb11c581174f7839bc15ab6'
const changedPaths = [
  'components/business-onboarding.js', 'components/business-setup.js', 'components/business-location-fields.js',
  'components/booking-mode-fields.js', 'components/catalogue-business-lookup.js', 'components/business-profile.js', 'components/public-booking-page.js',
  'app/businesses/catalogue/[id]/page.js', 'app/business-profile.css', 'lib/business-application.mjs', 'app/dashboard/settings/page.js',
]
const addedPaths = ['app/business-signup-refresh.css', 'components/owner-business-client-preview.js', 'app/dashboard/settings/settings-profile.module.css']
const sha = source => createHash('sha256').update(source).digest('hex')
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const currentBytes = path => {
  const file = new URL(path, cwd), info = lstatSync(file)
  assert.ok(info.isFile() && !(info.mode & 0o111), 'a sealed file must be regular and nonexecutable: ' + path)
  return readFileSync(file)
}
assert.equal(git('rev-parse', 'HEAD').toString('utf8').trim(), baseline, 'review the exact base again if the branch moved')
const changed = files(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')).filter(path => !path.startsWith('tests/'))
assert.deepEqual(changed.sort(), [...changedPaths].sort(), 'only the eleven approved existing onboarding/profile/owner paths may differ')
const added = files(git('ls-files', '--others', '--exclude-standard', '-z')).filter(path => path !== 'node_modules' && !path.startsWith('tests/'))
assert.deepEqual(added.sort(), [...addedPaths].sort(), 'only the three approved local presentation files may be added')
const receipt = { baseline, changed: Object.fromEntries(changedPaths.map(path => [path, {
  before: sha(git('show', baseline + ':' + path)), after: sha(currentBytes(path)),
}])), added: Object.fromEntries(addedPaths.map(path => [path, sha(currentBytes(path))])) }
for (const [path, record] of Object.entries(receipt.changed)) assert.notEqual(record.before, record.after, path)
writeFileSync(new URL('tests/fixtures/business-onboarding-sofia-approval.json', cwd), JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify({ baseline, changed: changedPaths.length, added: addedPaths.length }, null, 2))
