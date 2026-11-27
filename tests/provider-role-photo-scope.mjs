import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/provider-role-photo-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const changedPaths = new Set(['lib/public-business-cover-photo.mjs', 'lib/service-detail-photo-presentation.mjs'])
const prior = new Map()

function exactCurrent(path, expected) {
  if (typeof expected !== 'string' || !digest.test(expected)) return false
  try {
    const file = new URL('../' + path, import.meta.url), info = lstatSync(file)
    return info.isFile() && !(info.mode & 0o111) && sha(readFileSync(file)) === expected
  } catch { return false }
}

export const providerRolePhotosAllowsFileChange = path => changedPaths.has(path) &&
  Object.hasOwn(receipt.changed, path) && exactCurrent(path, receipt.changed[path].after)
export const providerRolePhotosAllowsNewFile = path => Object.hasOwn(receipt.added, path) && exactCurrent(path, receipt.added[path])
export const providerRolePhotosAllowsPath = path => providerRolePhotosAllowsFileChange(path) || providerRolePhotosAllowsNewFile(path)

// Test-only inverse of the exact independently reviewed photo successor. Both
// supplied bytes AND the real regular file must match its explicit seal. Old
// historical receipts then continue from the unchanged f6cab3a predecessor.
export function providerRolePhotosPriorSource(path, source) {
  if (!changedPaths.has(path) || !Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (!digest.test(before ?? '') || !providerRolePhotosAllowsFileChange(path) || sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Role-matched photo predecessor does not match its immutable receipt: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
