import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/discovery-performance-approval.json' with { type: 'json' }
import { detailPreviewAllowsFileChange, detailPreviewAllowsNewFile, detailPreviewPriorSource } from './public-detail-photo-preview-scope.mjs'
import { preparedPhotosAllowsFileChange, preparedPhotosAllowsNewFile } from './mobile-details-prepared-photos-scope.mjs'
import { staticWebpCacheCpuAllowsFileChange, staticWebpCacheCpuPriorSource } from './discovery-static-webp-cache-cpu-scope.mjs'
import { mobileDiscoveryFirstPaintAllowsFileChange, mobileDiscoveryFirstPaintPriorSource } from './mobile-discovery-first-paint-scope.mjs'
import { homepageBrowseStartAllowsFileChange, homepageBrowseStartAllowsNewFile, homepageBrowseStartPriorSource } from './homepage-browse-start-scope.mjs'
import { publicFirstLoadAllowsFileChange } from './public-first-load-optimization-scope.mjs'
import { catalogueIntakeAllowsFileChange, catalogueIntakeAllowsNewFile, catalogueIntakePriorSource } from './catalogue-mopart-20261127-scope.mjs'
import { garage46PriorSource } from './catalogue-garage46-serdika-20261127-scope.mjs'
import { releaseRuleMatches } from './catalogue-only-release-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

function currentHash(path, digest, priorSource = (_, source) => source) {
  if (!digest) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(staticWebpCacheCpuPriorSource(path, priorSource(path, readFileSync(file)))) === digest
  } catch { return false }
}

export const discoveryPerformanceAllowsFileChange = path => releaseRuleMatches(path) || catalogueIntakeAllowsFileChange(path) || publicFirstLoadAllowsFileChange(path) || homepageBrowseStartAllowsFileChange(path) || mobileDiscoveryFirstPaintAllowsFileChange(path) || staticWebpCacheCpuAllowsFileChange(path) || preparedPhotosAllowsFileChange(path) || detailPreviewAllowsFileChange(path) || currentHash(path, receipt.changed[path]?.after)
// The original cover-only module was NEW here and later acquired one sealed
// branch illustration. Verify its exact preimage, not just a known pathname.
export const discoveryPerformanceAllowsNewFile = path => catalogueIntakeAllowsNewFile(path) || homepageBrowseStartAllowsNewFile(path) || preparedPhotosAllowsNewFile(path) || detailPreviewAllowsNewFile(path) ||
  currentHash(path, receipt.added[path], garage46PriorSource)
export const discoveryPerformanceAllowsPath = path => discoveryPerformanceAllowsFileChange(path) || discoveryPerformanceAllowsNewFile(path)

// Keep previous approvals enforceable. Only revert a reviewed whole-file
// performance delta under historical tests; unreviewed bytes stay visible.
export function discoveryPerformancePriorSource(path, source) {
  source = homepageBrowseStartPriorSource(path, source)
  source = mobileDiscoveryFirstPaintPriorSource(path, source)
  source = detailPreviewPriorSource(path, catalogueIntakePriorSource(path, staticWebpCacheCpuPriorSource(path, source)))
  const change = receipt.changed[path] ?? receipt.adapters[path]
  if (!change || sha(source) !== change.after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== change.before) throw Error('Performance baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
