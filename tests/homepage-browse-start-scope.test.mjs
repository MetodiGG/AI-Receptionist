import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import receipt from './fixtures/homepage-browse-start-approval.json' with { type: 'json' }
import { homepageBrowseStartAllowsFileChange, homepageBrowseStartAllowsNewFile, homepageBrowseStartAllowsPath, homepageBrowseStartPriorSource } from './homepage-browse-start-scope.mjs'
import { publicFirstLoadAllowsFileChange } from './public-first-load-optimization-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root })
const sha = source => createHash('sha256').update(source).digest('hex')
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const read = path => readFile(new URL('../' + path, import.meta.url))

test('the early homepage browse release can modify only its entry page, client handoff and new request helper', async () => {
  const { baseline, changed, added } = receipt
  assert.equal(baseline, '3f276e1229249a5fe8a3c2b9ea95772d0c93a4d9')
  assert.deepEqual(Object.keys(changed), ['app/page.js', 'components/discovery-search.js'])
  assert.deepEqual(Object.keys(added), ['lib/discovery/homepage-browse-start.mjs'])
  const paths = new Set([...split(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])
  const expected = [...Object.keys(changed), ...Object.keys(added)].sort()
  assert.deepEqual([...paths].filter(path => path !== 'node_modules' && !path.startsWith('tests/') &&
    (expected.includes(path) || !publicFirstLoadAllowsFileChange(path))).sort(), expected)
  for (const path of expected) {
    const stat = await lstat(new URL('../' + path, import.meta.url))
    assert.ok(stat.isFile() && !(stat.mode & 0o111), path)
    assert.equal(homepageBrowseStartAllowsPath(path), true, path)
  }
  for (const [path, { before, after }] of Object.entries(changed)) {
    const current = await read(path), original = git('show', baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(current), after, path)
    assert.notEqual(before, after, path)
    assert.equal(homepageBrowseStartAllowsFileChange(path), true, path)
    assert.equal(homepageBrowseStartAllowsNewFile(path), false, path)
    assert.deepEqual(homepageBrowseStartPriorSource(path, current), original, path)
    assert.equal(homepageBrowseStartPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(homepageBrowseStartPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(homepageBrowseStartPriorSource(path, tampered), tampered, 'unreviewed bytes stay visible')
  }
  for (const [path, expected] of Object.entries(added)) {
    const current = await read(path)
    assert.equal(sha(current), expected, path)
    assert.equal(homepageBrowseStartAllowsNewFile(path), true, path)
    assert.equal(homepageBrowseStartAllowsFileChange(path), false, path)
    assert.equal(homepageBrowseStartPriorSource(path, current), current, path)
  }
  for (const path of ['app/layout.js', 'app/discovery.css', 'app/api/public/discovery/route.js',
    'lib/discovery/catalogue-search.mjs', 'lib/discovery/sofia-catalogue.mjs', 'lib/booking-engine.mjs',
    'next.config.mjs', 'public/category-photos/fitness-v3.webp', '__proto__']) {
    assert.equal(homepageBrowseStartAllowsPath(path), false, path)
    assert.equal(homepageBrowseStartPriorSource(path, 'unreviewed'), 'unreviewed', path)
  }
})
