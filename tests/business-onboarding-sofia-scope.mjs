import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/business-onboarding-sofia-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = source => createHash('sha256').update(source).digest('hex')
const digest = /^[a-f0-9]{64}$/u
const changedPaths = new Set([
  'components/business-onboarding.js', 'components/business-setup.js', 'components/business-location-fields.js',
  'components/booking-mode-fields.js', 'components/catalogue-business-lookup.js', 'components/business-profile.js', 'components/public-booking-page.js',
  'app/businesses/catalogue/[id]/page.js', 'app/business-profile.css', 'lib/business-application.mjs', 'app/dashboard/settings/page.js',
])
const addedPaths = new Set(['app/business-signup-refresh.css', 'components/owner-business-client-preview.js', 'app/dashboard/settings/settings-profile.module.css'])
const prior = new Map()

function exactCurrent(path, expected) {
  if (typeof expected !== 'string' || !digest.test(expected)) return false
  try {
    const file = new URL('../' + path, import.meta.url), info = lstatSync(file)
    return info.isFile() && !(info.mode & 0o111) && sha(readFileSync(file)) === expected
  } catch { return false }
}

export const businessOnboardingSofiaAllowsFileChange = path => changedPaths.has(path) &&
  Object.hasOwn(receipt.changed, path) && exactCurrent(path, receipt.changed[path].after)
export const businessOnboardingSofiaAllowsNewFile = path => addedPaths.has(path) &&
  Object.hasOwn(receipt.added, path) && exactCurrent(path, receipt.added[path])
export const businessOnboardingSofiaAllowsPath = path => businessOnboardingSofiaAllowsFileChange(path) || businessOnboardingSofiaAllowsNewFile(path)

// Restore only the independently reviewed successor's exact whole-file source.
// Supplied AND on-disk bytes, regular-file mode and immutable predecessor must
// all match. Current functional onboarding tests never use this history layer.
export function businessOnboardingSofiaPriorSource(path, source) {
  if (!changedPaths.has(path) || !Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (!digest.test(before ?? '') || !businessOnboardingSofiaAllowsFileChange(path) || sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
    if (sha(original) !== before) throw Error('Business-onboarding Sofia predecessor differs from its exact receipt: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
