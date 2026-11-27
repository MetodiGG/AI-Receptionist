import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/public-detail-photo-preview-approval.json' with { type: 'json' }
import { preparedPhotosPriorSource } from './mobile-details-prepared-photos-scope.mjs'
import { appointmentGrowthPriorSource } from './catalogue-verified-sofia-appointment-growth-20261127-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

// Both lines of work can follow the same preview snapshot. Each adapter
// requires its reviewed whole-file digest; unrelated edits survive both.
function atPreview(path, source, expected) {
  if (sha(source) === expected) return source
  const withoutPrepared = preparedPhotosPriorSource(path, source)
  return sha(withoutPrepared) === expected ? withoutPrepared : appointmentGrowthPriorSource(path, withoutPrepared)
}

function exactCurrent(path, hash) {
  if (!hash) return false
  try {
    const file = new URL('../' + path, import.meta.url), mode = lstatSync(file)
    return mode.isFile() && !(mode.mode & 0o111) && sha(atPreview(path, readFileSync(file), hash)) === hash
  } catch { return false }
}

export const detailPreviewAllowsFileChange = path => exactCurrent(path, receipt.changed[path]?.after)
export const detailPreviewAllowsNewFile = path => exactCurrent(path, receipt.added[path])
export const detailPreviewAllowsPath = path => detailPreviewAllowsFileChange(path) || detailPreviewAllowsNewFile(path)

export function detailPreviewPriorSource(path, source) {
  const revision = receipt.changed[path] ?? receipt.adapters?.[path]
  if (!revision) return preparedPhotosPriorSource(path, source)
  if (sha(atPreview(path, source, revision.after)) !== revision.after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== revision.before) throw Error('Public detail baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  const old = prior.get(path)
  return typeof source === 'string' ? old.toString('utf8') : Buffer.from(old)
}
