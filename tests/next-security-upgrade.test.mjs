import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readlink } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import {
  NEXT_SECURITY_UPGRADE_BASE,
  NEXT_SECURITY_SOURCE_VERSION,
  NEXT_SECURITY_TARGET_VERSION,
  NEXT_SECURITY_UPGRADE_FILES,
  nextSecurityUpgradeAllowsFileChange,
} from './next-security-upgrade-scope.mjs'
import { stationaryDiscoveryAllowsFileChange, stationaryDiscoveryAllowsNewFile } from './stationary-discovery-scope.mjs'
import { publicActionAllowsFileChange, publicActionAllowsNewFile } from './public-action-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const baseline = path => git('show', NEXT_SECURITY_UPGRADE_BASE + ':' + path)
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const reviewedHashes = {
  'package.json': '7240ba25c7511cd6515a63ee9f2c867e480f464511f87858d6c9ad54ebc82ff4',
  'pnpm-lock.yaml': '927eea8f064520b376b1edb1729dcc1a52f5aef295be13b201140374b08097d6',
  'next.config.mjs': '268b157e05bdbee30e07046a94ecfad40209d60223b88cbcfd9e703e7aa0844e',
}

test('security authorization covers precisely the three reviewed dependency/config files, not the historical UI/data allowlists', async () => {
  assert.deepEqual([...NEXT_SECURITY_UPGRADE_FILES].sort(), ['next.config.mjs', 'package.json', 'pnpm-lock.yaml'])
  assert.equal(NEXT_SECURITY_SOURCE_VERSION, '16.4.1')
  assert.equal(NEXT_SECURITY_TARGET_VERSION, '16.4.6')
  for (const [path, hash] of Object.entries(reviewedHashes)) assert.equal(sha256(await read(path)), hash, path + ': changes require a new explicit dependency/config review')
  const historicalScope = await read('tests/discovery-refinement-20261122-scope.mjs')
  assert.equal(historicalScope, baseline('tests/discovery-refinement-20261122-scope.mjs'), 'do not expand or rewrite the historical category/media/data exception list')
})

test('only the exact Next security patch changes the manifest; installed Next/env match and React, pnpm and the existing Zod override stay unchanged', async () => {
  const before = baseline('package.json'), current = await read('package.json')
  assert.equal(before.split('"next": "16.4.1"').length, 2)
  assert.equal(current, before.replace('"next": "16.4.1"', '"next": "16.4.6"'))
  const packageJson = JSON.parse(current)
  assert.equal(packageJson.packageManager, 'pnpm@11.25.0')
  assert.equal(packageJson.dependencies.next, NEXT_SECURITY_TARGET_VERSION)
  assert.equal(packageJson.dependencies.react, '19.3.0')
  assert.equal(packageJson.dependencies['react-dom'], '19.3.0')
  assert.equal(await read('pnpm-workspace.yaml'), baseline('pnpm-workspace.yaml'))
  const requireFromNext = createRequire(import.meta.resolve('next/package.json'))
  const installedNext = JSON.parse(await readFile(requireFromNext.resolve('next/package.json'), 'utf8'))
  const installedEnv = JSON.parse(await readFile(requireFromNext.resolve('@next/env/package.json'), 'utf8'))
  assert.equal(installedNext.version, NEXT_SECURITY_TARGET_VERSION)
  assert.equal(installedEnv.version, NEXT_SECURITY_TARGET_VERSION)
  const swc = Object.entries(installedNext.optionalDependencies).filter(([name]) => name.startsWith('@next/swc-'))
  assert.equal(swc.length, 8)
  for (const [name, version] of swc) assert.equal(version, NEXT_SECURITY_TARGET_VERSION, name)
})

function canonicalLock(text) {
  // Every changed reference is the same Next version or its own env/SWC
  // package. Package hash pinning above retains the exact reviewed artifacts.
  const resolutions = []
  const normalized = text.replaceAll(NEXT_SECURITY_TARGET_VERSION, NEXT_SECURITY_SOURCE_VERSION)
    .replace(/^  ('@next\/(?:env|swc-[a-z0-9-]+)@16\.4\.1'|next@16\.4\.1):\n    resolution: \{integrity: sha512-[A-Za-z0-9+/=]+\}/gm, (_, name) => {
      resolutions.push(name.replace(/^'|'$/g, '').replace(/@16\.4\.1$/, ''))
      return '  ' + name + ':\n    resolution: {integrity: REVIEWED_NEXT_PATCH_ARTIFACT}'
    })
  return { normalized, resolutions: resolutions.sort() }
}

