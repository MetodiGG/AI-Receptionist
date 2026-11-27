import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Immutable verification anchors for the two independent, tested histories.
// A historical test may ignore only the exact unchanged blob from the other
// branch, never a path pattern that would accept later arbitrary edits.
export const integrationBase = '0bb9c0a4e242b1321b2d115576bcc368dad8e204'
export const publishedBaseline = '1ac4b71a871715cb8afd7d2c38ec17d7caefc666'
export const verifiedCatalogueTip = 'c90930e1f7d1aa1b20bde5e3893a9ec27267ffdc'
const releaseRuleHash = 'a4a7f69aa68cb90c6a734169d901f0632a4faee0'
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
    const bytes = readFileSync(file)
    return createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex') === hash
  } catch {
    return false
  }
}
export const releaseRuleMatches = path => path === 'AGENTS.md' && matches(path, releaseRuleHash, '100644')
export const publishedBaselineMatches = path => {
  const snapshot = publishedRuntime.get(path)
  return releaseRuleMatches(path) || Boolean(snapshot && matches(path, snapshot.hash, snapshot.mode))
}
export const approvedCatalogueMatches = path => {
  const snapshot = approvedCatalogueRuntime.get(path)
  return releaseRuleMatches(path) || Boolean(snapshot && matches(path, snapshot.hash, snapshot.mode))
}
