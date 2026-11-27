import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/mobile-details-prepared-photos-approval.json' with { type: 'json' }
import { providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'
import { businessOnboardingSofiaPriorSource } from './business-onboarding-sofia-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = source => createHash('sha256').update(source).digest('hex')
const prior = new Map()

function exactCurrent(path, expected) {
  if (!expected) return false
  try {
    const file = new URL('../' + path, import.meta.url)
    const mode = lstatSync(file)
    return mode.isFile() && !(mode.mode & 0o111) && sha(businessOnboardingSofiaPriorSource(path, readFileSync(file))) === expected
  } catch { return false }
}

export const preparedPhotosAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && exactCurrent(path, receipt.changed[path].after)
export const preparedPhotosAllowsNewFile = path => Object.hasOwn(receipt.added, path) && exactCurrent(path, receipt.added[path])
export const preparedPhotosAllowsPath = path => preparedPhotosAllowsFileChange(path) || preparedPhotosAllowsNewFile(path)

// Historical checks see the exact earlier bytes only for a reviewed successor.
// Modified files or other paths never gain an exemption by name alone.
export function preparedPhotosPriorSource(path, source) {
  source = businessOnboardingSofiaPriorSource(path, source)
  source = providerRolePhotosPriorSource(path, source)
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Prepared public service photo baseline does not match pinned source: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