test('the lockfile changes only Next/env/eight SWC versions and their integrity records, plus Next peer references; all unrelated resolution bytes are identical', async () => {
  const before = canonicalLock(baseline('pnpm-lock.yaml')), current = canonicalLock(await read('pnpm-lock.yaml'))
  assert.deepEqual(current.resolutions, [
    '@next/env',
    '@next/swc-darwin-arm64', '@next/swc-darwin-x64',
    '@next/swc-linux-arm64-gnu', '@next/swc-linux-arm64-musl',
    '@next/swc-linux-x64-gnu', '@next/swc-linux-x64-musl',
    '@next/swc-win32-arm64-msvc', '@next/swc-win32-x64-msvc',
    'next',
  ].sort())
  assert.deepEqual(current.resolutions, before.resolutions)
  assert.equal(current.normalized, before.normalized, 'React, analytics, Sharp, Supabase, overrides, lock settings and all other dependencies must not move during this same-major security patch')
})

test('security reminders are the only config addition; all privacy/cache headers, origins and default feature/security settings remain exact', async () => {
  const before = baseline('next.config.mjs'), current = await read('next.config.mjs')
  const anchor = "  allowedDevOrigins: ['127.0.0.1'],\n"
  assert.equal(before.split(anchor).length, 2)
  assert.equal(current, before.replace(anchor, anchor + "  experimental: { agentUpgrade: 'security' },\n"))
  const originalConfig = (await import('data:text/javascript;base64,' + Buffer.from(before).toString('base64'))).default
  const nextConfig = (await import('../next.config.mjs')).default
  assert.deepEqual(nextConfig.experimental, { agentUpgrade: 'security' })
  assert.deepEqual(Object.keys(nextConfig).sort(), [...Object.keys(originalConfig), 'experimental'].sort())
  assert.deepEqual(nextConfig.allowedDevOrigins, originalConfig.allowedDevOrigins)
  assert.deepEqual(await nextConfig.headers(), await originalConfig.headers(), 'no weakening of no-store, no-referrer, strict-origin, robots or other existing response headers')
  assert.equal(nextConfig.images, undefined, 'the image optimizer keeps its default SVG/network restrictions')
})

const productionPath = path => path !== 'node_modules' && !/^(?:tests|docs)\//.test(path) && !/\.(?:md|txt)$/i.test(path)
const tree = git('ls-tree', '-r', '-z', NEXT_SECURITY_UPGRADE_BASE).split('\0').filter(Boolean).map(record => {
  const [metadata, path] = record.split('\t'), [mode, type, oid] = metadata.split(' ')
  return { mode, type, oid, path }
}).filter(record => record.type === 'blob' && productionPath(record.path))

test('every other production byte and path stays frozen to the last approved UI commit; no APIs, business data, prices, images, analytics or booking code changes', async () => {
  const frozen = tree.filter(record => !nextSecurityUpgradeAllowsFileChange(record.path) && !stationaryDiscoveryAllowsFileChange(record.path) && !publicActionAllowsFileChange(record.path))
  for (let offset = 0; offset < frozen.length; offset += 32) await Promise.all(frozen.slice(offset, offset + 32).map(async record => {
    const path = new URL('../' + record.path, import.meta.url)
    const bytes = record.mode === '120000' ? Buffer.from(await readlink(path)) : await readFile(path)
    assert.equal(createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex'), record.oid, record.path + ' remains unchanged from ' + NEXT_SECURITY_UPGRADE_BASE)
  }))
  const current = git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(path => path && productionPath(path) && !publicActionAllowsNewFile(path) && !stationaryDiscoveryAllowsNewFile(path))
  assert.deepEqual([...new Set(current)].sort(), tree.map(record => record.path).sort(), 'the security upgrade adds no new production paths')
})
