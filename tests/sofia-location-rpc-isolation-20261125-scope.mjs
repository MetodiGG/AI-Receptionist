import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/sofia-location-rpc-isolation-20261125-approval.json' with { type: 'json' }
import { mobileCatalogueAllowsFileChange, mobileCatalogueAllowsNewFile, mobileCataloguePriorSource } from './mobile-catalogue-hotfix-scope.mjs'
import { posterGlassAllowsFileChange, posterGlassMatchesPriorHash } from './poster-glass-20261126-scope.mjs'
import { catalogueExpiryAllowsFileChange, catalogueExpiryAllowsNewFile, catalogueExpiryMatchesPriorHash } from './catalogue-expiry-20261126-scope.mjs'
import { posterPolishAllowsFileChange, posterPolishAllowsNewFile, posterPolishMatchesPriorHash } from './poster-polish-20261126-scope.mjs'
import { serviceDetailPhotoCoverageAllowsNewFile } from './service-detail-photo-coverage-20261126-scope.mjs'
import { preServicePhotoMarkerSource } from './service-photo-marker-20261126-scope.mjs'
import { serviceDetailPhotoExpansionAllowsNewFile } from './service-detail-photo-expansion-20261126-scope.mjs'
import { dialogPrimaryDarkContrastAllowsFileChange, preDialogPrimaryDarkContrastSource } from './dialog-primary-dark-contrast-20261126-scope.mjs'
import { discoveryPerformanceAllowsFileChange, discoveryPerformanceAllowsNewFile, discoveryPerformancePriorSource } from './discovery-performance-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()
function exactFile(path, map, hashFor) {
  if (!Object.hasOwn(map, path)) return false
  try { return sha(readFileSync(new URL('../' + path, import.meta.url))) === hashFor(map[path]) }
  catch { return false }
}
export const sofiaRpcAllowsFileChange = path => discoveryPerformanceAllowsFileChange(path) || dialogPrimaryDarkContrastAllowsFileChange(path) || posterPolishAllowsFileChange(path) || catalogueExpiryAllowsFileChange(path) || posterGlassAllowsFileChange(path) || mobileCatalogueAllowsFileChange(path) || exactFile(path, receipt.changed, value => value.after)
export const sofiaRpcAllowsNewFile = path => discoveryPerformanceAllowsNewFile(path) || serviceDetailPhotoExpansionAllowsNewFile(path) || serviceDetailPhotoCoverageAllowsNewFile(path) || posterPolishAllowsNewFile(path) || catalogueExpiryAllowsNewFile(path) || mobileCatalogueAllowsNewFile(path) || exactFile(path, receipt.added, value => value)
export const sofiaRpcMatchesPriorHash = (path, hash) => posterPolishMatchesPriorHash(path, hash) || catalogueExpiryMatchesPriorHash(path, hash) || posterGlassMatchesPriorHash(path, hash) || Boolean(hash && Object.hasOwn(receipt.changed, path)
  && receipt.changed[path].before === hash && sofiaRpcAllowsFileChange(path))

// Strip only the exact November 25 release before invoking an older inverse.
// Never deduce reviewed bytes from the working tree or a mutable branch name.
export function sofiaRpcPriorSource(path, source) {
  source = discoveryPerformancePriorSource(path, source)
  source = mobileCataloguePriorSource(path, preServicePhotoMarkerSource(path, preDialogPrimaryDarkContrastSource(path, source)))
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path], hash = sha(source)
  if (hash === before) return source
  if (hash !== after) throw Error('Unreviewed 25 Nov Sofia location RPC delta: ' + path)
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Sofia location RPC baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  return typeof source === 'string' ? prior.get(path).toString('utf8') : Buffer.from(prior.get(path))
}
