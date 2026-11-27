import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/homepage-browse-start-approval.json' with { type: 'json' }
import { publicFirstLoadAllowsFileChange } from './public-first-load-optimization-scope.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const prior = new Map()

function reviewedFile(path, digest) {
  if (!digest) return false
  try {
    const file = new URL('../' + path, import.meta.url), stat = lstatSync(file)
    return stat.isFile() && !(stat.mode & 0o111) && sha(readFileSync(file)) === digest
  } catch { return false }
}

export const homepageBrowseStartAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && reviewedFile(path, receipt.changed[path].after)
export const homepageBrowseStartAllowsNewFile = path => Object.hasOwn(receipt.added, path) && reviewedFile(path, receipt.added[path])
export const homepageBrowseStartAllowsPath = path => homepageBrowseStartAllowsFileChange(path) || homepageBrowseStartAllowsNewFile(path) || publicFirstLoadAllowsFileChange(path)

// Historical checks still compare their own original, exact source bytes.
// Only the reviewed whole-file digest can be rewound; unrelated edits stay visible.
export function homepageBrowseStartPriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (sha(source) !== after) return source
  if (!prior.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root })
    if (sha(original) !== before) throw Error('Homepage browse baseline checksum mismatch: ' + path)
    prior.set(path, original)
  }
  const original = prior.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}
