import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import receipt from './fixtures/catalogue-mopart-20261127-approval.json' with { type: 'json' }

const root = fileURLToPath(new URL('../', import.meta.url))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const frozen = new Map()

function exactFile(path, expected) {
  if (!expected) return false
  try {
    const file = new URL('../' + path, import.meta.url), info = lstatSync(file)
    return info.isFile() && !(info.mode & 0o111) && sha256(readFileSync(file)) === expected
  } catch { return false }
}

export const mopartIntakeAllowsFileChange = path => Object.hasOwn(receipt.changed, path) && exactFile(path, receipt.changed[path].after)
export const mopartIntakeAllowsNewFile = path => Object.hasOwn(receipt.added, path) && exactFile(path, receipt.added[path])
export const mopartIntakeAllowsPath = path => mopartIntakeAllowsFileChange(path) || mopartIntakeAllowsNewFile(path)

// Expose the preceding state to historical guards only after matching the
// reviewed entire file; a wider edit must remain visible to those guards.
export function mopartIntakePriorSource(path, source) {
  if (!Object.hasOwn(receipt.changed, path)) return source
  const { before, after } = receipt.changed[path]
  if (sha256(source) !== after) return source
  if (!frozen.has(path)) {
    const original = execFileSync('git', ['show', receipt.baseline + ':' + path], { cwd: root, maxBuffer: 5 * 1024 * 1024 })
    if (sha256(original) !== before) throw Error('Mopart cannot restore pinned source: ' + path)
    frozen.set(path, original)
  }
  const original = frozen.get(path)
  return typeof source === 'string' ? original.toString('utf8') : Buffer.from(original)
}

export function mopartIntakePriorCatalogue(rows) {
  let seen = false
  return rows.filter(row => {
    if (row?.id !== receipt.record.id) return true
    if (seen) throw Error('Duplicate Mopart record: ' + row.id)
    if (sha256(JSON.stringify(row)) !== receipt.record.sha256) throw Error('Unreviewed Mopart record: ' + row.id)
    seen = true
    return false
  })
}
