import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'

// Dated approval tests retain every original preserved-image, exact-count and
// visual-distinctness assertion. Only their graph uses the exact predecessor;
// production imports and the new provider-role contract tests stay live.
const root = new URL('../', import.meta.url)
const historyTag = 'provider-role-photo-history'
const predecessor = 'f6cab3a9ea894b6b285dee886b549f1021400389'
const originalHashes = new Map([
  ['lib/public-business-cover-photo.mjs', '862b0b040d92bf2aa8ba6f1a7fbc373f5b9c01f2843e358a5e6107edf01ed7fc'],
  ['lib/service-detail-photo-presentation.mjs', 'f45821d4f3c34a14ed59372d099b61f17486b042657786807397e78ace35c6af'],
])
const waveSource = new URL('lib/service-detail-photo-presentation.mjs', root)
const waves = new Set(['first', 'followup', 'tail', 'final'])
const sha = bytes => createHash('sha256').update(bytes).digest('hex')

function isWave(url) {
  return url.protocol === 'file:' && url.pathname === waveSource.pathname && waves.has(url.searchParams.get('before-detail-wave'))
}
function isHistory(value) {
  try {
    const url = new URL(value)
    return url.searchParams.get(historyTag) === predecessor || isWave(url)
  } catch { return false }
}

function registration() {
  return registerHooks({
    resolve(specifier, context, nextResolve) {
      const result = nextResolve(specifier, context)
      if (!isHistory(context.parentURL) && !isHistory(result.url)) return result
      const url = new URL(result.url)
      // The audit's own earlier-wave hook matches this exact URL. Keep it
      // unchanged while still isolating its dependency graph through parentURL.
      if (isWave(url)) return result
      if (url.protocol === 'file:' && url.href.startsWith(root.href) && /\.(?:mjs|js)$/u.test(url.pathname)) {
        url.searchParams.set(historyTag, predecessor)
        return { ...result, url: url.href }
      }
      return result
    },
    load(url, context, nextLoad) {
      if (!isHistory(url)) return nextLoad(url, context)
      const file = new URL(url)
      if (isWave(file)) return nextLoad(url, context)
      file.search = ''
      const path = file.href.startsWith(root.href) ? file.href.slice(root.href.length) : ''
      if (!originalHashes.has(path)) return nextLoad(url, context)
      const current = readFileSync(file)
      const source = providerRolePhotosPriorSource(path, current)
      assert.equal(sha(source), originalHashes.get(path),
        'Historical photo imports require the exact predecessor or independently sealed successor: ' + path)
      return { format: 'module', source, shortCircuit: true }
    },
  })
}

async function withHistory(path, callback) {
  assert.ok(path.startsWith('lib/') || path.startsWith('scripts/'), 'only repository photo modules may be loaded')
  const url = new URL(path, root)
  assert.ok(url.href.startsWith(root.href), 'the historical graph stays in the repository')
  url.searchParams.set(historyTag, predecessor)
  const hook = registration()
  try { return await callback(await import(url.href)) } finally { hook.deregister() }
}

export async function historicalPhotoModule(path) {
  return withHistory(path, module => module)
}

export async function auditHistoricalServiceDetailGapWave(options) {
  // Keep dependency isolation active for the audit's dynamic earlier-wave load.
  return withHistory('scripts/audit-service-detail-gap-wave.mjs', module => module.auditServiceDetailGapWave(options))
}

export const { auditPublicDetailServicePhotos: auditHistoricalPublicDetailServicePhotos } =
  await historicalPhotoModule('scripts/audit-public-detail-service-photos.mjs')

export const { businessCoverPhotoSources: historicalBusinessCoverPhotoSources } =
  await historicalPhotoModule('lib/public-business-cover-photo.mjs')

export const { publicDetailServiceThumbnail: historicalPublicDetailServiceThumbnail } =
  await historicalPhotoModule('lib/service-detail-photo-presentation.mjs')
