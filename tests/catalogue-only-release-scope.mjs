import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { providerRolePhotosAllowsFileChange, providerRolePhotosAllowsNewFile, providerRolePhotosPriorSource } from './provider-role-photo-scope.mjs'
import { businessOnboardingSofiaAllowsFileChange, businessOnboardingSofiaAllowsNewFile, businessOnboardingSofiaPriorSource } from './business-onboarding-sofia-scope.mjs'

// Immutable verification anchors for the two independent, tested histories.
// A historical test may ignore only the exact unchanged blob from the other
// branch, never a path pattern that would accept later arbitrary edits.
export const integrationBase = '0bb9c0a4e242b1321b2d115576bcc368dad8e204'
export const publishedBaseline = '1ac4b71a871715cb8afd7d2c38ec17d7caefc666'
export const verifiedCatalogueTip = 'c90930e1f7d1aa1b20bde5e3893a9ec27267ffdc'
const releaseRuleHash = 'a4a7f69aa68cb90c6a734169d901f0632a4faee0'
const standingRuleHistoryAdapters = new Map([
  ['tests/catalogue-expiry-20261126-scope.mjs', {
    before: 'e906a39027cb93b38026a5671722c299f749f422',
    after: '0397e9b46d6f6d72c03fe0ca4e4bf698c4b76cfc',
  }],
])
const root = fileURLToPath(new URL('../', import.meta.url))
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 8 * 1024 * 1024 })
const parseRuntime = commit => {
  const parts = git('diff', '--raw', '-z', '--no-abbrev', '--no-renames', integrationBase, commit, '--').toString('utf8').split('\0')
  const out = new Map()
  for (let index = 0; index + 1 < parts.length; index += 2) {
    const [previousMode, nextMode, previousHash, nextHash, action] = parts[index].slice(1).split(' ')
    const path = parts[index + 1]
    if (!path || path.startsWith('tests/')) continue
    if (!['M', 'A'].includes(action) || !['100644', '100755'].includes(nextMode)) throw new Error('Unexpected baseline mutation: ' + path)
    out.set(path, { hash: nextHash, mode: nextMode, prior: previousHash, previousMode })
  }
  return out
}
export const publishedRuntime = parseRuntime(publishedBaseline)
export const approvedCatalogueRuntime = parseRuntime(verifiedCatalogueTip)
function matches(path, hash, mode) {
  if (!hash) return false
  const file = new URL('../' + path, import.meta.url)
  try {
    const st = lstatSync(file)
    if (!st.isFile() || (st.mode & 0o111 ? '100755' : '100644') !== mode) return false
    const bytes = providerRolePhotosPriorSource(path, businessOnboardingSofiaPriorSource(path, readFileSync(file)))
    return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex') === hash
  } catch {
    return false
  }
}
export function releaseRuleMatches(path, source) {
  if (path !== 'AGENTS.md' || !matches(path, releaseRuleHash, '100644')) return false
  if (source === undefined) return true
  try {
    const bytes = Buffer.from(source)
    return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex') === releaseRuleHash
  } catch {
    return false
  }
}

// Preserve the old performance receipt's exact helper preimage after this
// reviewed, test-only rules adapter. Neither changed input nor changed disk
// bytes/mode can gain an exemption merely from the helper pathname.
export function standingRuleHistoryPriorSource(path, source) {
  const change = standingRuleHistoryAdapters.get(path)
  if (!change || !matches(path, change.after, '100644')) return source
  const bytes = Buffer.from(source)
  if (createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex') !== change.after) return source
  const published = git('show', publishedBaseline + ':' + path)
  if (createHash('sha1').update('blob ' + published.length + '\0').update(published).digest('hex') !== change.before) {
    throw Error('Standing-rule history adapter predecessor mismatch: ' + path)
  }
  return typeof source === 'string' ? published.toString('utf8') : Buffer.from(published)
}
// A file unchanged in an earlier publication may be absent from its diff map.
// Accept only the exact independently sealed successor whose restored bytes
// equal that publication's actual immutable snapshot, not a path exemption.
function roleMatchedPreimageMatchesSnapshot(path, commit) {
  if (!providerRolePhotosAllowsFileChange(path)) return false
  try {
    const current = readFileSync(new URL('../' + path, import.meta.url))
    const original = providerRolePhotosPriorSource(path, current)
    return !original.equals(current) && original.equals(git('show', commit + ':' + path))
  } catch { return false }
}

function onboardingPreimageMatchesSnapshot(path, commit) {
  if (!businessOnboardingSofiaAllowsFileChange(path)) return false
  try {
    const current = readFileSync(new URL('../' + path, import.meta.url))
    const original = businessOnboardingSofiaPriorSource(path, current)
    return !original.equals(current) && original.equals(git('show', commit + ':' + path))
  } catch { return false }
}

export const publishedBaselineMatches = path => {
  const snapshot = publishedRuntime.get(path)
  return businessOnboardingSofiaAllowsNewFile(path) || providerRolePhotosAllowsNewFile(path) || releaseRuleMatches(path) ||
    Boolean(snapshot && matches(path, snapshot.hash, snapshot.mode)) || roleMatchedPreimageMatchesSnapshot(path, publishedBaseline) || onboardingPreimageMatchesSnapshot(path, publishedBaseline)
}
export const approvedCatalogueMatches = path => {
  const snapshot = approvedCatalogueRuntime.get(path)
  return businessOnboardingSofiaAllowsNewFile(path) || providerRolePhotosAllowsNewFile(path) || releaseRuleMatches(path) ||
    Boolean(snapshot && matches(path, snapshot.hash, snapshot.mode)) || roleMatchedPreimageMatchesSnapshot(path, verifiedCatalogueTip) || onboardingPreimageMatchesSnapshot(path, verifiedCatalogueTip)
}
