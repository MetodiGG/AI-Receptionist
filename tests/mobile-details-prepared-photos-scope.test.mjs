import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import receipt from './fixtures/mobile-details-prepared-photos-approval.json' with { type: 'json' }
import { preparedPhotosAllowsFileChange, preparedPhotosAllowsNewFile, preparedPhotosAllowsPath, preparedPhotosPriorSource } from './mobile-details-prepared-photos-scope.mjs'
import { staticWebpCacheCpuAllowsFileChange } from './discovery-static-webp-cache-cpu-scope.mjs'
import { mobileDiscoveryFirstPaintAllowsFileChange } from './mobile-discovery-first-paint-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root })
const sha = source => createHash('sha256').update(source).digest('hex')
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)

test('the prepared-photo latency patch changes only the public details read and display path', async () => {
  const { baseline, changed, added } = receipt
  assert.equal(baseline, '0bb9c0a4e242b1321b2d115576bcc368dad8e204')
  assert.deepEqual(Object.keys(changed), [
    'app/businesses/catalogue/[id]/page.js',
    'components/discovery-business-details.js',
    'components/public-service-menu.js',
    'lib/discovery/detail-request.mjs',
    'lib/discovery/public-details.mjs',
  ])
  assert.deepEqual(Object.keys(added), ['components/prepared-service-thumbnail.js', 'lib/public-detail-photo-payload.mjs'])
  const actual = new Set([...split(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])
  const expected = [...Object.keys(changed), ...Object.keys(added)].sort()
  assert.deepEqual([...actual].filter(path => path !== 'node_modules' && !path.startsWith('tests/')
    && (expected.includes(path) || (!staticWebpCacheCpuAllowsFileChange(path) && !mobileDiscoveryFirstPaintAllowsFileChange(path)))).sort(), expected)

  for (const [path, { before, after }] of Object.entries(changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url)), original = git('show', baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.notEqual(before, after, path)
    assert.equal(preparedPhotosAllowsFileChange(path), true, path)
    assert.equal(preparedPhotosAllowsNewFile(path), false, path)
    assert.deepEqual(preparedPhotosPriorSource(path, current), original, path)
    assert.equal(preparedPhotosPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(preparedPhotosPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(preparedPhotosPriorSource(path, tampered), tampered, 'an unreviewed edit is never normalized')
  }
  for (const [path, expected] of Object.entries(added)) {
    const current = await readFile(new URL('../' + path, import.meta.url))
    assert.equal(sha(current), expected, path)
    assert.equal(preparedPhotosAllowsNewFile(path), true, path)
    assert.equal(preparedPhotosAllowsFileChange(path), false, path)
    assert.equal(preparedPhotosPriorSource(path, current), current, path)
  }
  for (const path of ['components/discovery-business-card.js', 'components/service-thumbnail.js', 'components/public-booking-page.js',
    'lib/discovery/business-details.mjs', 'lib/discovery/catalogue-policy.mjs', 'lib/discovery/sofia-catalogue.mjs', 'lib/booking-engine.mjs',
    'lib/service-detail-photo-presentation.mjs', 'package.json', 'next.config.mjs', 'public/service-photos/haircut-v1.webp']) {
    assert.equal(preparedPhotosAllowsPath(path), false, path)
  }
})
