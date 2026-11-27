import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import test from 'node:test'
import receipt from './fixtures/business-onboarding-sofia-approval.json' with { type: 'json' }
import { businessOnboardingSofiaAllowsFileChange, businessOnboardingSofiaAllowsNewFile,
  businessOnboardingSofiaAllowsPath, businessOnboardingSofiaPriorSource } from './business-onboarding-sofia-scope.mjs'
import { approvedCatalogueMatches, publishedBaselineMatches, verifiedCatalogueTip, publishedBaseline } from './catalogue-only-release-scope.mjs'
import { preparedPhotosAllowsFileChange, preparedPhotosPriorSource } from './mobile-details-prepared-photos-scope.mjs'

const cwd = new URL('../', import.meta.url)
const git = (...args) => execFileSync('git', args, { cwd, maxBuffer: 8 * 1024 * 1024 })
const sha = source => createHash('sha256').update(source).digest('hex')
const files = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const changed = [
  'components/business-onboarding.js', 'components/business-setup.js', 'components/business-location-fields.js',
  'components/booking-mode-fields.js', 'components/catalogue-business-lookup.js', 'components/business-profile.js', 'components/public-booking-page.js',
  'app/businesses/catalogue/[id]/page.js', 'app/business-profile.css', 'lib/business-application.mjs', 'app/dashboard/settings/page.js',
]
const added = ['app/business-signup-refresh.css', 'components/owner-business-client-preview.js', 'app/dashboard/settings/settings-profile.module.css']

test('the Sofia onboarding and owner/profile successor seals exactly eleven reviewed existing files and three additive presentation files', () => {
  assert.equal(receipt.baseline, '5c118d4f000b6a9bfdb11c581174f7839bc15ab6')
  assert.deepEqual(Object.keys(receipt.changed), changed)
  assert.deepEqual(Object.keys(receipt.added), added)
  const observed = [...new Set([...files(git('diff', '--name-only', '--no-renames', '-z', receipt.baseline, '--')),
    ...files(git('ls-files', '--others', '--exclude-standard', '-z'))])]
    .filter(path => path !== 'node_modules' && !path.startsWith('tests/')).sort()
  assert.deepEqual(observed, [...changed, ...added].sort(), 'catalogue facts, image assets, availability, reservations and unrelated settings remain unchanged')
  for (const path of changed) {
    const current = readFileSync(new URL(path, cwd)), original = git('show', receipt.baseline + ':' + path)
    assert.match(receipt.changed[path].before ?? '', /^[a-f0-9]{64}$/u)
    assert.equal(sha(original), receipt.changed[path].before, path)
    assert.match(receipt.changed[path].after ?? '', /^[a-f0-9]{64}$/u, 'unfinished seals never authorize successor changes')
    assert.notEqual(receipt.changed[path].before, receipt.changed[path].after, path)
    assert.equal(sha(current), receipt.changed[path].after, path)
    assert.equal(businessOnboardingSofiaAllowsFileChange(path), true, path)
    assert.equal(businessOnboardingSofiaAllowsNewFile(path), false, path)
    assert.deepEqual(businessOnboardingSofiaPriorSource(path, current), original, path)
    assert.equal(businessOnboardingSofiaPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(businessOnboardingSofiaPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(businessOnboardingSofiaPriorSource(path, tampered), tampered, 'unsealed source must stay visible to all historical checks')
  }
  for (const path of added) {
    const info = lstatSync(new URL(path, cwd)), source = readFileSync(new URL(path, cwd))
    assert.ok(info.isFile() && !(info.mode & 0o111), path)
    assert.match(receipt.added[path] ?? '', /^[a-f0-9]{64}$/u)
    assert.equal(sha(source), receipt.added[path], path)
    assert.equal(businessOnboardingSofiaAllowsNewFile(path), true, path)
    assert.equal(businessOnboardingSofiaAllowsFileChange(path), false, path)
    assert.equal(businessOnboardingSofiaPriorSource(path, source), source, path)
    assert.deepEqual(files(git('ls-tree', '--name-only', '-r', '-z', receipt.baseline, '--', path)), [], path)
  }
})

test('the successor cannot authorize original/generated photos, calendars, bookings, search, stored business data, migrations, dependencies or arbitrary adjacent source', () => {
  const source = Buffer.from('unreviewed source')
  for (const path of ['lib/booking-engine.mjs', 'lib/business-application-geocode-job.mjs', 'lib/business-location.mjs',
    'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/catalogue-search.mjs', 'lib/service-detail-photo-presentation.mjs',
    'lib/public-business-cover-photo.mjs', 'lib/provider-role-illustrations.json', 'lib/provider-role-illustrations.mjs',
    'components/business-photo-gallery.js', 'app/dashboard/settings/settings-unreviewed.module.css', 'app/business-signup-unreviewed.css',
    'public/business-cover-photos/other-v1.webp', 'public/service-photos/legal-consultation-v1.webp',
    'public/businesses/vesi-studio/interior-20261026.webp', 'app/api/public/[slug]/bookings/route.js',
    'package.json', 'pnpm-lock.yaml', 'next.config.mjs', 'supabase/config.toml', 'supabase/migrations/unreviewed.sql', '../outside.mjs', '__proto__']) {
    assert.equal(businessOnboardingSofiaAllowsPath(path), false, path)
    assert.equal(businessOnboardingSofiaPriorSource(path, source), source, path)
  }
})

test('the catalogue profile reconstructs both independently approved page histories through exact successive preimages', () => {
  const path = 'app/businesses/catalogue/[id]/page.js'
  const current = readFileSync(new URL(path, cwd))
  const beforeOnboarding = businessOnboardingSofiaPriorSource(path, current)
  assert.deepEqual(beforeOnboarding, git('show', receipt.baseline + ':' + path))
  assert.deepEqual(beforeOnboarding, git('show', publishedBaseline + ':' + path))
  const beforePreparedPhotos = preparedPhotosPriorSource(path, beforeOnboarding)
  assert.deepEqual(beforePreparedPhotos, git('show', verifiedCatalogueTip + ':' + path))
  assert.notDeepEqual(beforePreparedPhotos, beforeOnboarding, 'the two real branch histories are not conflated')
  assert.equal(preparedPhotosAllowsFileChange(path), true)
  assert.equal(approvedCatalogueMatches(path), true)
  assert.equal(publishedBaselineMatches(path), true)
  const tampered = Buffer.concat([current, Buffer.from('\n')])
  assert.equal(businessOnboardingSofiaPriorSource(path, tampered), tampered)
  assert.equal(preparedPhotosPriorSource(path, tampered), tampered)
})
