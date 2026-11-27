import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import receipt from './fixtures/discovery-static-webp-cache-cpu-approval.json' with { type: 'json' }
import { staticWebpCacheCpuAllowsFileChange, staticWebpCacheCpuPriorSource } from './discovery-static-webp-cache-cpu-scope.mjs'
import { mobileDiscoveryFirstPaintAllowsFileChange, mobileDiscoveryFirstPaintPriorSource } from './mobile-discovery-first-paint-scope.mjs'
import { homepageBrowseStartAllowsPath } from './homepage-browse-start-scope.mjs'
import { approvedCatalogueMatches } from './catalogue-only-release-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root })
const sha = source => createHash('sha256').update(source).digest('hex')
const split = bytes => bytes.toString('utf8').split('\0').filter(Boolean)
const require = createRequire(import.meta.url)

test('only the reviewed public WebP cache config and catalogue search CPU source differ from production', async () => {
  const { baseline, changed } = receipt
  assert.equal(baseline, 'd0e02e76a0b9012478527c2d41b6540c990ac988')
  const expected = ['lib/discovery/catalogue-search.mjs', 'next.config.mjs']
  assert.deepEqual(Object.keys(changed), expected)
  const actual = new Set([...split(git('diff', '--name-only', '--no-renames', '-z', baseline, '--')),
    ...split(git('ls-files', '--others', '--exclude-standard', '-z'))])
  assert.deepEqual([...actual].filter(path => path !== 'node_modules' && !path.startsWith('tests/')
    && (expected.includes(path) || (!mobileDiscoveryFirstPaintAllowsFileChange(path) && !homepageBrowseStartAllowsPath(path)
      && !approvedCatalogueMatches(path)))).sort(), expected)
  for (const [path, { before, after }] of Object.entries(changed)) {
    const current = await readFile(new URL('../' + path, import.meta.url)), original = git('show', baseline + ':' + path)
    assert.equal(sha(original), before, path)
    assert.equal(sha(mobileDiscoveryFirstPaintPriorSource(path, current)), after, path)
    assert.notEqual(before, after, path)
    assert.equal(staticWebpCacheCpuAllowsFileChange(path), true, path)
    assert.deepEqual(staticWebpCacheCpuPriorSource(path, current), original, path)
    assert.equal(staticWebpCacheCpuPriorSource(path, current.toString('utf8')), original.toString('utf8'), path)
    assert.equal(staticWebpCacheCpuPriorSource(path, original), original, path)
    const tampered = Buffer.concat([current, Buffer.from('\n')])
    assert.equal(staticWebpCacheCpuPriorSource(path, tampered), tampered, 'an unreviewed edit is never normalized')
  }
  for (const path of ['package.json', 'pnpm-lock.yaml', 'vercel.json', 'lib/discovery/sofia-catalogue.mjs', 'lib/discovery/public-details.mjs',
    'lib/booking-engine.mjs', 'components/discovery-business-card.js', 'components/public-service-menu.js', 'public/service-photos/haircut-v1.webp']) {
    assert.equal(staticWebpCacheCpuAllowsFileChange(path), false, path)
  }
})

test('only versioned repository WebP paths gain a one-day public cache; live reservable and private routes keep their headers', async () => {
  const baselineSource = git('show', receipt.baseline + ':next.config.mjs')
  const original = (await import('data:text/javascript;base64,' + baselineSource.toString('base64'))).default
  const deployed = (await import('../next.config.mjs')).default
  const { headers: beforeHeaders, ...beforeSettings } = original, { headers: liveHeaders, ...liveSettings } = deployed
  assert.deepEqual(liveSettings, beforeSettings, 'all other Next settings, including security flags, are unchanged')

  const before = await beforeHeaders(), current = await liveHeaders()
  const previousSources = new Set(before.map(rule => rule.source))
  assert.deepEqual(current.filter(rule => previousSources.has(rule.source)), before, 'all existing response headers retain their sources, values and order')
  const added = current.filter(rule => !previousSources.has(rule.source))
  assert.deepEqual(added, ['category-photos', 'service-photos', 'business-cover-photos'].map(directory => ({
    source: `/${directory}/:asset([a-z0-9_-]+-v[0-9]+).webp`,
    headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }],
  })))

  // Exercise the installed Next.js custom route parser, not a reimplementation
  // of its wildcard semantics. Compare the effective headers as requests see them.
  const { tryToParsePath } = require('next/dist/lib/try-to-parse-path')
  const compile = rules => rules.map(rule => {
    const { regexStr, error } = tryToParsePath(rule.source)
    assert.equal(error, undefined, rule.source)
    assert.ok(regexStr, rule.source)
    return [new RegExp(regexStr), rule.headers]
  })
  const effective = (rules, url) => Object.fromEntries(rules.flatMap(([pattern, headers]) =>
    pattern.test(new URL(url, 'https://gorez.invalid').pathname) ? headers.map(({ key, value }) => [key.toLowerCase(), value]) : []))
  const originalRules = compile(before), liveRules = compile(current)
  for (const url of ['/category-photos/beauty-v3.webp', '/service-photos/go-final-quickfit-mat-solo-20261127-v1.webp',
    '/business-cover-photos/activity-sx-child-language-group-v1.webp']) {
    assert.deepEqual(effective(liveRules, url), { ...effective(originalRules, url), 'cache-control': 'public, max-age=86400' }, url)
  }
  for (const url of ['/', '/search?lang=en', '/booking/fixture', '/admin/catalogue', '/dashboard/account',
    '/api/public/discovery', '/api/public/discovery/business/fixture?photos=1', '/api/public/availability',
    '/api/catalogue-media/fixture.webp', '/catalogue-media/fixture-v1.webp', '/api/business-media/fixture.webp',
    '/businesses/fixture/gallery-v1.webp', '/_next/image?url=%2Fservice-photos%2Ffixture-v1.webp',
    '/service-photos/cover.webp', '/service-photos/cover-v.webp', '/service-photos/cover-v1.jpg',
    '/service-photos/cover-v1.webp.extra', '/service-photos/more/cover-v1.webp']) {
    assert.deepEqual(effective(liveRules, url), effective(originalRules, url), url)
  }
})
